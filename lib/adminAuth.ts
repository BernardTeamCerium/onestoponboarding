import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/**
 * Minimal session for the submissions dashboard: a signed, httpOnly cookie
 * carrying only an expiry, signed with ADMIN_PASSWORD. Changing the password
 * therefore invalidates every existing session.
 */

const COOKIE = "osp_admin";
const MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

export function isAdminConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD);
}

function sign(expiresAt: number, secret: string): string {
  return createHmac("sha256", secret).update(String(expiresAt)).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

/** Checks a submitted password against ADMIN_PASSWORD. */
export function passwordMatches(candidate: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  return safeEqual(candidate, expected);
}

export function createSessionValue(): { value: string; maxAge: number } {
  const secret = process.env.ADMIN_PASSWORD ?? "";
  const expiresAt = Date.now() + MAX_AGE_SECONDS * 1000;
  return { value: `${expiresAt}.${sign(expiresAt, secret)}`, maxAge: MAX_AGE_SECONDS };
}

export const SESSION_COOKIE = COOKIE;

/** True when the request carries a valid, unexpired session. */
export async function isSignedIn(): Promise<boolean> {
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret) return false;

  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return false;

  const [expiresPart, signature] = raw.split(".");
  if (!expiresPart || !signature) return false;

  const expiresAt = Number(expiresPart);
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return false;

  return safeEqual(signature, sign(expiresAt, secret));
}
