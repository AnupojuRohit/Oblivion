import { Schema, model, models } from "mongoose";

export interface EnrollmentDocument {
  _id: Schema.Types.ObjectId;
  userId: Schema.Types.ObjectId;
  courseId: Schema.Types.ObjectId;
  orderId?: Schema.Types.ObjectId;
  completedLessonIds: Schema.Types.ObjectId[];
  progressPercent: number;
  lastLessonId?: Schema.Types.ObjectId;
  lastPositionSeconds?: number;
  completedAt?: Date;
  certificateId?: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const enrollmentSchema = new Schema<EnrollmentDocument>({
  userId: { type: Schema.Types.ObjectId, required: true, ref: "User", index: true },
  courseId: { type: Schema.Types.ObjectId, required: true, ref: "Course", index: true },
  orderId: { type: Schema.Types.ObjectId, ref: "Order" },
  completedLessonIds: { type: [Schema.Types.ObjectId], default: [] },
  progressPercent: { type: Number, default: 0, min: 0, max: 100 },
  lastLessonId: { type: Schema.Types.ObjectId },
  lastPositionSeconds: { type: Number, min: 0, default: 0 },
  completedAt: Date,
  certificateId: { type: Schema.Types.ObjectId, ref: "Certificate" },
}, { timestamps: true, collection: "enrollments" });

enrollmentSchema.index({ userId: 1, courseId: 1 }, { unique: true });

export const Enrollment = models.Enrollment || model<EnrollmentDocument>("Enrollment", enrollmentSchema);