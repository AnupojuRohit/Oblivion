import { describe, expect, it } from "vitest";
import { MAX_RESOURCE_BYTES, presignUploadSchema } from "./resource.schema";
const valid = { lessonId: "507f1f77bcf86cd799439011", name: "slides.pdf", mimeType: "application/pdf", sizeBytes: 1024 };
describe("resource upload validation", () => { it("accepts permitted files under the size limit", () => expect(presignUploadSchema.safeParse(valid).success).toBe(true)); it("rejects unsupported mime types and oversized uploads", () => { expect(presignUploadSchema.safeParse({ ...valid, mimeType: "image/png" }).success).toBe(false); expect(presignUploadSchema.safeParse({ ...valid, sizeBytes: MAX_RESOURCE_BYTES + 1 }).success).toBe(false); }); });
