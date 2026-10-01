import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { appConfig } from "@/lib/config";

export function proxy(request: NextRequest) {
  const publicPaths: string[] = [appConfig.routes.login, appConfig.routes.api.login];
  const isPublicPath = publicPaths.includes(request.nextUrl.pathname);
  const hasSession = request.cookies.has(appConfig.auth.cookieName);
  const isInitLogin = request.cookies.get(appConfig.auth.initLoginCookie)?.value === "true";

  // FRAGILE SESSION: If user must change password, restrict them.
  if (hasSession && isInitLogin) {
    // Let them stay on the change-password page or hit API routes
    if (
      request.nextUrl.pathname === appConfig.routes.changePassword ||
      request.nextUrl.pathname.startsWith("/api/")
    ) {
      return NextResponse.next();
    }

    // They abandoned the flow! Destroy the session and force re-login.
    const response = NextResponse.redirect(new URL(appConfig.routes.login, request.url));
    response.cookies.delete(appConfig.auth.cookieName);
    response.cookies.delete(appConfig.auth.initLoginCookie);
    return response;
  }

  if (!isPublicPath && !hasSession) {
    const loginUrl = new URL(appConfig.routes.login, request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (isPublicPath && hasSession && request.nextUrl.pathname === appConfig.routes.login) {
    // Redirect logged-in users directly to dashboard
    return NextResponse.redirect(new URL(appConfig.routes.dashboard, request.url));
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
