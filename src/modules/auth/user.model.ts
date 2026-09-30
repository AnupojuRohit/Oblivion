import { Schema, model, models } from "mongoose";
import type { UserRole } from "./auth.types";
export interface UserDocument { _id: Schema.Types.ObjectId; name: string; email: string; passwordHash: string; role: UserRole; avatarUrl?: string; createdAt: Date; updatedAt: Date; }
const userSchema = new Schema<UserDocument>({ name: { type: String, required: true, trim: true, maxlength: 80 }, email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 }, passwordHash: { type: String, required: true, select: false }, role: { type: String, enum: ["STUDENT", "INSTRUCTOR", "ADMIN"], default: "STUDENT", required: true }, avatarUrl: { type: String, trim: true } }, { timestamps: true, collection: "users" });
export const User = models.User || model<UserDocument>("User", userSchema);
