// app/api/orders/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import Product from '@/models/Product';

// Fields staff can edit on a buyer's behalf (buyers don't log in — this is
// always a teller/admin action, e.g. taken over a phone call).
const EDITABLE_FIELDS = ['customerName', 'customerPhone', 'deliveryType', 'parcelDestination', 'items', 'discount'] as const;

// Editing is only safe before the order has physically left the shop's control.
const LOCKED_STAGES = ['Collected', 'Dispatched'];

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectDB();
  const order = await Order.findById(params.id).populate('teller', 'name').populate('items.product', 'name code').lean();
  if (!order) {
    return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
  }
  return NextResponse.json({ order });
}

// PATCH /api/orders/[id] — staff edits an order (details or items) on the buyer's behalf.
// Body: { changes: { customerName?, customerPhone?, deliveryType?, parcelDestination?, discount?, items? }, reason? }
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectDB();
    const order: any = await Order.findById(params.id);
    if (!order) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    if (LOCKED_STAGES.includes(order.stage)) {
      return NextResponse.json(
        { error: `Order is already "${order.stage}" and can no longer be edited.` },
        { status: 409 }
      );
    }

    const body = await req.json();
    const { changes, reason } = body as { changes: Record<string, unknown>; reason?: string };

    if (!changes || Object.keys(changes).length === 0) {
      return NextResponse.json({ error: 'No changes provided.' }, { status: 400 });
    }

    const diff: Record<string, { from: unknown; to: unknown }> = {};

    for (const field of Object.keys(changes)) {
      if (!EDITABLE_FIELDS.includes(field as any)) {
        return NextResponse.json({ error: `Field "${field}" cannot be edited.` }, { status: 400 });
      }

      if (field === 'items') {
        // Re-price items server-side and recompute totalAmount, same as order creation.
        const newItems = changes.items as { productId: string; variantName: string; quantity: number }[];
        let totalAmount = 0;
        const pricedItems = [];
        for (const item of newItems) {
          const product: any = await Product.findById(item.productId).lean();
          if (!product) return NextResponse.json({ error: `Product ${item.productId} not found.` }, { status: 400 });
          const variant = product.variants.find((v: any) => v.name === item.variantName);
          if (!variant) return NextResponse.json({ error: `Variant "${item.variantName}" not found.` }, { status: 400 });
          pricedItems.push({ product: item.productId, variantName: item.variantName, quantity: item.quantity, priceAtSale: variant.price });
          totalAmount += variant.price * item.quantity;
        }
        diff.items = { from: order.items, to: pricedItems };
        order.items = pricedItems;
        order.totalAmount = totalAmount - (order.discount || 0);
        diff.totalAmount = { from: diff.items.from, to: order.totalAmount };
      } else {
        diff[field] = { from: order[field], to: changes[field] };
        order[field] = changes[field];
      }
    }

    order.editLog.push({
      editedAt: new Date(),
      editedBy: session.user.id,
      changes: diff,
      reason,
    });

    await order.save();

    return NextResponse.json({ order });
  } catch (error: any) {
    console.error('Failed to edit order:', error);
    return NextResponse.json({ error: error.message || 'Failed to edit order.' }, { status: 500 });
  }
}
