import { Schema, model, models } from "mongoose";
import type { CourseLevel, CourseStatus, LessonType } from "./course.types";

/**
 * A lesson is embedded in a section, and sections are embedded in a course.
 * This keeps a course curriculum together for the operations the application
 * performs most often: editing and reading one course.
 */
export interface Lesson {
  _id: Schema.Types.ObjectId;
  title: string;
  description?: string;
  type: LessonType;
  videoUrl?: string;
  content?: string;
  position: number;
  isPreview: boolean;
  durationSeconds?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CourseSection {
  _id: Schema.Types.ObjectId;
  title: string;
  description?: string;
  position: number;
  lessons: Lesson[];
}

export interface CourseDocument {
  _id: Schema.Types.ObjectId;
  instructorId: Schema.Types.ObjectId;
  categoryId: Schema.Types.ObjectId;
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  thumbnailUrl?: string;
  level: CourseLevel;
  language: string;
  price: number;
  currency: string;
  status: CourseStatus;
  sections: CourseSection[];
  ratingSum: number;
  ratingCount: number;
  ratingAverage: number;
  enrollmentCount: number;
  lessonCount: number;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
}

const lessonSchema = new Schema<Lesson>(
  {
    title: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, trim: true, maxlength: 2000 },
    type: { type: String, enum: ["VIDEO", "TEXT"], required: true },
    videoUrl: { type: String, maxlength: 2000 },
    content: { type: String, maxlength: 20000 },
    position: { type: Number, required: true, min: 1 },
    isPreview: { type: Boolean, default: false },
    durationSeconds: { type: Number, min: 0 },
  },
  { timestamps: true },
);

const sectionSchema = new Schema<CourseSection>(
  {
    title: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, trim: true, maxlength: 1000 },
    position: { type: Number, required: true, min: 1 },
    lessons: { type: [lessonSchema], default: [] },
  },
  { _id: true },
);

const courseSchema = new Schema<CourseDocument>(
  {
    instructorId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
      index: true,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Category",
      index: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 190,
    },
    shortDescription: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 12000,
    },
    thumbnailUrl: String,
    level: {
      type: String,
      enum: ["BEGINNER", "INTERMEDIATE", "ADVANCED"],
      required: true,
    },
    language: { type: String, required: true, trim: true, maxlength: 60 },
    price: { type: Number, required: true, min: 0 },
    currency: {
      type: String,
      required: true,
      default: "INR",
      uppercase: true,
      minlength: 3,
      maxlength: 3,
    },
    status: {
      type: String,
      enum: ["DRAFT", "PUBLISHED", "UNPUBLISHED"],
      default: "DRAFT",
      index: true,
    },
    sections: { type: [sectionSchema], default: [] },
    ratingSum: { type: Number, default: 0, min: 0 },
    ratingCount: { type: Number, default: 0, min: 0 },
    ratingAverage: { type: Number, default: 0, min: 0, max: 5 },
    enrollmentCount: { type: Number, default: 0, min: 0 },
    lessonCount: { type: Number, default: 0, min: 0 },
    publishedAt: Date,
  },
  { timestamps: true, collection: "courses" },
);

// Text search supports the public course catalogue.
courseSchema.index({ title: "text", description: "text" });

// Common catalogue filters are indexed to avoid unnecessary collection scans.
courseSchema.index({ status: 1, categoryId: 1, level: 1 });

// Reuse the compiled model during Next.js development hot reloads.
export const Course = models.Course || model<CourseDocument>("Course", courseSchema);
