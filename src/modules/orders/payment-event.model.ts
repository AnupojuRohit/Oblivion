import { Schema, model, models } from "mongoose";

export interface PaymentEventDocument {
  _id: Schema.Types.ObjectId;
  provider: string;
  eventId: string;
  orderId?: Schema.Types.ObjectId;
  eventType: string;
  payload: Record<string, unknown>;
  processed: boolean;
  createdAt: Date;
}

const paymentEventSchema = new Schema<PaymentEventDocument>({
  provider: { type: String, required: true, trim: true, lowercase: true },
  eventId: { type: String, required: true },
  orderId: { type: Schema.Types.ObjectId, ref: "Order" },
  eventType: { type: String, required: true, trim: true },
  payload: { type: Schema.Types.Mixed, required: true },
  processed: { type: Boolean, default: false },
}, { timestamps: { createdAt: true, updatedAt: false }, collection: "payment_events" });

paymentEventSchema.index({ provider: 1, eventId: 1 }, { unique: true });

export const PaymentEvent = models.PaymentEvent || model<PaymentEventDocument>("PaymentEvent", paymentEventSchema);