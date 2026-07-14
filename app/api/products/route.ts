// app/api/products/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';
import StockBatch from '@/models/StockBatch';
import { logStockChange } from '@/lib/stockLogger';

// GET /api/products — list, optionally filtered by ?batch=<StockBatch _id>
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectDB();
  const { searchParams } = new URL(req.url);
  const batch = searchParams.get('batch');

  const query = batch ? { batch } : {};
  const products = await Product.find(query).populate('category', 'name code').populate('batch', 'code label').lean();

  return NextResponse.json({ products });
}

// POST /api/products — upload a product, must specify which batch slot it belongs to
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { name, code, category, batch, variants, image } = body;

    if (!name || !code || !category || !batch || !Array.isArray(variants) || variants.length === 0) {
      return NextResponse.json(
        { error: 'name, code, category, batch, and at least one variant are required.' },
        { status: 400 }
      );
    }

    await connectDB();

    const batchDoc = await StockBatch.findById(batch).lean();
    if (!batchDoc) {
      return NextResponse.json({ error: `Stock batch ${batch} not found. Create it first via /api/stock-batches.` }, { status: 400 });
    }

    const product = await Product.create({ name, code, category, batch, variants, image });

    // Log the initial stock for every variant so the audit trail starts at upload time
    for (const variant of variants) {
      await logStockChange({
        productId: product._id,
        productCode: product.code,
        variantName: variant.name,
        type: 'initial',
        quantityBefore: 0,
        quantityAfter: variant.stock,
        note: `Initial upload into batch ${(batchDoc as any).code}`,
        createdBy: session.user.id,
      });
    }

    return NextResponse.json({ product }, { status: 201 });
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json({ error: 'A product with that code already exists.' }, { status: 409 });
    }
    console.error('Failed to create product:', error);
    return NextResponse.json({ error: 'Failed to create product.' }, { status: 500 });
  }
}
