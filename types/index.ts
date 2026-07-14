// types/index.ts

export type DeliveryType = 'Collection' | 'Parcel';

// The 4-stage Baggo Bags lifecycle (replaces old Completed/Pending/Dispatched)
export type OrderStage =
  | 'Pending'        // order created, awaiting payment confirmation
  | 'OnTransit'       // payment confirmed -> SMS #1
  | 'Arrived'        // stock arrived / ready for action -> SMS #2
  | 'Collected'       // Collection branch, final -> SMS #3a
  | 'Dispatched';      // Parcel branch, final -> SMS #3b

export type PaymentMethod = 'Mpesa' | 'Cash';

export interface OrderItemInput {
  productId: string;
  variantName: string;
  quantity: number;
}

export interface StageChangeLogEntry {
  stage: OrderStage;
  changedAt: Date;
  changedBy: string; // User id
  smsSent: boolean;
  smsError?: string;
}

export interface OrderEditLogEntry {
  editedAt: Date;
  editedBy: string; // staff User id
  changes: Record<string, { from: unknown; to: unknown }>;
  reason?: string;
}

export interface SmsResult {
  success: boolean;
  provider: string;
  messageId?: string;
  error?: string;
}
