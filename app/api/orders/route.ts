// app/api/orders/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import Product from '@/models/Product';
import type { OrderItemInput, DeliveryType } from '@/types';

interface CreateOrderBody {
  items: OrderItemInput[];
  customerName: string;
  customerPhone: string; // required — every SMS in the lifecycle depends on this
  discount?: number;
  paymentMethod: 'Mpesa' | 'Cash';
  mpesaDetails?: { phone?: string; transactionCode?: string };
  deliveryType: DeliveryType; // 'Collection' | 'Parcel'
  parcelDestination?: string; // required if deliveryType === 'Parcel'
}

// POST /api/orders — create a new sale. Stage starts at 'Pending';
// call POST /api/orders/[id]/status with stage "OnTransit" once payment is confirmed.
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body: CreateOrderBody = await req.json();
    const { items, customerName, customerPhone, discount, paymentMethod, mpesaDetails, deliveryType, parcelDestination } = body;

    if (!items?.length) {
      return NextResponse.json({ error: 'Order must contain at least one item.' }, { status: 400 });
    }
    if (!customerName || !customerPhone) {
      return NextResponse.json({ error: 'customerName and customerPhone are required.' }, { status: 400 });
    }
    if (deliveryType === 'Parcel' && !parcelDestination) {
      return NextResponse.json({ error: 'parcelDestination is required for Parcel orders.' }, { status: 400 });
    }

    await connectDB();

    // Price items server-side from the DB — never trust client-sent prices
    let totalAmount = 0;
    const pricedItems = [];
    for (const item of items) {
      const product: any = await Product.findById(item.productId).lean();
      if (!product) {
        return NextResponse.json({ error: `Product ${item.productId} not found.` }, { status: 400 });
      }
      const variant = product.variants.find((v: any) => v.name === item.variantName);
      if (!variant) {
        return NextResponse.json({ error: `Variant "${item.variantName}" not found for ${product.name}.` }, { status: 400 });
      }
      pricedItems.push({
        product: item.productId,
        variantName: item.variantName,
        quantity: item.quantity,
        priceAtSale: variant.price,
      });
      totalAmount += variant.price * item.quantity;
    }
    totalAmount -= discount ?? 0;

    const order = new Order({
      items: pricedItems,
      teller: session.user.id,
      customerName,
      customerPhone,
      discount: discount ?? 0,
      totalAmount,
      paymentMethod,
      mpesaDetails,
      deliveryType,
      parcelDestination,
      stage: 'Pending',
    });

    await order.save();

    return NextResponse.json({ order }, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create order:', error);
    return NextResponse.json({ error: error.message || 'Failed to create order.' }, { status: 500 });
  }
}

// GET /api/orders — list, supports ?stage=&teller=&search=
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectDB();
  const { searchParams } = new URL(req.url);
  const stage = searchParams.get('stage');
  const teller = searchParams.get('teller');
  const search = searchParams.get('search');

  const query: Record<string, unknown> = {};
  if (stage) query.stage = stage;
  if (teller) query.teller = teller;
  if (search) {
    query.$or = [
      { customerName: { $regex: search, $options: 'i' } },
      { _id: { $regex: search, $options: 'i' } },
      { customerPhone: { $regex: search, $options: 'i' } },
    ];
  }

  const orders = await Order.find(query).populate('teller', 'name').sort({ createdAt: -1 }).lean();
  return NextResponse.json({ orders });
}
