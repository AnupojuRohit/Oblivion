import { fail, ok } from "@/lib/api/response";
import { logger } from "@/lib/logger";
import { enforceRateLimit, getRequestIp } from "@/lib/rate-limit/memory-rate-limit";
import { registrationSchema } from "@/modules/auth/auth.schema";
import { authService } from "@/modules/auth/auth.service";
import { setSessionCookie } from "../route-helpers";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const ipAddress = getRequestIp(request.headers);
    enforceRateLimit(`register:${ipAddress}`, 5);
    const input = registrationSchema.parse(await request.json());
    const result = await authService.register(input, {
      ipAddress,
      userAgent: request.headers.get("user-agent") ?? undefined,
    });
    return setSessionCookie(ok(result.user, 201), result.token);
  } catch (error) {
    logger.warn("Registration failed", { code: error instanceof Error ? error.name : "unknown" });
    return fail(error);
  }
}
