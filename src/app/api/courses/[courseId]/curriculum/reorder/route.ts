import { fail, ok } from "@/lib/api/response";
import { requireUser } from "@/lib/auth/helpers";
import { reorderSchema } from "@/modules/courses/course.schema";
import { courseService } from "@/modules/courses/course.service";
export async function PATCH(request: Request, { params }: { params: Promise<{ courseId: string }> }) { try { return ok(await courseService.reorder((await params).courseId, await requireUser(), reorderSchema.parse(await request.json()))); } catch (error) { return fail(error); } }
