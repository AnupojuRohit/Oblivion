import { describe, expect, it } from "vitest";
import { canEditCourse } from "./course.permissions";
describe("course permissions", () => { it("allows the owner and admins but not another instructor", () => { expect(canEditCourse({ id: "owner", name: "Owner", email: "o@example.com", role: "INSTRUCTOR" }, "owner")).toBe(true); expect(canEditCourse({ id: "other", name: "Other", email: "x@example.com", role: "INSTRUCTOR" }, "owner")).toBe(false); expect(canEditCourse({ id: "admin", name: "Admin", email: "a@example.com", role: "ADMIN" }, "owner")).toBe(true); }); });
