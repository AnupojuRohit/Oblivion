import { describe, expect, it } from "vitest";
import { AppError } from "@/lib/errors/app-error";
import type { PublicUser } from "@/modules/auth/auth.types";
import { assertCourseOwner, canEditCourse } from "./course.permissions";

const instructor: PublicUser = {
  id: "instructor-123",
  name: "Course Owner",
  email: "owner@example.com",
  role: "INSTRUCTOR",
};

describe("course permissions", () => {
  it("allows an instructor to edit their own course", () => {
    expect(canEditCourse(instructor, instructor.id)).toBe(true);
    expect(() => assertCourseOwner(instructor, instructor.id)).not.toThrow();
  });

  it("denies an instructor access to another instructor's course", () => {
    expect(canEditCourse(instructor, "instructor-456")).toBe(false);

    try {
      assertCourseOwner(instructor, "instructor-456");
      throw new Error("Expected the ownership check to reject this user");
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect(error).toMatchObject({ code: "FORBIDDEN", status: 403 });
    }
  });

  it("does not allow students to edit instructor courses", () => {
    const student: PublicUser = { ...instructor, role: "STUDENT" };

    expect(canEditCourse(student, instructor.id)).toBe(false);
    expect(() => assertCourseOwner(student, instructor.id)).toThrow(AppError);
  });

  it("allows administrators to moderate any course", () => {
    const admin: PublicUser = { ...instructor, role: "ADMIN" };

    expect(canEditCourse(admin, "instructor-456")).toBe(true);
    expect(() => assertCourseOwner(admin, "instructor-456")).not.toThrow();
  });
});
