import { Schema, model, models } from "mongoose";

export interface ReviewDocument {
  _id: Schema.Types.ObjectId;
  userId: Schema.Types.ObjectId;
  courseId: Schema.Types.ObjectId;
  rating: number;
  comment: string;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<ReviewDocument>({
  userId: { type: Schema.Types.ObjectId, required: true, ref: "User", index: true },
  courseId: { type: Schema.Types.ObjectId, required: true, ref: "Course", index: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true, trim: true, maxlength: 2000 },
}, { timestamps: true, collection: "reviews" });

reviewSchema.index({ userId: 1, courseId: 1 }, { unique: true });
reviewSchema.index({ courseId: 1, createdAt: -1 });

export const Review = models.Review || model<ReviewDocument>("Review", reviewSchema);