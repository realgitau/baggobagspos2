// lib/stockLogger.ts
import connectDB from '@/lib/mongodb';
import StockLog from '@/models/StockLog';
import type { Types } from 'mongoose';

interface LogStockChangeInput {
  productId: Types.ObjectId | string;
  productCode: string;
  variantName: string;
  type: 'initial' | 'restock' | 'adjustment';
  quantityBefore: number;
  quantityAfter: number;
  note?: string;
  createdBy?: Types.ObjectId | string | null;
}

export async function logStockChange({
  productId,
  productCode,
  variantName,
  type,
  quantityBefore,
  quantityAfter,
  note = '',
  createdBy = null,
}: LogStockChangeInput): Promise<void> {
  try {
    await connectDB();
    await StockLog.create({
      product: productId,
      productCode,
      variantName,
      type,
      quantityBefore,
      quantityAfter,
      change: quantityAfter - quantityBefore,
      note,
      createdBy,
    });
  } catch (err: any) {
    console.error('StockLog write failed:', err.message);
  }
}
