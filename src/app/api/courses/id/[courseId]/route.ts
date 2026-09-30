import { fail, ok } from "@/lib/api/response";
import { requireUser } from "@/lib/auth/helpers";
import { courseService } from "@/modules/courses/course.service";
import { courseUpdateSchema } from "@/modules/courses/course.schema";
type Context = { params: Promise<{ courseId: string }> };
export async function PATCH(request: Request, { params }: Context) { try { return ok(await courseService.update((await params).courseId, await requireUser(), courseUpdateSchema.parse(await request.json()))); } catch (error) { return fail(error); } }
export async function DELETE(_: Request, { params }: Context) { try { await courseService.remove((await params).courseId, await requireUser()); return ok({ deleted: true }); } catch (error) { return fail(error); } }
