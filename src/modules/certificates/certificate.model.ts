import { Schema, model, models } from "mongoose";

export interface CertificateDocument {
  _id: Schema.Types.ObjectId;
  verifyId: string;
  userId: Schema.Types.ObjectId;
  courseId: Schema.Types.ObjectId;
  courseSlugSnapshot: string;
  studentNameSnapshot: string;
  courseTitleSnapshot: string;
  issuedAt: Date;
  createdAt: Date;
}

const certificateSchema = new Schema<CertificateDocument>({
  verifyId: { type: String, required: true, unique: true, index: true },
  userId: { type: Schema.Types.ObjectId, required: true, ref: "User", index: true },
  courseId: { type: Schema.Types.ObjectId, required: true, ref: "Course", index: true },
  courseSlugSnapshot: { type: String, required: true, trim: true },
  studentNameSnapshot: { type: String, required: true, trim: true, maxlength: 120 },
  courseTitleSnapshot: { type: String, required: true, trim: true, maxlength: 160 },
  issuedAt: { type: Date, required: true, default: Date.now },
}, { timestamps: { createdAt: true, updatedAt: false }, collection: "certificates" });

certificateSchema.index({ userId: 1, courseId: 1 }, { unique: true });

export const Certificate = models.Certificate || model<CertificateDocument>("Certificate", certificateSchema);