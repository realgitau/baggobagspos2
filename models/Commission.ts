// models/Commission.ts
import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import './Order';
import './Product';
import './User';

export interface ICommissionDetails {
  productId: Types.ObjectId;
  productName: string;
  variantName?: string;
  quantity: number;
}

export interface ICommission extends Document {
  teller: Types.ObjectId;
  order: string;
  amount: number;
  category: string;
  month: number;
  year: number;
  paid: boolean;
  paidAt?: Date;
  paymentMethod?: 'Mpesa' | 'Bank Transfer' | 'Cash';
  paymentReference?: string;
  details: ICommissionDetails;
  payoutStatus: 'none' | 'requested' | 'processed';
  status: 'approved' | 'disputed' | 'resolved';
  disputeReason?: string;
  disputedAt?: Date;
}

const commissionDetailsSchema = new Schema<ICommissionDetails>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    productName: { type: String, required: true },
    variantName: { type: String },
    quantity: { type: Number, required: true },
  },
  { _id: false }
);

const commissionSchema = new Schema<ICommission>(
  {
    teller: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    order: { type: String, ref: 'Order', required: true },
    amount: { type: Number, required: true },
    category: { type: String, required: true },
    month: { type: Number, required: true },
    year: { type: Number, required: true },
    paid: { type: Boolean, default: false },
    paidAt: { type: Date },
    paymentMethod: { type: String, enum: ['Mpesa', 'Bank Transfer', 'Cash'] },
    paymentReference: { type: String },
    details: commissionDetailsSchema,
    payoutStatus: { type: String, enum: ['none', 'requested', 'processed'], default: 'none' },
    status: { type: String, enum: ['approved', 'disputed', 'resolved'], default: 'approved', required: true },
    disputeReason: { type: String, trim: true },
    disputedAt: { type: Date },
  },
  { timestamps: true }
);

commissionSchema.index({ teller: 1, year: -1, month: -1 });
commissionSchema.index({ createdAt: -1 });
commissionSchema.index({ teller: 1, payoutStatus: 1, paid: 1 });
commissionSchema.index({ status: 1, disputedAt: -1 });

const Commission: Model<ICommission> =
  mongoose.models.Commission || mongoose.model<ICommission>('Commission', commissionSchema);

export default Commission;
