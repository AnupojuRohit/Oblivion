import { fail, ok } from "@/lib/api/response";
import { requireUser } from "@/lib/auth/helpers";
import { lessonSchema } from "@/modules/courses/course.schema";
import { courseService } from "@/modules/courses/course.service";
export async function POST(request: Request, { params }: { params: Promise<{ courseId: string; sectionId: string }> }) { try { const ids = await params; return ok(await courseService.addLesson(ids.courseId, ids.sectionId, await requireUser(), lessonSchema.parse(await request.json())), 201); } catch (error) { return fail(error); } }
