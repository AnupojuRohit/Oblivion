import { Schema, model, models } from "mongoose";
export interface CategoryDocument { _id: Schema.Types.ObjectId; name: string; slug: string; description?: string; createdAt: Date; updatedAt: Date; }
const categorySchema = new Schema<CategoryDocument>({ name: { type: String, required: true, trim: true, maxlength: 80 }, slug: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 100 }, description: { type: String, trim: true, maxlength: 500 } }, { timestamps: true, collection: "categories" });
export const Category = models.Category || model<CategoryDocument>("Category", categorySchema);
