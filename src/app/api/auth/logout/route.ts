import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { authService } from "@/modules/auth/auth.service";
import { logger } from "@/lib/logger";
import { SESSION_COOKIE } from "@/modules/auth/session";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;

    if (token) {
      try {
        await authService.logout(token);
      } catch (error) {
        logger.warn("Logout session cleanup failed", { error: error instanceof Error ? error.message : "unknown" });
      }
    }

    const response = NextResponse.json({ success: true, data: { loggedOut: true } });
    response.cookies.set(SESSION_COOKIE, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    return response;
  } catch (error) {
    logger.error("Logout failed", { error: error instanceof Error ? error.message : "unknown" });
    return NextResponse.json({ success: false, error: { code: "INTERNAL_ERROR", message: "Could not sign out" } }, { status: 500 });
  }
}
