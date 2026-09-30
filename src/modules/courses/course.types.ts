export const COURSE_LEVELS = ["BEGINNER", "INTERMEDIATE", "ADVANCED"] as const;
export const COURSE_STATUSES = ["DRAFT", "PUBLISHED", "UNPUBLISHED"] as const;
export const LESSON_TYPES = ["VIDEO", "TEXT"] as const;
export type CourseLevel = (typeof COURSE_LEVELS)[number];
export type CourseStatus = (typeof COURSE_STATUSES)[number];
export type LessonType = (typeof LESSON_TYPES)[number];
export type CourseAccess = "VISITOR" | "ENROLLED" | "OWNER" | "ADMIN";
