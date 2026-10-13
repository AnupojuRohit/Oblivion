import { z } from "zod";

// 1 GB file size limit for course materials and videos
export const MAX_RESOURCE_BYTES = 1024 * 1024 * 1024;

export const allowedMimeTypes = [
  "application/pdf",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/zip",
  "application/x-zip-compressed",
  "application/x-rar-compressed",
  "application/x-7z-compressed",
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-matroska",
  "video/x-msvideo",
  "audio/mpeg",
  "audio/wav",
  "text/plain",
  "application/octet-stream",
] as const;

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid identifier");

export const presignUploadSchema = z.object({
  lessonId: objectId.optional(),
  name: z.string().trim().min(1).max(180),
  mimeType: z.enum(allowedMimeTypes),
  sizeBytes: z.coerce.number().int().min(1).max(MAX_RESOURCE_BYTES),
});

export const registerResourceSchema = presignUploadSchema.extend({
  storageKey: z.string().regex(/^courses\/[a-f\d]{24}\/(?:[a-f\d]{24}\/)?[a-zA-Z0-9_\-\.]+\.[a-zA-Z0-9]+$/, "Invalid storage key"),
});
