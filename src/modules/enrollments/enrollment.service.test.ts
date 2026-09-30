import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/infrastructure/mongodb/connection", () => ({ connectToDatabase: vi.fn() }));
vi.mock("@/modules/courses/course.model", () => ({ Course: { findById: vi.fn(), updateOne: vi.fn() } }));
vi.mock("@/modules/certificates/certificate.service", () => ({ certificateService: { issueForCompletion: vi.fn().mockResolvedValue({ _id: { toString: () => "507f1f77bcf86cd799439099" } }) } }));
vi.mock("./enrollment.model", () => ({ Enrollment: { exists: vi.fn(), findOne: vi.fn(), create: vi.fn(), deleteOne: vi.fn() } }));

import { Course } from "@/modules/courses/course.model";
import { Enrollment } from "./enrollment.model";
import { enrollmentService } from "./enrollment.service";

const courseMock = vi.mocked(Course);
const enrollmentMock = vi.mocked(Enrollment);
const courseRecord = { _id: { toString: () => "507f1f77bcf86cd799439011" }, instructorId: { toString: () => "507f1f77bcf86cd799439012" }, status: "PUBLISHED", price: 499, lessonCount: 2, sections: [{ lessons: [{ _id: { toString: () => "507f1f77bcf86cd799439021" } }, { _id: { toString: () => "507f1f77bcf86cd799439022" } }] }] };

beforeEach(() => {
  vi.clearAllMocks();
  courseMock.findById.mockReturnValue({ select: vi.fn().mockReturnThis(), lean: vi.fn().mockResolvedValue(courseRecord) } as never);
  enrollmentMock.findOne.mockResolvedValue({ userId: { toString: () => "507f1f77bcf86cd799439014" }, courseId: { toString: () => "507f1f77bcf86cd799439011" }, completedLessonIds: [{ toString: () => "507f1f77bcf86cd799439021" }], progressPercent: 50, save: vi.fn(), toObject: () => ({ progressPercent: 100 }) } as never);
});

describe("enrollmentService", () => {
  it("updates lesson progress and tracks resume position", async () => {
    const result = await enrollmentService.updateLessonProgress({ user: { id: "507f1f77bcf86cd799439014", name: "Student", email: "student@example.com", role: "STUDENT" }, courseId: "507f1f77bcf86cd799439011", lessonId: "507f1f77bcf86cd799439022", completed: true, lastPositionSeconds: 0 });

    expect(result.updated).toBe(true);
    expect(enrollmentMock.findOne).toHaveBeenCalledWith({ userId: "507f1f77bcf86cd799439014", courseId: "507f1f77bcf86cd799439011" });
    expect(courseMock.updateOne).not.toHaveBeenCalled();
  });

  it("rejects progress updates when the user lacks access", async () => {
    enrollmentMock.findOne.mockResolvedValue(null as never);

    await expect(enrollmentService.updateLessonProgress({ user: { id: "507f1f77bcf86cd799439099", name: "Visitor", email: "visitor@example.com", role: "STUDENT" }, courseId: "507f1f77bcf86cd799439011", lessonId: "507f1f77bcf86cd799439022", completed: true })).rejects.toMatchObject({ code: "COURSE_ACCESS_DENIED" });
  });
});