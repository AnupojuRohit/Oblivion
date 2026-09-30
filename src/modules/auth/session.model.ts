import { Schema, model, models } from "mongoose";
export interface SessionDocument { _id: Schema.Types.ObjectId; userId: Schema.Types.ObjectId; tokenHash: string; expiresAt: Date; createdAt: Date; lastUsedAt: Date; userAgent?: string; ipAddress?: string; }
const sessionSchema = new Schema<SessionDocument>({ userId: { type: Schema.Types.ObjectId, required: true, ref: "User", index: true }, tokenHash: { type: String, required: true, unique: true }, expiresAt: { type: Date, required: true, index: { expires: 0 } }, lastUsedAt: { type: Date, default: Date.now }, userAgent: String, ipAddress: String }, { timestamps: { createdAt: true, updatedAt: false }, collection: "sessions" });
export const Session = models.Session || model<SessionDocument>("Session", sessionSchema);
