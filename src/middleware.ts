import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const AUTH_COOKIE = "pto3d_auth";

async function hmacHex(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function isAuthed(req: NextRequest): Promise<boolean> {
  const secret =
    process.env.APP_SECRET?.trim() ||
    (process.env.NODE_ENV !== "production" ? "dev-secret-change-me" : "");
  if (!secret) return false;
  const token = req.cookies.get(AUTH_COOKIE)?.value;
  if (!token) return false;
  const expected = await hmacHex(secret, "photo-to-3d-session-v1");
  if (token.length !== expected.length) return false;
  let ok = 0;
  for (let i = 0; i < token.length; i++) {
    ok |= token.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return ok === 0;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const needsAuth =
    pathname === "/jobs" ||
    pathname.startsWith("/jobs/") ||
    pathname.startsWith("/api/jobs");

  if (!needsAuth) {
    return NextResponse.next();
  }

  if (await isAuthed(req)) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 },
    );
  }

  const login = new URL("/login", req.url);
  login.searchParams.set("next", pathname);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/jobs", "/jobs/:path*", "/api/jobs", "/api/jobs/:path*"],
};
