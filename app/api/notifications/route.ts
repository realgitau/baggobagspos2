// app/api/notifications/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import Notification from '@/models/Notification';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectDB();
  const notifications = await Notification.find({ user: session.user.id }).sort({ createdAt: -1 }).limit(50).lean();
  return NextResponse.json({ notifications });
}

// PATCH /api/notifications — mark all as read
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectDB();
  await Notification.updateMany({ user: session.user.id, read: false }, { $set: { read: true } });
  return NextResponse.json({ success: true });
}
