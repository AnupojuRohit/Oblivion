import { fail, ok } from "@/lib/api/response";
import { requireUser } from "@/lib/auth/helpers";
import { authService } from "@/modules/auth/auth.service";
import { clearSessionCookie } from "../route-helpers";
export async function POST() { try { const user = await requireUser(); await authService.logoutAll(user.id); return clearSessionCookie(ok({ loggedOut: true })); } catch (error) { return fail(error); } }
