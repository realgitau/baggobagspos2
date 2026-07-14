// app/api/categories/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import Category from '@/models/Category';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectDB();
  const categories = await Category.find().sort({ name: 1 }).lean();
  return NextResponse.json({ categories });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { name, code, parent } = body;
    if (!name || !code) {
      return NextResponse.json({ error: 'name and code are required.' }, { status: 400 });
    }

    await connectDB();
    const category = await Category.create({ name, code, parent });
    return NextResponse.json({ category }, { status: 201 });
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json({ error: 'A category with that name or code already exists.' }, { status: 409 });
    }
    console.error('Failed to create category:', error);
    return NextResponse.json({ error: 'Failed to create category.' }, { status: 500 });
  }
}
