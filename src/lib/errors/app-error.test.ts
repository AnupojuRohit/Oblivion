import { describe, expect, it } from "vitest";
import { AppError } from "./app-error";

describe("AppError", () => {
  it("retains the public code, message, and HTTP status", () => {
    const error = new AppError("AUTH_REQUIRED", "Sign in required", 401);
    expect(error).toMatchObject({ code: "AUTH_REQUIRED", message: "Sign in required", status: 401 });
  });
});
