import { createHash, randomBytes } from "crypto";
import { requireSessionSecret } from "@/lib/env";
export const SESSION_COOKIE = "learnhub_session";
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
export function createSessionToken() { return randomBytes(32).toString("base64url"); }
export function hashSessionToken(token: string) { return createHash("sha256").update(`${requireSessionSecret()}:${token}`).digest("hex"); }
export function sessionExpiry() { return new Date(Date.now() + SESSION_TTL_MS); }
