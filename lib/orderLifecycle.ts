// lib/orderLifecycle.ts
//
// Owns the Baggo Bags order lifecycle: stage transitions + the exact SMS
// copy for each stage, per spec. Only forward transitions are valid; each
// transition is only allowed from its correct predecessor stage.

import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import { sendSms } from '@/lib/smsService';
import type { OrderStage, DeliveryType } from '@/types';

const BAGGO_CONTACT = '0725023411';
const BAGGO_NAME = 'Baggo Bags Global Kenya';

// Valid predecessor for each stage. 'Collected'/'Dispatched' both follow 'Arrived'
// but which one is reachable depends on the order's deliveryType.
const VALID_PREDECESSOR: Record<OrderStage, OrderStage | null> = {
  Pending: null,
  OnTransit: 'Pending',
  Arrived: 'OnTransit',
  Collected: 'Arrived',
  Dispatched: 'Arrived',
};

function buildMessage(stage: OrderStage, orderId: string, destination?: string): string {
  switch (stage) {
    case 'OnTransit':
      return `Order ${orderId} has been Received for Shipping by ${BAGGO_NAME}.`;
    case 'Arrived':
      return `Order ${orderId} has arrived and is ready for collection. Provide Order Receipt or collection message. Contact ${BAGGO_CONTACT} for Inquiries.`;
    case 'Collected':
      return `Order ${orderId} has been collected. Thank you for Ordering with ${BAGGO_NAME}.`;
    case 'Dispatched':
      return `Order ${orderId} has been dispatched for parceling to ${destination ?? 'your location'}. Thank you for Ordering with ${BAGGO_NAME}.`;
    default:
      throw new Error(`No SMS template defined for stage ${stage}`);
  }
}

interface TransitionResult {
  success: boolean;
  order?: any;
  error?: string;
}

/**
 * Advance an order to a new stage, validating the transition, sending the
 * corresponding SMS, and logging the change. Idempotent-ish: re-calling with
 * the same stage the order is already on is a no-op success (guards against
 * double-clicks / retries).
 */
export async function advanceOrderStage(
  orderId: string,
  targetStage: OrderStage,
  staffUserId: string,
  opts: { destination?: string } = {}
): Promise<TransitionResult> {
  await connectDB();

  const order = await Order.findById(orderId);
  if (!order) return { success: false, error: `Order ${orderId} not found.` };

  if (order.stage === targetStage) {
    return { success: true, order }; // already there, don't re-send SMS
  }

  const requiredPredecessor = VALID_PREDECESSOR[targetStage];
  if (requiredPredecessor !== order.stage) {
    return {
      success: false,
      error: `Invalid transition: order is at "${order.stage}", cannot move to "${targetStage}" (requires "${requiredPredecessor}").`,
    };
  }

  // Branch guard: Collected only valid for Collection orders, Dispatched only for Parcel
  if (targetStage === 'Collected' && order.deliveryType !== 'Collection') {
    return { success: false, error: `Order ${orderId} is a Parcel order — use "Dispatched" instead.` };
  }
  if (targetStage === 'Dispatched' && order.deliveryType !== 'Parcel') {
    return { success: false, error: `Order ${orderId} is a Collection order — use "Collected" instead.` };
  }

  const message =
    targetStage === 'Dispatched'
      ? buildMessage(targetStage, order._id, opts.destination ?? order.parcelDestination)
      : buildMessage(targetStage, order._id);

  const smsResult = await sendSms(order.customerPhone, message);

  order.stage = targetStage;
  order.stageLog.push({
    stage: targetStage,
    changedAt: new Date(),
    changedBy: staffUserId,
    smsSent: smsResult.success,
    smsError: smsResult.error,
  });

  await order.save();

  return { success: true, order };
}
