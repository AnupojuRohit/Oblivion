import { AppError } from "@/lib/errors/app-error";
import { connectToDatabase } from "@/infrastructure/mongodb/connection";
import type { PublicUser } from "@/modules/auth/auth.types";
import { SavedResource } from "./saved-resource.model";
export const savedResourceService = { async save(user: PublicUser, input: { videoId: string; title: string; channelName: string; thumbnailUrl?: string; videoUrl: string; topic: string }) { await connectToDatabase(); try { return await SavedResource.findOneAndUpdate({ userId: user.id, videoId: input.videoId }, input, { upsert: true, new: true, setDefaultsOnInsert: true }); } catch { throw new AppError("RESOURCE_ALREADY_SAVED", "This resource is already saved", 409); } }, async list(user: PublicUser) { await connectToDatabase(); return SavedResource.find({ userId: user.id }).sort({ createdAt: -1 }).lean(); }, async remove(user: PublicUser, videoId: string) { await connectToDatabase(); await SavedResource.deleteOne({ userId: user.id, videoId }); } };
