// models/StockLog.ts
import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IStockLog extends Document {
  product: Types.ObjectId;
  productCode: string;
  variantName: string;
  type: 'initial' | 'restock' | 'adjustment';
  quantityBefore: number;
  quantityAfter: number;
  change: number;
  note: string;
  createdBy?: Types.ObjectId;
}

const stockLogSchema = new Schema<IStockLog>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    productCode: { type: String, required: true },
    variantName: { type: String, required: true },
    type: { type: String, enum: ['initial', 'restock', 'adjustment'], required: true },
    quantityBefore: { type: Number, required: true },
    quantityAfter: { type: Number, required: true },
    change: { type: Number, required: true },
    note: { type: String, default: '' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

const StockLog: Model<IStockLog> =
  mongoose.models.StockLog || mongoose.model<IStockLog>('StockLog', stockLogSchema);

export default StockLog;
