import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/modules/auth/session";
import { authService } from "@/modules/auth/auth.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const token = (await cookies()).get(SESSION_COOKIE)?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: { code: "AUTH_REQUIRED", message: "Not authenticated" } }, { status: 401 });
    }

    const user = await authService.getUserByToken(token);
    if (!user) {
      const response = NextResponse.json({ success: false, error: { code: "AUTH_REQUIRED", message: "Not authenticated" } }, { status: 401 });
      response.cookies.set(SESSION_COOKIE, "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 0,
      });
      return response;
    }

    return NextResponse.json({ success: true, data: user }, { status: 200 });
  } catch (error) {
    console.error("[auth/me]", error);
    return NextResponse.json({ success: false, error: { code: "INTERNAL_ERROR", message: "Authentication service is unavailable" } }, { status: 500 });
  }
}
