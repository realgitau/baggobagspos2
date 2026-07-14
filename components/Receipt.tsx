// components/Receipt.tsx
'use client';

interface ReceiptItem {
  productName: string;
  variantName: string;
  quantity: number;
  priceAtSale: number;
}

interface ReceiptProps {
  orderId: string;
  customerName: string;
  customerPhone: string;
  items: ReceiptItem[];
  discount: number;
  totalAmount: number;
  paymentMethod: string;
  deliveryType: 'Collection' | 'Parcel';
  parcelDestination?: string;
  createdAt: string;
}

export default function Receipt({
  orderId,
  customerName,
  customerPhone,
  items,
  discount,
  totalAmount,
  paymentMethod,
  deliveryType,
  parcelDestination,
  createdAt,
}: ReceiptProps) {
  const subtotal = items.reduce((sum, i) => sum + i.priceAtSale * i.quantity, 0);

  return (
    <div className="max-w-sm mx-auto bg-white p-6 font-mono text-sm print:shadow-none print:p-0">
      <div className="text-center mb-4">
        <h1 className="text-lg font-bold tracking-wide">BAGGO BAGS</h1>
        <p className="text-xs text-gray-500">Baggo Bags Global Kenya</p>
        <p className="text-xs text-gray-500">Contact: 0725023411</p>
      </div>

      <div className="border-t border-b border-dashed border-gray-400 py-2 mb-2 text-xs">
        <p>Order: <span className="font-bold">{orderId}</span></p>
        <p>Date: {new Date(createdAt).toLocaleString('en-KE')}</p>
        <p>Customer: {customerName}</p>
        <p>Phone: {customerPhone}</p>
        <p>Delivery: {deliveryType === 'Parcel' ? `Parcel — ${parcelDestination}` : 'In-store Collection'}</p>
      </div>

      <table className="w-full text-xs mb-2">
        <thead>
          <tr className="border-b border-gray-300">
            <th className="text-left py-1">Item</th>
            <th className="text-center py-1">Qty</th>
            <th className="text-right py-1">Total</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={idx}>
              <td className="py-1">{item.productName}{item.variantName ? ` (${item.variantName})` : ''}</td>
              <td className="text-center py-1">{item.quantity}</td>
              <td className="text-right py-1">{(item.priceAtSale * item.quantity).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="border-t border-dashed border-gray-400 pt-2 text-xs space-y-1">
        <div className="flex justify-between"><span>Subtotal</span><span>KES {subtotal.toLocaleString()}</span></div>
        {discount > 0 && (
          <div className="flex justify-between"><span>Discount</span><span>- KES {discount.toLocaleString()}</span></div>
        )}
        <div className="flex justify-between font-bold text-sm"><span>Total</span><span>KES {totalAmount.toLocaleString()}</span></div>
        <div className="flex justify-between"><span>Payment</span><span>{paymentMethod}</span></div>
      </div>

      <p className="text-center text-xs text-gray-500 mt-4">Thank you for ordering with Baggo Bags Global Kenya.</p>
    </div>
  );
}
