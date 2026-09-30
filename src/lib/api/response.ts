import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AppError } from "@/lib/errors/app-error";
export const ok = <T>(data: T, status = 200) => NextResponse.json({ success: true, data }, { status });
export const fail = (error: AppError | unknown) => { const known = error instanceof AppError ? error : error instanceof ZodError ? new AppError("INVALID_INPUT", error.issues[0]?.message ?? "Invalid input", 400) : new AppError("INTERNAL_ERROR", "An unexpected error occurred", 500); return NextResponse.json({ success: false, error: { code: known.code, message: known.message } }, { status: known.status }); };
