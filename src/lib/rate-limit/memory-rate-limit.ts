import { AppError } from "@/lib/errors/app-error";
type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();
export function enforceRateLimit(key: string, limit = 10, windowMs = 60_000) { const now = Date.now(); const existing = buckets.get(key); const bucket = !existing || existing.resetAt <= now ? { count: 0, resetAt: now + windowMs } : existing; bucket.count += 1; buckets.set(key, bucket); if (bucket.count > limit) throw new AppError("RATE_LIMITED", "Too many requests. Please try again shortly.", 429); }
export function getRequestIp(headers: Headers) { return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"; }
