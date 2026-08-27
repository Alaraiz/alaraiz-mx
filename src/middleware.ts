import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { getAuthSecret } from "@/lib/auth-secret";

const SECRET = getAuthSecret();
const COOKIE_NAME = "raiz_session";

/** Routes restricted to admin role only (editors get 403) */
const ADMIN_ONLY_API = ["/api/admin/customers", "/api/admin/crm-events", "/api/admin/reservations", "/api/admin/users"];
const ADMIN_ONLY_PAGES = ["/admin/crm", "/admin/payments"];

async function getRoleFromCookie(request: NextRequest): Promise<string | null> {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return (payload as { role?: string }).role || "admin";
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
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
    const role = await getRoleFromCookie(request);

    if (!role) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "No autorizado." }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    // Check admin-only API routes
    if (role !== "admin") {
      const isAdminOnlyApi = ADMIN_ONLY_API.some((prefix) => pathname.startsWith(prefix));
      if (isAdminOnlyApi) {
        return NextResponse.json({ error: "Acceso restringido a administradores." }, { status: 403 });
      }

      // Check admin-only pages (rare — editors hitting CRM/payments directly)
      const isAdminOnlyPage = ADMIN_ONLY_PAGES.some((prefix) => pathname.startsWith(prefix));
      if (isAdminOnlyPage) {
        return NextResponse.redirect(new URL("/admin", request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*", "/api/public/:path*"],
};
