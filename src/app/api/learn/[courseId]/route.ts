import { fail, ok } from "@/lib/api/response";
import { getCurrentUser } from "@/lib/auth/helpers";
import { AppError } from "@/lib/errors/app-error";
import { courseService } from "@/modules/courses/course.service";
import { enrollmentService } from "@/modules/enrollments/enrollment.service";
import { resourceService } from "@/modules/resources/resource.service";

export async function GET(_: Request, { params }: { params: Promise<{ courseId: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new AppError("AUTH_REQUIRED", "Please sign in to continue", 401);
    const courseId = (await params).courseId;
    const course = await courseService.getById(courseId, user);
    const enrollment = await enrollmentService.getEnrollment(user.id, courseId);
    const resources = await resourceService.listForLearner(courseId, user);
    return ok({ course, enrollment, resources, canTrackProgress: Boolean(enrollment || user.role === "ADMIN" || course.instructorId === user.id) });
  } catch (error) {
    return fail(error);
  }
}