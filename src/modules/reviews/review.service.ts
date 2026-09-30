import { Types } from "mongoose";
import { AppError } from "@/lib/errors/app-error";
import { connectToDatabase } from "@/infrastructure/mongodb/connection";
import type { PublicUser } from "@/modules/auth/auth.types";
import { Course } from "@/modules/courses/course.model";
import { enrollmentService } from "@/modules/enrollments/enrollment.service";
import { Review } from "./review.model";

const ensureCourseExists = async (courseId: string) => {
  if (!Types.ObjectId.isValid(courseId)) throw new AppError("COURSE_NOT_FOUND", "Course not found", 404);
  const course = await Course.findById(courseId).select("ratingSum ratingCount ratingAverage instructorId").lean();
  if (!course) throw new AppError("COURSE_NOT_FOUND", "Course not found", 404);
  return course;
};

const recomputeRating = async (courseId: string, ratingSum: number, ratingCount: number) => {
  await Course.updateOne({ _id: courseId }, { $set: { ratingSum, ratingCount, ratingAverage: ratingCount ? ratingSum / ratingCount : 0 } });
};

const requireOwnerOrAdmin = (user: PublicUser, reviewUserId: string) => {
  if (user.role === "ADMIN" || user.id === reviewUserId) return;
  throw new AppError("FORBIDDEN", "You do not have permission to modify this review", 403);
};

export const reviewService = {
  async listForCourse(courseId: string) {
    await connectToDatabase();
    await ensureCourseExists(courseId);
    return Review.find({ courseId }).populate("userId", "name avatarUrl").sort({ createdAt: -1 }).lean();
  },

  async getUserReview(courseId: string, userId: string) {
    await connectToDatabase();
    return Review.findOne({ courseId, userId }).populate("userId", "name avatarUrl").lean();
  },

  async create(user: PublicUser, courseId: string, input: { rating: number; comment: string }) {
    await connectToDatabase();
    const course = await ensureCourseExists(courseId);
    if (!(await enrollmentService.hasEnrollment(user.id, courseId))) throw new AppError("REVIEW_NOT_ALLOWED", "You must enroll before leaving a review", 403);
    if (course.instructorId.toString() === user.id) throw new AppError("REVIEW_NOT_ALLOWED", "Instructors cannot review their own course", 403);
    if (await Review.exists({ userId: user.id, courseId })) throw new AppError("REVIEW_ALREADY_EXISTS", "You have already reviewed this course", 409);

    const review = await Review.create({ userId: user.id, courseId, rating: input.rating, comment: input.comment });
    await recomputeRating(courseId, course.ratingSum + input.rating, course.ratingCount + 1);
    return review;
  },

  async update(user: PublicUser, reviewId: string, input: { rating: number; comment: string }) {
    await connectToDatabase();
    if (!Types.ObjectId.isValid(reviewId)) throw new AppError("REVIEW_NOT_FOUND", "Review not found", 404);
    const review = await Review.findById(reviewId);
    if (!review) throw new AppError("REVIEW_NOT_FOUND", "Review not found", 404);
    requireOwnerOrAdmin(user, review.userId.toString());
    const course = await ensureCourseExists(review.courseId.toString());
    const ratingDelta = input.rating - review.rating;
    review.rating = input.rating;
    review.comment = input.comment;
    await review.save();
    await recomputeRating(review.courseId.toString(), course.ratingSum + ratingDelta, course.ratingCount);
    return review;
  },

  async remove(user: PublicUser, reviewId: string) {
    await connectToDatabase();
    if (!Types.ObjectId.isValid(reviewId)) throw new AppError("REVIEW_NOT_FOUND", "Review not found", 404);
    const review = await Review.findById(reviewId);
    if (!review) throw new AppError("REVIEW_NOT_FOUND", "Review not found", 404);
    requireOwnerOrAdmin(user, review.userId.toString());
    const course = await ensureCourseExists(review.courseId.toString());
    await review.deleteOne();
    await recomputeRating(review.courseId.toString(), course.ratingSum - review.rating, Math.max(0, course.ratingCount - 1));
  },
};