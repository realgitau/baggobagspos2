// app/shop/receipt/[id]/page.tsx
import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import Receipt from '@/components/Receipt';
import PrintButton from '@/components/PrintButton';

export default async function ReceiptPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');

  await connectDB();
  const order: any = await Order.findById(params.id).populate('items.product', 'name').lean();

  if (!order) {
    return <p className="text-sm text-gray-500">Order not found.</p>;
  }

  const items = order.items.map((item: any) => ({
    productName: item.product?.name ?? 'Unknown product',
    variantName: item.variantName,
    quantity: item.quantity,
    priceAtSale: item.priceAtSale,
  }));

  return (
    <div>
      <div className="flex justify-between items-center mb-6 print:hidden">
        <h1 className="text-xl font-bold text-zinc-800">Receipt — {order._id}</h1>
        <PrintButton />
      </div>
      <Receipt
        orderId={order._id}
        customerName={order.customerName}
        customerPhone={order.customerPhone}
        items={items}
        discount={order.discount}
        totalAmount={order.totalAmount}
        paymentMethod={order.paymentMethod}
        deliveryType={order.deliveryType}
        parcelDestination={order.parcelDestination}
        createdAt={order.createdAt}
      />
    </div>
  );
}
