// app/api/stats/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import User from '@/models/User';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  await connectDB();

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const todaysOrders = await Order.find({ createdAt: { $gte: startOfDay, $lte: endOfDay } })
    .populate('teller', 'name')
    .sort({ createdAt: -1 })
    .lean();

  const todaySales = todaysOrders.reduce((sum, o: any) => sum + o.totalAmount, 0);
  const pendingOrders = await Order.countDocuments({ stage: { $in: ['Pending', 'OnTransit', 'Arrived'] } });
  const activeTellers = await User.countDocuments({ isAdmin: false, status: 'active' });

  const recentActivity = todaysOrders.slice(0, 8).map((o: any) => ({
    type: 'NEW_ORDER',
    orderId: o._id,
    title: `Order ${o._id}`,
    description: `${o.teller?.name ?? 'Unknown'} · KES ${o.totalAmount.toLocaleString()}`,
    time: new Date(o.createdAt).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' }),
  }));

  return NextResponse.json({
    todaySales,
    todayOrders: todaysOrders.length,
    pendingOrders,
    activeTellers,
    recentActivity,
  });
}
