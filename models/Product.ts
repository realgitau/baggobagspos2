// models/Product.ts
import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IVariant {
  name: string;
  price: number;
  stock: number;
}

export interface IProduct extends Document {
  name: string;
  code: string;
  category: Types.ObjectId;
  batch: Types.ObjectId; // -> StockBatch, drives the BGA# in generated order IDs
  variants: IVariant[];
  image?: string;
}

const variantSchema = new Schema<IVariant>(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    stock: { type: Number, required: true, default: 0 },
  },
  { _id: false }
);

const productSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    batch: { type: Schema.Types.ObjectId, ref: 'StockBatch', required: true },
    variants: {
      type: [variantSchema],
      required: true,
      validate: [
        (v: IVariant[]) => Array.isArray(v) && v.length > 0,
        'Product must have at least one variant.',
      ],
    },
    image: { type: String },
  },
  { timestamps: true }
);

const Product: Model<IProduct> =
  mongoose.models.Product || mongoose.model<IProduct>('Product', productSchema);

export default Product;
