import { createHash, randomBytes } from "crypto";
import { requireSessionSecret } from "@/lib/env";

export const SESSION_COOKIE = "learnhub_session";
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** Generate a cryptographically random token for the browser session cookie. */
export function createSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

/**
 * Store a keyed hash rather than the raw token. A database leak therefore
 * does not directly reveal reusable browser session tokens.
 */
export function hashSessionToken(token: string): string {
  return createHash("sha256")
    .update(`${requireSessionSecret()}:${token}`)
    .digest("hex");
}

/** Calculate the expiry timestamp once when a session is created. */
export function sessionExpiry(): Date {
  return new Date(Date.now() + SESSION_TTL_MS);
}
