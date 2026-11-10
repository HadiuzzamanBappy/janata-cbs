import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { clientConfig } from "@/lib/core-config";

export function proxy(request: NextRequest) {
  const publicPaths: string[] = [clientConfig.routes.login, clientConfig.routes.api.login];
  const isPublicPath = publicPaths.includes(request.nextUrl.pathname);
  const hasSession = request.cookies.has(clientConfig.auth.cookieName);
  const isInitLogin = request.cookies.get(clientConfig.auth.initLoginCookie)?.value === "true";

  // FRAGILE SESSION: If user must change password, restrict them.
  if (hasSession && isInitLogin) {
    // Let them stay on the change-password page or hit API routes
    if (
      request.nextUrl.pathname === clientConfig.routes.changePassword ||
      request.nextUrl.pathname.startsWith("/api/")
    ) {
      return NextResponse.next();
    }

    // They abandoned the flow! Destroy the session and force re-login.
    const response = NextResponse.redirect(new URL(clientConfig.routes.login, request.url));
    response.cookies.delete(clientConfig.auth.cookieName);
    response.cookies.delete(clientConfig.auth.initLoginCookie);
    return response;
  }

  if (!isPublicPath && !hasSession) {
    const loginUrl = new URL(clientConfig.routes.login, request.url);
    return NextResponse.redirect(loginUrl);
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
