// app/api/orders/[id]/status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { advanceOrderStage } from '@/lib/orderLifecycle';
import type { OrderStage } from '@/types';

// POST /api/orders/[id]/status
// Body: { stage: "OnTransit" | "Arrived" | "Collected" | "Dispatched", destination?: string }
// Fires the matching SMS to the customer as a side effect.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { stage, destination } = body as { stage: OrderStage; destination?: string };

    if (!stage) {
      return NextResponse.json({ error: 'stage is required.' }, { status: 400 });
    }

    const result = await advanceOrderStage(params.id, stage, session.user.id, { destination });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ order: result.order });
  } catch (error: any) {
    console.error('Failed to advance order stage:', error);
    return NextResponse.json({ error: error.message || 'Failed to advance order stage.' }, { status: 500 });
  }
}
