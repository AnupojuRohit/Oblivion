import { Schema, model, models } from "mongoose";
const recommendationSchema = new Schema({ query: { type: String, required: true, unique: true, index: true }, result: { type: Schema.Types.Mixed, required: true }, expiresAt: { type: Date, required: true, index: { expires: 0 } } }, { timestamps: true, collection: "resource_recommendations" });
export const ResourceRecommendation = models.ResourceRecommendation || model("ResourceRecommendation", recommendationSchema);
