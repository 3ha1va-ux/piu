import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_COOKIE_NAME, verifySessionToken } from "./lib/adminAuthCore";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const isValid = await verifySessionToken(token);

  // Login page logic
  if (pathname === "/admin/login") {
    if (isValid) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return NextResponse.next();
  }

  // Admin login API route is public
  if (pathname === "/api/admin/login") {
    return NextResponse.next();
  }

  // Protect Admin API routes
  if (pathname.startsWith("/api/admin")) {
    if (!isValid) {
      return NextResponse.json(
        { error: "ავტორიზაცია არ არის გავლილი" },
        { status: 401 }
      );
    }
    return NextResponse.next();
  }

  // Protect Admin UI pages
  if (pathname.startsWith("/admin")) {
    if (!isValid) {
      const loginUrl = new URL("/admin/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
