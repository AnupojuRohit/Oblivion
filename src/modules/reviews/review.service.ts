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

const applyRatingDelta = async (courseId: string, sumDelta: number, countDelta: number) => {
  await Course.updateOne(
    { _id: courseId },
    [
      { $set: {
        ratingSum: { $add: ["$ratingSum", sumDelta] },
        ratingCount: { $max: [0, { $add: ["$ratingCount", countDelta] }] },
      } },
      { $set: { ratingAverage: { $cond: [{ $gt: ["$ratingCount", 0] }, { $divide: ["$ratingSum", "$ratingCount"] }, 0] } } },
    ],
  );
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

    let review;
    try {
      review = await Review.create({ userId: user.id, courseId, rating: input.rating, comment: input.comment });
    } catch (error) {
      if (typeof error === "object" && error !== null && "code" in error && (error as { code?: number }).code === 11000) throw new AppError("REVIEW_ALREADY_EXISTS", "You have already reviewed this course", 409);
      throw error;
    }
    await applyRatingDelta(courseId, input.rating, 1);
    return review;
  },

  async update(user: PublicUser, reviewId: string, input: { rating: number; comment: string }) {
    await connectToDatabase();
    if (!Types.ObjectId.isValid(reviewId)) throw new AppError("REVIEW_NOT_FOUND", "Review not found", 404);
    const review = await Review.findById(reviewId);
    if (!review) throw new AppError("REVIEW_NOT_FOUND", "Review not found", 404);
    requireOwnerOrAdmin(user, review.userId.toString());
    await ensureCourseExists(review.courseId.toString());
    const ratingDelta = input.rating - review.rating;
    review.rating = input.rating;
    review.comment = input.comment;
    await review.save();
    await applyRatingDelta(review.courseId.toString(), ratingDelta, 0);
    return review;
  },

  async remove(user: PublicUser, reviewId: string) {
    await connectToDatabase();
    if (!Types.ObjectId.isValid(reviewId)) throw new AppError("REVIEW_NOT_FOUND", "Review not found", 404);
    const review = await Review.findById(reviewId);
    if (!review) throw new AppError("REVIEW_NOT_FOUND", "Review not found", 404);
    requireOwnerOrAdmin(user, review.userId.toString());
    await ensureCourseExists(review.courseId.toString());
    await review.deleteOne();
    await applyRatingDelta(review.courseId.toString(), -review.rating, -1);
  },
};