import crypto from "crypto";
import { cookies } from "next/headers";

// Server-only. Never import this from a "use client" component — it reads
// ADMIN_PASSWORD (no NEXT_PUBLIC_ prefix, so Next never bundles it into the
// client) and is only ever called from route handlers.

export const COOKIE_NAME = "admin_session";
export const SESSION_MAX_AGE = 60 * 60 * 12; // 12h

function getSecret() {
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret) throw new Error("ADMIN_PASSWORD is not set on the server");
  return secret;
}

// The cookie never stores the password itself — just an HMAC of a fixed
// string keyed by it, so a leaked cookie value can't be used to recover the
// password and can't be forged without already knowing it.
export function sessionToken() {
  return crypto.createHmac("sha256", getSecret()).update("admin-session").digest("hex");
}

function timingSafeStringEqual(a, b) {
  const bufA = Buffer.from(a || "");
  const bufB = Buffer.from(b || "");
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export function checkPassword(candidate) {
  return timingSafeStringEqual(candidate, getSecret());
}

export function isValidSessionCookie(value) {
  if (!value) return false;
  return timingSafeStringEqual(value, sessionToken());
}

export async function requireAdmin() {
  const store = await cookies();
  return isValidSessionCookie(store.get(COOKIE_NAME)?.value);
}
