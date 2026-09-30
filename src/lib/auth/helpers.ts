import { cookies } from "next/headers";
import { AppError } from "@/lib/errors/app-error";
import { authService } from "@/modules/auth/auth.service";
import { SESSION_COOKIE } from "@/modules/auth/session";
import type { PublicUser, UserRole } from "@/modules/auth/auth.types";
export async function getCurrentUser(): Promise<PublicUser | null> { const token = (await cookies()).get(SESSION_COOKIE)?.value; return token ? authService.getUserByToken(token) : null; }
export async function requireUser() { const user = await getCurrentUser(); if (!user) throw new AppError("AUTH_REQUIRED", "Please sign in to continue", 401); return user; }
export async function requireRole(role: UserRole) { const user = await requireUser(); if (user.role !== role) throw new AppError("FORBIDDEN", "You do not have permission to perform this action", 403); return user; }
export const requireInstructor = () => requireRole("INSTRUCTOR");
export const requireAdmin = () => requireRole("ADMIN");
