import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const publicPaths = ["/login", "/api/login"];
  const isPublicPath = publicPaths.includes(request.nextUrl.pathname);
  const hasSession = request.cookies.has("sid");
  const isInitLogin = request.cookies.get("initLogin")?.value === "true";

  // FRAGILE SESSION: If user must change password, restrict them.
  if (hasSession && isInitLogin) {
    // Let them stay on the change-password page or hit API routes
    if (
      request.nextUrl.pathname === "/change-password" ||
      request.nextUrl.pathname.startsWith("/api/")
    ) {
      return NextResponse.next();
    }

    // They abandoned the flow! Destroy the session and force re-login.
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("sid");
    response.cookies.delete("initLogin");
    return response;
  }

  if (!isPublicPath && !hasSession) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (isPublicPath && hasSession && request.nextUrl.pathname === "/login") {
    // Redirect logged-in users away from login page
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next (Next.js internals and static files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next|favicon.ico).*)",
  ],
};
