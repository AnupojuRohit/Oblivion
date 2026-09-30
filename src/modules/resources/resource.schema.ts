import { z } from "zod";
export const MAX_RESOURCE_BYTES = 10 * 1024 * 1024;
export const allowedMimeTypes = ["application/pdf", "application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/zip", "application/x-zip-compressed"] as const;
const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid identifier");
export const presignUploadSchema = z.object({ lessonId: objectId, name: z.string().trim().min(1).max(180), mimeType: z.enum(allowedMimeTypes), sizeBytes: z.coerce.number().int().min(1).max(MAX_RESOURCE_BYTES) });
export const registerResourceSchema = presignUploadSchema.extend({ storageKey: z.string().regex(/^courses\/[a-f\d]{24}\/[a-f\d]{24}\/[a-zA-Z0-9_-]+\.[a-z0-9]+$/, "Invalid storage key") });
