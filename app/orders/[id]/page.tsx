// app/orders/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import OrderStageActions from '@/components/OrderStageActions';
import type { OrderStage } from '@/types';

interface OrderItem {
  product: { _id: string; name: string; code: string };
  variantName: string;
  quantity: number;
  priceAtSale: number;
}

interface OrderDetail {
  _id: string;
  customerName: string;
  customerPhone: string;
  items: OrderItem[];
  totalAmount: number;
  discount: number;
  deliveryType: 'Collection' | 'Parcel';
  parcelDestination?: string;
  paymentMethod: string;
  stage: OrderStage;
  teller: { name: string };
  stageLog: { stage: string; changedAt: string; smsSent: boolean }[];
  createdAt: string;
}

const LOCKED_STAGES: OrderStage[] = ['Collected', 'Dispatched'];

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ customerName: '', customerPhone: '', deliveryType: 'Collection', parcelDestination: '' });
  const [error, setError] = useState<string | null>(null);

  const fetchOrder = () => {
    fetch(`/api/orders/${params.id}`)
      .then((res) => res.json())
      .then((data) => {
        setOrder(data.order);
        if (data.order) {
          setForm({
            customerName: data.order.customerName,
            customerPhone: data.order.customerPhone,
            deliveryType: data.order.deliveryType,
            parcelDestination: data.order.parcelDestination || '',
          });
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const handleSaveEdit = async () => {
    setError(null);
    try {
      const res = await fetch(`/api/orders/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ changes: form, reason: 'Edited by staff on customer request' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save changes.');
      setOrder(data.order);
      setEditing(false);
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) return <p className="text-sm text-gray-500">Loading order...</p>;
  if (!order) return <p className="text-sm text-gray-500">Order not found.</p>;

  const isLocked = LOCKED_STAGES.includes(order.stage);

  return (
    <div className="max-w-2xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-bold text-zinc-800">{order._id}</h1>
          <p className="text-sm text-gray-500">Placed by {order.teller?.name} on {new Date(order.createdAt).toLocaleString('en-KE')}</p>
        </div>
        <Link href={`/shop/receipt/${order._id}`} className="text-sm text-amber-600 font-semibold">
          View Receipt
        </Link>
      </div>

      <div className="bg-white rounded-xl border p-5 mb-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-semibold text-zinc-800">Customer & Delivery</h2>
          {!isLocked && (
            <button onClick={() => setEditing((e) => !e)} className="text-xs text-amber-600 font-semibold">
              {editing ? 'Cancel' : 'Edit'}
            </button>
          )}
        </div>

        {editing ? (
          <div className="space-y-3">
            <input
              value={form.customerName}
              onChange={(e) => setForm({ ...form, customerName: e.target.value })}
              placeholder="Customer name"
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
            <input
              value={form.customerPhone}
              onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
              placeholder="Customer phone"
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
            <select
              value={form.deliveryType}
              onChange={(e) => setForm({ ...form, deliveryType: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            >
              <option value="Collection">In-store Collection</option>
              <option value="Parcel">Parcel</option>
            </select>
            {form.deliveryType === 'Parcel' && (
              <input
                value={form.parcelDestination}
                onChange={(e) => setForm({ ...form, parcelDestination: e.target.value })}
                placeholder="Destination"
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            )}
            {error && <p className="text-xs text-red-600">{error}</p>}
            <button onClick={handleSaveEdit} className="px-4 py-2 bg-zinc-800 text-white rounded-lg text-sm font-semibold">
              Save Changes
            </button>
          </div>
        ) : (
          <div className="text-sm space-y-1 text-zinc-700">
            <p>Name: {order.customerName}</p>
            <p>Phone: {order.customerPhone}</p>
            <p>Delivery: {order.deliveryType === 'Parcel' ? `Parcel — ${order.parcelDestination}` : 'In-store Collection'}</p>
            {isLocked && <p className="text-xs text-gray-400 mt-2">Locked — order is already {order.stage}.</p>}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border p-5 mb-4">
        <h2 className="font-semibold text-zinc-800 mb-3">Items</h2>
        <table className="w-full text-sm">
          <tbody>
            {order.items.map((item, idx) => (
              <tr key={idx} className="border-t">
                <td className="py-2">{item.product?.name} ({item.variantName})</td>
                <td className="py-2 text-center">x{item.quantity}</td>
                <td className="py-2 text-right">KES {(item.priceAtSale * item.quantity).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex justify-between text-sm font-semibold pt-3 border-t mt-2">
          <span>Total</span>
          <span>KES {order.totalAmount.toLocaleString()}</span>
        </div>
      </div>

      <div className="bg-white rounded-xl border p-5">
        <h2 className="font-semibold text-zinc-800 mb-3">Stage: {order.stage}</h2>
        <OrderStageActions
          orderId={order._id}
          currentStage={order.stage}
          deliveryType={order.deliveryType}
          onUpdated={() => fetchOrder()}
        />
        <div className="mt-4 space-y-1 text-xs text-gray-500">
          {order.stageLog.map((log, idx) => (
            <p key={idx}>
              {log.stage} — {new Date(log.changedAt).toLocaleString('en-KE')} {log.smsSent ? '· SMS sent' : '· SMS failed'}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
