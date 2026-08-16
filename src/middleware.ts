import { NextRequest, NextResponse } from "next/server";

/**
 * Middleware to protect admin routes.
 * Checks for the session cookie. Full verification happens server-side,
 * but this prevents unauthenticated users from even loading admin pages.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow login page, public API routes, and auth routes
  if (
    pathname === "/admin/login" ||
    pathname.startsWith("/api/auth/") ||
    pathname.startsWith("/api/public/")
  ) {
    return NextResponse.next();
  }

  // Protect /admin and /api/admin routes
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    const session = request.cookies.get("raiz_session")?.value;
    if (!session) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "No autorizado." }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*", "/api/public/:path*"],
};
