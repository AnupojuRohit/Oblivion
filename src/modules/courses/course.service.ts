import { Types } from "mongoose";
import { connectToDatabase } from "@/infrastructure/mongodb/connection";
import { AppError } from "@/lib/errors/app-error";
import type { PublicUser } from "@/modules/auth/auth.types";
import { categoryService } from "@/modules/categories/category.service";
import { enrollmentService } from "@/modules/enrollments/enrollment.service";
import { assertCourseOwner } from "./course.permissions";
import { Course, type CourseDocument } from "./course.model";
import type { CourseAccess, CourseLevel } from "./course.types";
import { getCourseView } from "./course.view";

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

async function findById(id: string) {
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError("COURSE_NOT_FOUND", "Course not found", 404);
  }

  const course = await Course.findById(id);
  if (!course) {
    throw new AppError("COURSE_NOT_FOUND", "Course not found", 404);
  }

  return course;
}

/**
 * Slugs are human-readable URLs, but they must also be unique.
 * When a title is already taken, append a number rather than failing creation.
 */
async function ensureSlug(title: string, excludedId?: string) {
  const baseSlug = slugify(title) || "course";
  let slug = baseSlug;
  let suffix = 2;

  while (
    await Course.exists({
      slug,
      ...(excludedId ? { _id: { $ne: excludedId } } : {}),
    })
  ) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return slug;
}

function recountLessons(course: CourseDocument) {
  course.lessonCount = course.sections.reduce(
    (total, section) => total + section.lessons.length,
    0,
  );
}

async function resolveCourseAccess(
  course: CourseDocument,
  user: PublicUser | null,
): Promise<CourseAccess> {
  if (user?.role === "ADMIN") return "ADMIN";
  if (user?.id === course.instructorId.toString()) return "OWNER";

  if (
    user &&
    (await enrollmentService.hasEnrollment(user.id, course._id.toString()))
  ) {
    return "ENROLLED";
  }

  return "VISITOR";
}

type InstructorCourse = {
  id: string;
  title: string;
  slug: string;
  status: string;
  price: number;
  currency: string;
  enrollmentCount: number;
  ratingAverage: number;
  ratingCount: number;
  lessonCount: number;
  updatedAt: Date;
};

async function getInstructorCourses(
  user: PublicUser,
): Promise<InstructorCourse[]> {
  await connectToDatabase();

  // Filter in MongoDB so an instructor can only receive their own courses.
  const courses = await Course.find({ instructorId: user.id })
    .select(
      "title slug status price currency enrollmentCount ratingAverage ratingCount lessonCount updatedAt",
    )
    .sort({ updatedAt: -1 })
    .lean();

  return courses.map((course) => ({
    id: course._id.toString(),
    title: course.title,
    slug: course.slug,
    status: course.status,
    price: course.price,
    currency: course.currency,
    enrollmentCount: course.enrollmentCount,
    ratingAverage: course.ratingAverage,
    ratingCount: course.ratingCount,
    lessonCount: course.lessonCount,
    updatedAt: course.updatedAt,
  }));
}

export const courseService = {
  async listForInstructor(user: PublicUser) {
    return getInstructorCourses(user);
  },

  async getForEditor(
    id: string,
    user: PublicUser,
  ): Promise<CourseDocument> {
    await connectToDatabase();

    const course = await findById(id);
    assertCourseOwner(user, course.instructorId.toString());

    return course.toObject() as CourseDocument;
  },

  async instructorAnalytics(user: PublicUser) {
    const courses = await getInstructorCourses(user);

    const totals = courses.reduce(
      (result, course) => ({
        courseCount: result.courseCount + 1,
        published:
          result.published + Number(course.status === "PUBLISHED"),
        enrollments: result.enrollments + course.enrollmentCount,
        estimatedGross:
          result.estimatedGross + course.enrollmentCount * course.price,
        ratingTotal:
          result.ratingTotal + course.ratingAverage * course.ratingCount,
        ratingCount: result.ratingCount + course.ratingCount,
      }),
      {
        courseCount: 0,
        published: 0,
        enrollments: 0,
        estimatedGross: 0,
        ratingTotal: 0,
        ratingCount: 0,
      },
    );

    return {
      ...totals,
      averageRating: totals.ratingCount
        ? totals.ratingTotal / totals.ratingCount
        : 0,
      courses,
    };
  },

  async create(
    user: PublicUser,
    input: {
      categoryId: string;
      title: string;
      shortDescription: string;
      description: string;
      thumbnailUrl?: string;
      level: CourseLevel;
      language: string;
      price: number;
      currency: string;
    },
  ) {
    await connectToDatabase();

    if (!(await categoryService.exists(input.categoryId))) {
      throw new AppError("CATEGORY_NOT_FOUND", "Category not found", 404);
    }

    return Course.create({
      ...input,
      slug: await ensureSlug(input.title),
      instructorId: user.id,
      status: "DRAFT",
    });
  },

  async update(id: string, user: PublicUser, input: Record<string, unknown>) {
    await connectToDatabase();

    const course = await findById(id);
    assertCourseOwner(user, course.instructorId.toString());

    if (
      input.categoryId &&
      !(await categoryService.exists(String(input.categoryId)))
    ) {
      throw new AppError("CATEGORY_NOT_FOUND", "Category not found", 404);
    }

    if (input.title && input.title !== course.title) {
      course.slug = await ensureSlug(String(input.title), id);
    }

    // Only explicitly allowed fields can be changed by this operation.
    const editableFields = [
      "categoryId",
      "title",
      "shortDescription",
      "description",
      "thumbnailUrl",
      "level",
      "language",
      "price",
      "currency",
    ] as const;

    for (const field of editableFields) {
      if (field in input) {
        (course as unknown as Record<string, unknown>)[field] = input[field];
      }
    }

    await course.save();
    return course;
  },

  async remove(id: string, user: PublicUser) {
    await connectToDatabase();

    const course = await findById(id);
    assertCourseOwner(user, course.instructorId.toString());

    if (course.status === "PUBLISHED" || course.enrollmentCount > 0) {
      throw new AppError(
        "COURSE_DELETE_BLOCKED",
        "Published or enrolled courses cannot be deleted. Unpublish the course instead.",
        409,
      );
    }

    await course.deleteOne();
  },

  async publish(id: string, user: PublicUser) {
    await connectToDatabase();

    const course = await findById(id);
    assertCourseOwner(user, course.instructorId.toString());

    const hasRequiredDetails =
      Boolean(course.title) &&
      Boolean(course.description) &&
      Boolean(course.categoryId) &&
      course.price !== undefined;

    if (!hasRequiredDetails) {
      throw new AppError(
        "COURSE_NOT_READY",
        "A published course needs complete details, a category, and pricing",
        400,
      );
    }

    course.status = "PUBLISHED";
    course.publishedAt = new Date();
    await course.save();

    return course;
  },

  async unpublish(id: string, user: PublicUser) {
    await connectToDatabase();

    const course = await findById(id);
    assertCourseOwner(user, course.instructorId.toString());

    course.status = "UNPUBLISHED";
    await course.save();

    return course;
  },

  async getBySlug(slug: string, user: PublicUser | null) {
    await connectToDatabase();

    const course = await Course.findOne({ slug });
    const access = course
      ? await resolveCourseAccess(course, user)
      : "VISITOR";

    if (
      !course ||
      (course.status !== "PUBLISHED" && access === "VISITOR")
    ) {
      throw new AppError("COURSE_NOT_FOUND", "Course not found", 404);
    }

    return getCourseView(course, access);
  },

  async getById(id: string, user: PublicUser | null) {
    await connectToDatabase();

    const course = await findById(id);
    const access = await resolveCourseAccess(course, user);

    if (course.status !== "PUBLISHED" && access === "VISITOR") {
      throw new AppError("COURSE_NOT_FOUND", "Course not found", 404);
    }

    return getCourseView(course, access);
  },

  async list(query: {
    q?: string;
    category?: string;
    level?: CourseLevel;
    minPrice?: number;
    maxPrice?: number;
    rating?: number;
    sort: string;
    page: number;
    limit: number;
  }) {
    await connectToDatabase();

    // The public catalogue must never return drafts or unpublished courses.
    const filter: Record<string, unknown> = { status: "PUBLISHED" };

    if (query.q) filter.$text = { $search: query.q };

    if (query.category) {
      const { Category } = await import("@/modules/categories/category.model");
      const category = await Category.findOne({
        slug: query.category,
      }).lean();

      if (!category) {
        return {
          courses: [],
          pagination: {
            page: query.page,
            limit: query.limit,
            total: 0,
            totalPages: 0,
          },
        };
      }

      filter.categoryId = category._id;
    }

    if (query.level) filter.level = query.level;
    if (query.rating !== undefined) {
      filter.ratingAverage = { $gte: query.rating };
    }

    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      filter.price = {
        ...(query.minPrice !== undefined ? { $gte: query.minPrice } : {}),
        ...(query.maxPrice !== undefined ? { $lte: query.maxPrice } : {}),
      };
    }

    const sortOptions: Record<string, Record<string, 1 | -1>> = {
      newest: { publishedAt: -1 },
      popular: { enrollmentCount: -1, publishedAt: -1 },
      rating: { ratingAverage: -1, ratingCount: -1 },
      price_asc: { price: 1 },
      price_desc: { price: -1 },
    };
    const sort = sortOptions[query.sort] ?? sortOptions.newest;
    const skip = (query.page - 1) * query.limit;

    // Fetch the current page and total count concurrently.
    const [courses, total] = await Promise.all([
      Course.find(filter)
        .select(
          "title slug shortDescription thumbnailUrl level language price currency ratingAverage ratingCount enrollmentCount lessonCount categoryId instructorId publishedAt",
        )
        .sort(sort)
        .skip(skip)
        .limit(query.limit)
        .lean(),
      Course.countDocuments(filter),
    ]);

    return {
      courses: courses.map((course) => ({
        ...course,
        id: course._id.toString(),
        categoryId: course.categoryId.toString(),
        instructorId: course.instructorId.toString(),
      })),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  },

  async addSection(
    courseId: string,
    user: PublicUser,
    input: { title: string; description?: string; position: number },
  ) {
    await connectToDatabase();

    const course = await findById(courseId);
    assertCourseOwner(user, course.instructorId.toString());

    course.sections.push({
      ...input,
      _id: new Types.ObjectId(),
      lessons: [],
    });
    await course.save();

    return course;
  },

  async updateSection(
    courseId: string,
    sectionId: string,
    user: PublicUser,
    input: Record<string, unknown>,
  ) {
    await connectToDatabase();

    const course = await findById(courseId);
    assertCourseOwner(user, course.instructorId.toString());

    const section = course.sections.id(sectionId);
    if (!section) {
      throw new AppError("SECTION_NOT_FOUND", "Section not found", 404);
    }

    Object.assign(section, input);
    await course.save();

    return course;
  },

  async removeSection(courseId: string, sectionId: string, user: PublicUser) {
    await connectToDatabase();

    const course = await findById(courseId);
    assertCourseOwner(user, course.instructorId.toString());

    const section = course.sections.id(sectionId);
    if (!section) {
      throw new AppError("SECTION_NOT_FOUND", "Section not found", 404);
    }

    section.deleteOne();
    recountLessons(course);
    await course.save();
  },

  async addLesson(
    courseId: string,
    sectionId: string,
    user: PublicUser,
    input: Record<string, unknown>,
  ) {
    await connectToDatabase();

    const course = await findById(courseId);
    assertCourseOwner(user, course.instructorId.toString());

    const section = course.sections.id(sectionId);
    if (!section) {
      throw new AppError("SECTION_NOT_FOUND", "Section not found", 404);
    }

    section.lessons.push({
      ...input,
      _id: new Types.ObjectId(),
    } as never);
    recountLessons(course);
    await course.save();

    return course;
  },

  async updateLesson(
    courseId: string,
    sectionId: string,
    lessonId: string,
    user: PublicUser,
    input: Record<string, unknown>,
  ) {
    await connectToDatabase();

    const course = await findById(courseId);
    assertCourseOwner(user, course.instructorId.toString());

    const lesson = course.sections.id(sectionId)?.lessons.id(lessonId);
    if (!lesson) {
      throw new AppError("LESSON_NOT_FOUND", "Lesson not found", 404);
    }

    Object.assign(lesson, input);
    await course.save();

    return course;
  },

  async removeLesson(
    courseId: string,
    sectionId: string,
    lessonId: string,
    user: PublicUser,
  ) {
    await connectToDatabase();

    const course = await findById(courseId);
    assertCourseOwner(user, course.instructorId.toString());

    const lesson = course.sections.id(sectionId)?.lessons.id(lessonId);
    if (!lesson) {
      throw new AppError("LESSON_NOT_FOUND", "Lesson not found", 404);
    }

    lesson.deleteOne();
    recountLessons(course);
    await course.save();
  },

  async reorder(
    courseId: string,
    user: PublicUser,
    input: {
      sections: {
        sectionId: string;
        position: number;
        lessonOrder: { lessonId: string; position: number }[];
      }[];
    },
  ) {
    await connectToDatabase();

    const course = await findById(courseId);
    assertCourseOwner(user, course.instructorId.toString());

    for (const sectionOrder of input.sections) {
      const section = course.sections.id(sectionOrder.sectionId);
      if (!section) {
        throw new AppError("SECTION_NOT_FOUND", "Section not found", 404);
      }

      section.position = sectionOrder.position;

      for (const lessonOrder of sectionOrder.lessonOrder) {
        const lesson = section.lessons.id(lessonOrder.lessonId);
        if (!lesson) {
          throw new AppError("LESSON_NOT_FOUND", "Lesson not found", 404);
        }

        lesson.position = lessonOrder.position;
      }
    }

    await course.save();
    return course;
  },
};
