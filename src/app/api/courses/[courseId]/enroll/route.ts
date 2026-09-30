import { fail, ok } from "@/lib/api/response";
import { requireUser } from "@/lib/auth/helpers";
import { AppError } from "@/lib/errors/app-error";
import { Course } from "@/modules/courses/course.model";
import { enrollmentService } from "@/modules/enrollments/enrollment.service";

export async function POST(_: Request, { params }: { params: Promise<{ courseId: string }> }) {
  try {
    const user = await requireUser();
    const course = await Course.findById((await params).courseId).select("price status instructorId").lean();
    if (!course || course.status !== "PUBLISHED") throw new AppError("COURSE_NOT_FOUND", "Course not found", 404);
    if (course.price !== 0) throw new AppError("FREE_COURSE_ENROLLMENT_REQUIRED", "Only free courses can be enrolled directly", 400);
    if (course.instructorId.toString() === user.id) throw new AppError("FORBIDDEN", "Instructors cannot enroll in their own course", 403);
    return ok(await enrollmentService.createEnrollment({ userId: user.id, courseId: (await params).courseId }), 201);
  } catch (error) {
    return fail(error);
  }
}