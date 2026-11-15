import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIES = ["authjs.session-token", "__Secure-authjs.session-token"];

/**
 * Edge middleware: first line of defence. It only checks that a session cookie
 * exists — real authorisation always happens again on the server through
 * `requireSession()` / `requirePermission()` and inside every server action.
 */
export function middleware(request: NextRequest) {
  const hasSession = SESSION_COOKIES.some((name) => request.cookies.has(name));
  if (hasSession) return NextResponse.next();

  const signInUrl = new URL("/sign-in", request.url);
  signInUrl.searchParams.set("callbackUrl", `${request.nextUrl.pathname}${request.nextUrl.search}`);
  return NextResponse.redirect(signInUrl);
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/projects/:path*",
    "/proposals/:path*",
    "/tasks/:path*",
    "/members/:path*",
    "/meetings/:path*",
    "/achievements/:path*",
    "/knowledge/:path*",
    "/files/:path*",
    "/comms/:path*",
    "/reports/:path*",
    "/settings/:path*",
    "/forbidden",
  ],
};
