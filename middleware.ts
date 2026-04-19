import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/*
 * Next.js middleware runs on the server BEFORE any page loads.
 *
 * It checks for the access token in cookies. If someone tries to
 * visit /dashboard or /applications without a token, they get
 * redirected to /login instantly — the page never renders.
 *
 * This is different from the useEffect check in components:
 * - useEffect: page renders briefly, THEN redirects (flash of content)
 * - middleware: redirect happens BEFORE the page loads (no flash)
 */

// Pages that require authentication
const protectedPaths = ["/dashboard", "/applications"];

// Pages that logged-in users shouldn't see (redirect to dashboard)
const authPaths = ["/login", "/register"];

export function middleware(request: NextRequest) {
  const token = request.cookies.get("accessToken")?.value;
  const { pathname } = request.nextUrl;

  // Check if the path is protected
  const isProtected = protectedPaths.some((path) => pathname.startsWith(path));
  const isAuthPage = authPaths.some((path) => pathname === path);

  // No token + trying to access protected page → redirect to login
  if (isProtected && !token) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Has token + trying to access login/register → redirect to dashboard
  if (isAuthPage && token) {
    const dashboardUrl = new URL("/dashboard", request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

// Tell Next.js which paths this middleware runs on
export const config = {
  matcher: ["/dashboard/:path*", "/applications/:path*", "/login", "/register"],
};