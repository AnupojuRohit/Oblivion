import { Types } from "mongoose";
import { AppError } from "@/lib/errors/app-error";
import { connectToDatabase } from "@/infrastructure/mongodb/connection";
import type { PublicUser } from "@/modules/auth/auth.types";
import { Course, type CourseDocument } from "@/modules/courses/course.model";
import { certificateService } from "@/modules/certificates/certificate.service";
import { Enrollment } from "./enrollment.model";

const isDuplicateKeyError = (error: unknown) => typeof error === "object" && error !== null && "code" in error && (error as { code?: number }).code === 11000;

export const enrollmentService = {
  async hasEnrollment(userId: string, courseId: string) {
    await connectToDatabase();
    return Boolean(await Enrollment.exists({ userId, courseId }));
  },

  async getForUser(userId: string) {
    await connectToDatabase();
    return Enrollment.find({ userId }).populate("courseId", "title slug thumbnailUrl price currency status level language").sort({ createdAt: -1 }).lean();
  },

  async getEnrollment(userId: string, courseId: string) {
    await connectToDatabase();
    return Enrollment.findOne({ userId, courseId }).lean();
  },

  async createEnrollment(input: { userId: string; courseId: string; orderId?: string }) {
    await connectToDatabase();
    if (!Types.ObjectId.isValid(input.userId) || !Types.ObjectId.isValid(input.courseId)) throw new AppError("INVALID_INPUT", "Invalid enrollment request", 400);
    const existing = await Enrollment.findOne({ userId: input.userId, courseId: input.courseId });
    if (existing) return { enrollment: existing, created: false };

    try {
      const enrollment = await Enrollment.create({ userId: input.userId, courseId: input.courseId, ...(input.orderId ? { orderId: input.orderId } : {}) });
      await Course.updateOne({ _id: input.courseId }, { $inc: { enrollmentCount: 1 } });
      return { enrollment, created: true };
    } catch (error) {
      if (!isDuplicateKeyError(error)) throw error;
      const enrollment = await Enrollment.findOne({ userId: input.userId, courseId: input.courseId });
      if (!enrollment) throw new AppError("ALREADY_ENROLLED", "You are already enrolled in this course", 409);
      return { enrollment, created: false };
    }
  },

  async removeEnrollment(userId: string, courseId: string) {
    await connectToDatabase();
    const result = await Enrollment.deleteOne({ userId, courseId });
    if (result.deletedCount) await Course.updateOne({ _id: courseId }, { $inc: { enrollmentCount: -1 } });
    return result.deletedCount > 0;
  },

  async updateLessonProgress(input: { user: PublicUser; courseId: string; lessonId: string; completed: boolean; lastPositionSeconds?: number }) {
    await connectToDatabase();
    if (!Types.ObjectId.isValid(input.courseId) || !Types.ObjectId.isValid(input.lessonId)) throw new AppError("INVALID_INPUT", "Invalid lesson progress request", 400);

    const course = await Course.findById(input.courseId).select("sections lessonCount instructorId status price title").lean() as Pick<CourseDocument, "sections" | "lessonCount" | "instructorId" | "status" | "price" | "title"> | null;
    if (!course) throw new AppError("COURSE_NOT_FOUND", "Course not found", 404);

    const isOwner = input.user.role === "ADMIN" || course.instructorId.toString() === input.user.id;
    const enrollment = await Enrollment.findOne({ userId: input.user.id, courseId: input.courseId });
    if (!isOwner && !enrollment) throw new AppError("COURSE_ACCESS_DENIED", "You do not have access to this course", 403);

    const lessonExists = course.sections.some((section: CourseDocument["sections"][number]) => section.lessons.some((lesson) => lesson._id.toString() === input.lessonId));
    if (!lessonExists) throw new AppError("LESSON_NOT_FOUND", "Lesson not found", 404);

    if (!enrollment) {
      return { enrollment: null, updated: false };
    }

    const completedLessonIds = new Set<string>((enrollment.completedLessonIds ?? []).map((lessonId: Types.ObjectId) => lessonId.toString()));
    if (input.completed) completedLessonIds.add(input.lessonId);

    enrollment.completedLessonIds = [...completedLessonIds].map((lessonId: string) => new Types.ObjectId(lessonId));
    enrollment.lastLessonId = new Types.ObjectId(input.lessonId);
    enrollment.lastPositionSeconds = input.lastPositionSeconds ?? 0;
    enrollment.progressPercent = course.lessonCount ? Math.round((enrollment.completedLessonIds.length / course.lessonCount) * 100) : 0;
    if (enrollment.progressPercent >= 100 && input.completed) {
      enrollment.progressPercent = 100;
      enrollment.completedAt = enrollment.completedAt ?? new Date();
      if (!enrollment.certificateId) {
        const certificate = await certificateService.issueForCompletion({ user: input.user, courseId: input.courseId, courseTitleSnapshot: course.title });
        enrollment.certificateId = certificate._id;
      }
    }

    await enrollment.save();
    return { enrollment: enrollment.toObject(), updated: true };
  },
};