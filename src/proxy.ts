import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const publicPaths = ["/login", "/api/login"];
  const isPublicPath = publicPaths.includes(request.nextUrl.pathname);
  const hasSession = request.cookies.has("sid");

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
