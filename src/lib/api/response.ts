import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AppError } from "@/lib/errors/app-error";

export const ok = <T>(data: T, status = 200) => NextResponse.json({ success: true, data }, { status });

function toAppError(error: unknown): AppError {
  if (error instanceof AppError) return error;
  if (error instanceof ZodError) {
    return new AppError("INVALID_INPUT", error.issues[0]?.message ?? "Invalid input", 400);
  }
  if (error instanceof Error) {
    if (error.name === "MongooseServerSelectionError") {
      return new AppError(
        "DATABASE_UNAVAILABLE",
        "Cannot connect to MongoDB. Verify MONGODB_URI in .env.local, your network, and Atlas IP access.",
        503,
      );
    }
    if (error.message === "MONGODB_URI is required for database operations") {
      return new AppError(
        "DATABASE_NOT_CONFIGURED",
        "MONGODB_URI is missing. Copy .env.example to .env.local and set your MongoDB connection string.",
        503,
      );
    }
  }
  return new AppError("INTERNAL_ERROR", "An unexpected error occurred", 500);
}

export const fail = (error: AppError | unknown) => {
  const known = toAppError(error);
  return NextResponse.json({ success: false, error: { code: known.code, message: known.message } }, { status: known.status });
};
