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

  it("does not allow users to edit another creator's course", () => {
    const student: PublicUser = { id: "student-999", name: "Student", email: "student@example.com", role: "STUDENT" };

    expect(canEditCourse(student, instructor.id)).toBe(false);
    expect(() => assertCourseOwner(student, instructor.id)).toThrow(AppError);
  });

  it("allows regular users to edit their own course", () => {
    const regularUser: PublicUser = { id: "user-888", name: "User", email: "user@example.com", role: "STUDENT" };

    expect(canEditCourse(regularUser, "user-888")).toBe(true);
    expect(() => assertCourseOwner(regularUser, "user-888")).not.toThrow();
  });

  it("allows administrators to moderate any course", () => {
    const admin: PublicUser = { ...instructor, role: "ADMIN" };

    expect(canEditCourse(admin, "instructor-456")).toBe(true);
    expect(() => assertCourseOwner(admin, "instructor-456")).not.toThrow();
  });
});
