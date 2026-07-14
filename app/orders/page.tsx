// app/orders/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { OrderStage } from '@/types';

interface OrderRow {
  _id: string;
  customerName: string;
  customerPhone: string;
  totalAmount: number;
  stage: OrderStage;
  deliveryType: 'Collection' | 'Parcel';
  teller: { name: string };
  createdAt: string;
}

const STAGE_COLORS: Record<OrderStage, string> = {
  Pending: 'bg-gray-100 text-gray-700',
  OnTransit: 'bg-blue-100 text-blue-700',
  Arrived: 'bg-amber-100 text-amber-700',
  Collected: 'bg-green-100 text-green-700',
  Dispatched: 'bg-green-100 text-green-700',
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [search, setSearch] = useState('');
  const [stage, setStage] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchOrders = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (stage) params.set('stage', stage);

    fetch(`/api/orders?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => setOrders(data.orders || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const timeout = setTimeout(fetchOrders, 300); // debounce search
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, stage]);

  return (
    <div>
      <h1 className="text-xl sm:text-2xl font-bold text-zinc-800 mb-4">Orders</h1>

      <div className="flex gap-3 mb-4">
        <input
          placeholder="Search by name, phone, or order ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-3 py-2 border rounded-lg text-sm"
        />
        <select value={stage} onChange={(e) => setStage(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
          <option value="">All stages</option>
          <option value="Pending">Pending</option>
          <option value="OnTransit">On Transit</option>
          <option value="Arrived">Arrived</option>
          <option value="Collected">Collected</option>
          <option value="Dispatched">Dispatched</option>
        </select>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading orders...</p>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs text-gray-500 uppercase">
              <tr>
                <th className="px-4 py-3">Order ID</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Stage</th>
                <th className="px-4 py-3">Teller</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order._id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link href={`/orders/${order._id}`} className="font-medium text-amber-600">
                      {order._id}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{order.customerName}</td>
                  <td className="px-4 py-3">KES {order.totalAmount.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${STAGE_COLORS[order.stage]}`}>
                      {order.stage}
                    </span>
                  </td>
                  <td className="px-4 py-3">{order.teller?.name}</td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-gray-400">
                    No orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
