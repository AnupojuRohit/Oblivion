import { fail, ok } from "@/lib/api/response";
import { requireUser } from "@/lib/auth/helpers";
import { courseService } from "@/modules/courses/course.service";
export async function POST(_: Request, { params }: { params: Promise<{ courseId: string }> }) { try { return ok(await courseService.unpublish((await params).courseId, await requireUser())); } catch (error) { return fail(error); } }
