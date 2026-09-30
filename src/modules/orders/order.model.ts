import { Schema, model, models } from "mongoose";

export interface OrderDocument {
  _id: Schema.Types.ObjectId;
  userId: Schema.Types.ObjectId;
  courseId: Schema.Types.ObjectId;
  instructorId: Schema.Types.ObjectId;
  courseTitleSnapshot: string;
  priceSnapshot: number;
  currencySnapshot: string;
  amount: number;
  status: "CREATED" | "PAID" | "FAILED" | "REFUNDED";
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  createdAt: Date;
  paidAt?: Date;
  refundedAt?: Date;
}

const orderSchema = new Schema<OrderDocument>({
  userId: { type: Schema.Types.ObjectId, required: true, ref: "User", index: true },
  courseId: { type: Schema.Types.ObjectId, required: true, ref: "Course", index: true },
  instructorId: { type: Schema.Types.ObjectId, required: true, ref: "User", index: true },
  courseTitleSnapshot: { type: String, required: true, trim: true, maxlength: 160 },
  priceSnapshot: { type: Number, required: true, min: 0 },
  currencySnapshot: { type: String, required: true, uppercase: true, minlength: 3, maxlength: 3 },
  amount: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ["CREATED", "PAID", "FAILED", "REFUNDED"], default: "CREATED", index: true },
  razorpayOrderId: { type: String, unique: true, sparse: true, index: true },
  razorpayPaymentId: String,
  razorpaySignature: String,
  paidAt: Date,
  refundedAt: Date,
}, { timestamps: { createdAt: true, updatedAt: false }, collection: "orders" });

orderSchema.index({ userId: 1, courseId: 1 });

export const Order = models.Order || model<OrderDocument>("Order", orderSchema);