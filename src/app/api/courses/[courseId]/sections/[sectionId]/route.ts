import { fail, ok } from "@/lib/api/response";
import { requireUser } from "@/lib/auth/helpers";
import { sectionSchema } from "@/modules/courses/course.schema";
import { courseService } from "@/modules/courses/course.service";
type Context = { params: Promise<{ courseId: string; sectionId: string }> };
export async function PATCH(request: Request, { params }: Context) { try { const ids = await params; return ok(await courseService.updateSection(ids.courseId, ids.sectionId, await requireUser(), sectionSchema.partial().parse(await request.json()))); } catch (error) { return fail(error); } }
export async function DELETE(_: Request, { params }: Context) { try { const ids = await params; await courseService.removeSection(ids.courseId, ids.sectionId, await requireUser()); return ok({ deleted: true }); } catch (error) { return fail(error); } }
