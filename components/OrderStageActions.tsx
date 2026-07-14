// components/OrderStageActions.tsx
'use client';

import { useState } from 'react';
import type { OrderStage, DeliveryType } from '@/types';

interface OrderStageActionsProps {
  orderId: string;
  currentStage: OrderStage;
  deliveryType: DeliveryType;
  onUpdated?: (newStage: OrderStage) => void;
}

// Maps the current stage to the single valid next action button, per the
// branch rule: Collection orders end at "Collected", Parcel orders end at "Dispatched".
function getNextAction(stage: OrderStage, deliveryType: DeliveryType): { label: string; target: OrderStage } | null {
  if (stage === 'Pending') return { label: 'Mark On Transit', target: 'OnTransit' };
  if (stage === 'OnTransit') return { label: 'Mark Arrived', target: 'Arrived' };
  if (stage === 'Arrived') {
    return deliveryType === 'Collection'
      ? { label: 'Mark In-store Collected', target: 'Collected' }
      : { label: 'Mark Parcel Dispatched', target: 'Dispatched' };
  }
  return null; // Collected / Dispatched are final
}

export default function OrderStageActions({ orderId, currentStage, deliveryType, onUpdated }: OrderStageActionsProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nextAction = getNextAction(currentStage, deliveryType);
  if (!nextAction) {
    return <p className="text-sm text-gray-500">This order is complete — no further actions.</p>;
  }

  const handleAdvance = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: nextAction.target }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update order.');
      onUpdated?.(nextAction.target);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        onClick={handleAdvance}
        disabled={loading}
        className="px-4 py-2 bg-zinc-800 text-white rounded-xl text-sm font-semibold hover:bg-zinc-700 transition disabled:opacity-50"
      >
        {loading ? 'Updating...' : nextAction.label}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
