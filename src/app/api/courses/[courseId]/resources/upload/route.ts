import { fail, ok } from "@/lib/api/response";
import { requireUser } from "@/lib/auth/helpers";
import { AppError } from "@/lib/errors/app-error";
import { MAX_RESOURCE_BYTES } from "@/modules/resources/resource.schema";
import { resourceService } from "@/modules/resources/resource.service";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: Promise<{ courseId: string }> }) {
  try {
    const user = await requireUser();
    const { courseId } = await params;
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      throw new AppError("INVALID_INPUT", "A file is required for upload", 400);
    }

    if (file.size > MAX_RESOURCE_BYTES) {
      throw new AppError("FILE_TOO_LARGE", "File exceeds the 1 GB size limit", 400);
    }

    const lessonId = formData.get("lessonId")?.toString() || undefined;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    const resource = await resourceService.directUpload(courseId, user, {
      name: file.name,
      buffer,
      mimeType: file.type || "application/octet-stream",
      sizeBytes: file.size,
      lessonId,
    });

    return ok(resource, 201);
  } catch (error) {
    return fail(error);
  }
}
