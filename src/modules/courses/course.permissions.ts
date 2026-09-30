import { AppError } from "@/lib/errors/app-error";
import type { PublicUser } from "@/modules/auth/auth.types";
export function canEditCourse(user: PublicUser, instructorId: string) { return user.role === "ADMIN" || (user.role === "INSTRUCTOR" && user.id === instructorId); }
export function assertCourseOwner(user: PublicUser, instructorId: string) { if (!canEditCourse(user, instructorId)) throw new AppError("FORBIDDEN", "You do not have permission to modify this course", 403); }
