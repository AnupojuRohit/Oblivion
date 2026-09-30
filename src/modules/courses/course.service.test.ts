import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/infrastructure/mongodb/connection", () => ({ connectToDatabase: vi.fn() }));
vi.mock("@/modules/categories/category.service", () => ({ categoryService: { exists: vi.fn() } }));
vi.mock("@/modules/enrollments/enrollment.service", () => ({ enrollmentService: { hasEnrollment: vi.fn() } }));
vi.mock("./course.model", () => ({ Course: { findOne: vi.fn(), findById: vi.fn(), exists: vi.fn(), find: vi.fn(), countDocuments: vi.fn() } }));

import { enrollmentService } from "@/modules/enrollments/enrollment.service";
import { Course } from "./course.model";
import { courseService } from "./course.service";

const enrollmentMock = vi.mocked(enrollmentService);
const courseMock = vi.mocked(Course);

beforeEach(() => {
  vi.clearAllMocks();
  enrollmentMock.hasEnrollment.mockResolvedValue(true as never);
  courseMock.findOne.mockResolvedValue({ _id: { toString: () => "course-1" }, instructorId: { toString: () => "instructor-1" }, categoryId: { toString: () => "category-1" }, title: "Docker", slug: "docker", shortDescription: "Learn Docker", description: "Full course", level: "BEGINNER", language: "English", price: 499, currency: "INR", status: "PUBLISHED", sections: [], ratingSum: 0, ratingCount: 0, ratingAverage: 0, enrollmentCount: 1, lessonCount: 0, createdAt: new Date(), updatedAt: new Date(), publishedAt: new Date() } as never);
});

describe("courseService", () => {
  it("treats enrolled students as having full access", async () => {
    const result = await courseService.getBySlug("docker", { id: "student-1", name: "Student", email: "student@example.com", role: "STUDENT" });

    expect(result.sections).toEqual([]);
    expect(enrollmentMock.hasEnrollment).toHaveBeenCalledWith("student-1", "course-1");
  });
});