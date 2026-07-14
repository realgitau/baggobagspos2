// app/api/stock-batches/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import StockBatch from '@/models/StockBatch';

// GET /api/stock-batches — list all batch slots (for the product-upload dropdown)
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectDB();
  const batches = await StockBatch.find().sort({ slotNumber: 1 }).lean();
  return NextResponse.json({ batches });
}

// POST /api/stock-batches — create a new slot, e.g. { slotNumber: 3, label: "July leather bags" }
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { slotNumber, label } = body;

    if (!slotNumber || slotNumber < 1 || slotNumber > 999) {
      return NextResponse.json({ error: 'slotNumber must be between 1 and 999.' }, { status: 400 });
    }

    await connectDB();
    const batch = await StockBatch.create({
      slotNumber,
      label,
      createdBy: session.user.id,
    });

    return NextResponse.json({ batch }, { status: 201 });
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json({ error: 'That slot number is already in use.' }, { status: 409 });
    }
    console.error('Failed to create stock batch:', error);
    return NextResponse.json({ error: 'Failed to create stock batch.' }, { status: 500 });
  }
}
