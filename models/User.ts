// models/User.ts
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  provider: string;
  isAdmin: boolean;
  status: 'active' | 'revoked';
  googleRefreshToken?: string;
  googleSheetId?: string;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: {
      type: String,
      required: function (this: IUser) {
        return this.provider === 'credentials';
      },
    },
    provider: { type: String, default: 'credentials' },
    isAdmin: { type: Boolean, default: false },
    status: { type: String, enum: ['active', 'revoked'], default: 'active' },
    googleRefreshToken: { type: String, required: false },
    googleSheetId: { type: String, required: false },
  },
  { timestamps: true }
);

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', userSchema);
export default User;
