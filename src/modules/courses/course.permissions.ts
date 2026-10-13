import { AppError } from "@/lib/errors/app-error";
import type { PublicUser } from "@/modules/auth/auth.types";

/**
 * Keep course authorization rules in one place so every course mutation
 * applies the same ownership policy.
 */
export function canEditCourse(
  user: PublicUser,
  instructorId: string,
): boolean {
  // Administrators can moderate courses; creators can edit their own courses.
  return (
    user.role === "ADMIN" ||
    user.id === instructorId
  );
}

/**
 * Use this assertion in service methods before changing a course.
 * A UI restriction alone is not authorization: API requests can be sent directly.
 */
export function assertCourseOwner(
  user: PublicUser,
  instructorId: string,
): void {
  if (!canEditCourse(user, instructorId)) {
    throw new AppError(
      "FORBIDDEN",
      "You do not have permission to modify this course",
      403,
    );
  }
}
