// models/Order.ts
import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import Product from './Product';
import StockBatch from './StockBatch';
import { processOrderCompletion } from '@/lib/commissionService';
import type { OrderStage, DeliveryType, StageChangeLogEntry, OrderEditLogEntry } from '@/types';

export interface IOrderItem {
  product: Types.ObjectId;
  variantName: string;
  quantity: number;
  priceAtSale: number;
}

export interface IOrder extends Document {
  _id: string;
  items: IOrderItem[];
  teller: Types.ObjectId;
  customerName: string;
  customerPhone: string; // required now: SMS is core to the lifecycle
  discount: number;
  totalAmount: number;
  paymentMethod: 'Mpesa' | 'Cash';
  mpesaDetails?: { phone?: string; transactionCode?: string };
  deliveryType: DeliveryType; // 'Collection' | 'Parcel'
  parcelDestination?: string; // e.g. "Nakuru" — used in Dispatched SMS
  stage: OrderStage;
  stageLog: StageChangeLogEntry[];
  editLog: OrderEditLogEntry[];
  commissionCalculated: boolean;
  stockDecremented: boolean;
}

const orderItemSchema = new Schema<IOrderItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    variantName: { type: String, required: true },
    quantity: { type: Number, required: true },
    priceAtSale: { type: Number, required: true },
  },
  { _id: false }
);

const stageLogSchema = new Schema<StageChangeLogEntry>(
  {
    stage: { type: String, required: true },
    changedAt: { type: Date, required: true },
    changedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    smsSent: { type: Boolean, required: true },
    smsError: { type: String },
  },
  { _id: false }
);

const editLogSchema = new Schema<OrderEditLogEntry>(
  {
    editedAt: { type: Date, required: true },
    editedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    changes: { type: Schema.Types.Mixed, required: true },
    reason: { type: String },
  },
  { _id: false }
);

const orderSchema = new Schema<IOrder>(
  {
    _id: { type: String },
    items: { type: [orderItemSchema], required: true },
    teller: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    customerName: { type: String, required: true, trim: true },
    customerPhone: { type: String, required: true, trim: true },
    discount: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, required: true },
    paymentMethod: { type: String, enum: ['Mpesa', 'Cash'], required: true },
    mpesaDetails: {
      phone: String,
      transactionCode: { type: String, unique: true, sparse: true },
    },
    deliveryType: { type: String, enum: ['Collection', 'Parcel'], required: true },
    parcelDestination: { type: String },
    stage: {
      type: String,
      enum: ['Pending', 'OnTransit', 'Arrived', 'Collected', 'Dispatched'],
      default: 'Pending',
    },
    stageLog: { type: [stageLogSchema], default: [] },
    editLog: { type: [editLogSchema], default: [] },
    commissionCalculated: { type: Boolean, default: false },
    stockDecremented: { type: Boolean, default: false },
  },
  { timestamps: true, _id: false }
);

// ─── HOOK 1: Batch-based ID generation ──────────────────────────────────────
// BGA{batchSlot}{deliveryLetter}{uniqueDigits} e.g. BGA1S301, BGA2P044
orderSchema.pre('save', async function (this: IOrder, next) {
  if (!this.isNew) return next();
  try {
    const firstItem = this.items[0];
    if (!firstItem) throw new Error('Order must have at least one item.');

    const product = await Product.findById(firstItem.product).lean();
    if (!product) throw new Error(`Product ${firstItem.product} not found.`);

    const batch = await StockBatch.findById((product as any).batch).lean();
    if (!batch) throw new Error(`Stock batch for product ${product.name} not found.`);

    const deliveryLetter = this.deliveryType === 'Collection' ? 'S' : 'P'; // S = in-store/collection, P = parcel

    let newId = '';
    let idExists = true;
    while (idExists) {
      const uniquePart = Date.now().toString().slice(-3); // 3-digit unique suffix
      newId = `${(batch as any).code}${deliveryLetter}${uniquePart}`;
      const existing = await mongoose.model('Order').findById(newId).lean();
      idExists = !!existing;
    }

    this._id = newId;
    next();
  } catch (error: any) {
    next(error);
  }
});

// ─── HOOK 2: Stock validation only (decrement happens post-save) ───────────
orderSchema.pre('save', async function (this: IOrder, next) {
  if (!this.isNew) return next();
  try {
    for (const item of this.items) {
      const product: any = await Product.findById(item.product).lean();
      if (!product) throw new Error(`Product with ID ${item.product} not found.`);

      const variant = product.variants.find((v: any) => v.name === item.variantName);
      if (!variant) throw new Error(`Variant "${item.variantName}" not found for product ${product.name}.`);

      if (variant.stock < item.quantity) {
        throw new Error(
          `Insufficient stock for ${product.name} (${item.variantName}). Available: ${variant.stock}, Requested: ${item.quantity}.`
        );
      }
    }
    next();
  } catch (err: any) {
    next(err);
  }
});

// ─── HOOK 3: Stock decrement — runs AFTER order is confirmed saved ─────────
orderSchema.post('save', async function (doc: IOrder, next) {
  if (doc.stockDecremented) return next();

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      for (const item of doc.items) {
        const product: any = await Product.findById(item.product).session(session);
        if (!product) throw new Error(`Product ${item.product} not found during stock decrement.`);

        const variant = product.variants.find((v: any) => v.name === item.variantName);
        if (!variant) throw new Error(`Variant "${item.variantName}" not found during stock decrement.`);

        if (variant.stock < item.quantity) {
          throw new Error(`Stock became insufficient for ${product.name} (${item.variantName}) before decrement could complete.`);
        }

        await Product.updateOne(
          { _id: item.product, 'variants.name': item.variantName },
          { $inc: { 'variants.$.stock': -item.quantity } },
          { session }
        );
      }

      await mongoose.model('Order').updateOne(
        { _id: doc._id },
        { $set: { stockDecremented: true } },
        { session }
      );
    });
    next();
  } catch (err: any) {
    console.error(`CRITICAL: Stock decrement failed for order ${doc._id}. Manual correction needed.`, err.message);
    next();
  } finally {
    session.endSession();
  }
});

// ─── HOOK 4: Commission calculation (same behavior as malistores) ──────────
orderSchema.post('save', async function (doc: IOrder, next) {
  if (doc.commissionCalculated) return next();
  try {
    console.log(`New order ${doc._id} created. Triggering commission processing...`);
    await processOrderCompletion(doc._id);
    next();
  } catch (error: any) {
    console.error(`Error in commission hook for order ${doc._id}:`, error);
    next();
  }
});

const Order: Model<IOrder> = mongoose.models.Order || mongoose.model<IOrder>('Order', orderSchema);
export default Order;
