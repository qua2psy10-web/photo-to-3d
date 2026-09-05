import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const AUTH_COOKIE = "pto3d_auth";

/** Shared secret for simple single-user auth. */
export function getAppSecret(): string {
  const secret = process.env.APP_SECRET;
  if (secret && secret.trim().length > 0) return secret.trim();
  // Dev fallback so local server works out of the box; override in .env.local
  if (process.env.NODE_ENV !== "production") {
    return "dev-secret-change-me";
  }
  throw new Error("APP_SECRET is required in production");
}

export function sessionToken(secret = getAppSecret()): string {
  return createHmac("sha256", secret).update("photo-to-3d-session-v1").digest("hex");
}

export function isValidSessionToken(
  token: string | undefined | null,
  secret = getAppSecret(),
): boolean {
  if (!token) return false;
  const expected = sessionToken(secret);
  try {
    const a = Buffer.from(token);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export async function isAuthenticated(): Promise<boolean> {
  try {
    const jar = await cookies();
    const token = jar.get(AUTH_COOKIE)?.value;
    return isValidSessionToken(token);
  } catch {
    return false;
  }
}

export function verifyPassword(password: string): boolean {
  const secret = getAppSecret();
  try {
    const a = Buffer.from(password);
    const b = Buffer.from(secret);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
