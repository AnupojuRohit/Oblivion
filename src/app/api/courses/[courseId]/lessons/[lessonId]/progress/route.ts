import { fail, ok } from "@/lib/api/response";
import { requireUser } from "@/lib/auth/helpers";
import { z } from "zod";
import { enrollmentService } from "@/modules/enrollments/enrollment.service";

const progressSchema = z.object({ completed: z.boolean(), lastPositionSeconds: z.coerce.number().int().min(0).optional() });

export async function POST(request: Request, { params }: { params: Promise<{ courseId: string; lessonId: string }> }) {
  try {
    const user = await requireUser();
    const body = progressSchema.parse(await request.json());
    return ok(await enrollmentService.updateLessonProgress({ user, courseId: (await params).courseId, lessonId: (await params).lessonId, completed: body.completed, lastPositionSeconds: body.lastPositionSeconds }));
  } catch (error) {
    return fail(error);
  }
}