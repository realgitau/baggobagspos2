// models/StockBatch.ts
//
// A "batch slot" is what generates the BGA1, BGA2, ... BGA999 prefix.
// You create/pick a batch when uploading or restocking a product, and every
// order for stock in that batch inherits its code, e.g. BGA1 + S + 301 -> BGA1S301.
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IStockBatch extends Document {
  slotNumber: number; // 1-999
  code: string;       // "BGA1".."BGA999", derived from slotNumber
  label?: string;     // optional human note, e.g. "July restock - leather bags"
  active: boolean;
  createdBy?: mongoose.Types.ObjectId;
}

const stockBatchSchema = new Schema<IStockBatch>(
  {
    slotNumber: { type: Number, required: true, unique: true, min: 1, max: 999 },
    code: { type: String, required: true, unique: true, uppercase: true },
    label: { type: String, trim: true },
    active: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// Auto-derive code from slotNumber so callers never have to construct it manually
stockBatchSchema.pre('validate', function (next) {
  if (this.slotNumber && !this.code) {
    this.code = `BGA${this.slotNumber}`;
  }
  next();
});

const StockBatch: Model<IStockBatch> =
  mongoose.models.StockBatch || mongoose.model<IStockBatch>('StockBatch', stockBatchSchema);

export default StockBatch;
