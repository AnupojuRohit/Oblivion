import { fail, ok } from "@/lib/api/response";
import { requireUser } from "@/lib/auth/helpers";
import { sectionSchema } from "@/modules/courses/course.schema";
import { courseService } from "@/modules/courses/course.service";
export async function POST(request: Request, { params }: { params: Promise<{ courseId: string }> }) { try { return ok(await courseService.addSection((await params).courseId, await requireUser(), sectionSchema.parse(await request.json())), 201); } catch (error) { return fail(error); } }
