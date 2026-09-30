import { fail, ok } from "@/lib/api/response";
import { logger } from "@/lib/logger";
import { enforceRateLimit, getRequestIp } from "@/lib/rate-limit/memory-rate-limit";
import { loginSchema } from "@/modules/auth/auth.schema";
import { authService } from "@/modules/auth/auth.service";
import { setSessionCookie } from "../route-helpers";
export async function POST(request: Request) { try { const ipAddress = getRequestIp(request.headers); enforceRateLimit(`login:${ipAddress}`, 10); const input = loginSchema.parse(await request.json()); const result = await authService.login(input, { ipAddress, userAgent: request.headers.get("user-agent") ?? undefined }); return setSessionCookie(ok(result.user), result.token); } catch (error) { logger.warn("Login failed", { code: error instanceof Error ? error.name : "unknown" }); return fail(error); } }
