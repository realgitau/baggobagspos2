// app/api/tellers/dashboard-stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import Commission from '@/models/Commission';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const tellerId = searchParams.get('tellerId') || session.user.id;

  // Tellers may only view their own stats
  if (!session.user.isAdmin && tellerId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await connectDB();

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const todaysOrders = await Order.find({
    teller: tellerId,
    createdAt: { $gte: startOfDay, $lte: endOfDay },
  }).lean();

  const sales = todaysOrders.reduce((sum, o: any) => sum + o.totalAmount, 0);
  const itemsSold = todaysOrders.reduce(
    (sum, o: any) => sum + o.items.reduce((s: number, i: any) => s + i.quantity, 0),
    0
  );

  const commissions = await Commission.find({
    teller: tellerId,
    createdAt: { $gte: startOfDay, $lte: endOfDay },
  }).lean();
  const commission = commissions.reduce((sum, c: any) => sum + c.amount, 0);

  return NextResponse.json({
    today: {
      sales,
      orderCount: todaysOrders.length,
      commission,
      itemsSold,
    },
  });
}
