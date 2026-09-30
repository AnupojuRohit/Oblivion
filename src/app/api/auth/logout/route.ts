import { cookies } from "next/headers";
import { fail, ok } from "@/lib/api/response";
import { authService } from "@/modules/auth/auth.service";
import { SESSION_COOKIE } from "@/modules/auth/session";
import { clearSessionCookie } from "../route-helpers";
export async function POST() { try { const token = (await cookies()).get(SESSION_COOKIE)?.value; if (token) await authService.logout(token); return clearSessionCookie(ok({ loggedOut: true })); } catch (error) { return fail(error); } }
