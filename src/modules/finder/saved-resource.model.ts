import { Schema, model, models } from "mongoose";
const savedResourceSchema = new Schema({ userId: { type: Schema.Types.ObjectId, required: true, ref: "User", index: true }, videoId: { type: String, required: true }, title: { type: String, required: true }, channelName: { type: String, required: true }, thumbnailUrl: String, videoUrl: { type: String, required: true }, topic: { type: String, required: true } }, { timestamps: { createdAt: true, updatedAt: false }, collection: "saved_resources" });
savedResourceSchema.index({ userId: 1, videoId: 1 }, { unique: true });
export const SavedResource = models.SavedResource || model("SavedResource", savedResourceSchema);
