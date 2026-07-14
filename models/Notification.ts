// models/Notification.ts
import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface INotification extends Document {
  user: Types.ObjectId;
  message: string;
  link?: string;
  read: boolean;
}

const notificationSchema = new Schema<INotification>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true },
    link: { type: String },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, read: 1 });

const Notification: Model<INotification> =
  mongoose.models.Notification || mongoose.model<INotification>('Notification', notificationSchema);

export default Notification;
