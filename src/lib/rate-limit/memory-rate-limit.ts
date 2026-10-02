import { AppError } from "@/lib/errors/app-error";

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 10_000;

function prune(now: number) {
  if (buckets.size < MAX_BUCKETS) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
    if (buckets.size < MAX_BUCKETS * 0.8) break;
  }
}

export function enforceRateLimit(key: string, limit = 10, windowMs = 60_000) {
  const now = Date.now();
  prune(now);
  const existing = buckets.get(key);
  const bucket = !existing || existing.resetAt <= now
    ? { count: 0, resetAt: now + windowMs }
    : existing;

  bucket.count += 1;
  buckets.set(key, bucket);

  if (bucket.count > limit) {
    throw new AppError("RATE_LIMITED", "Too many requests. Please try again shortly.", 429);
  }
}

export function getRequestIp(headers: Headers) {
  return (
    headers.get("x-real-ip")?.trim() ||
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}
