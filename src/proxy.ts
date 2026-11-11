import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { clientConfig } from "@/lib/core-config";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const publicPaths: string[] = [clientConfig.routes.login, clientConfig.routes.api.login];
  const isPublicPath = publicPaths.includes(pathname);
  const hasSession = request.cookies.has(clientConfig.auth.cookieName);
  const isInitLogin = request.cookies.get(clientConfig.auth.initLoginCookie)?.value === "true";

  // Restricted pre-auth session: user must complete initial password change before accessing workbench.
  // Allow /change-password, /login (handled by Server Component with Redis check to avoid self-redirects), and /api/*.
  if (hasSession && isInitLogin) {
    if (
      pathname === clientConfig.routes.changePassword ||
      pathname === clientConfig.routes.login ||
      pathname.startsWith("/api/")
    ) {
      return NextResponse.next();
    }

    return NextResponse.redirect(new URL(clientConfig.routes.changePassword, request.url));
  }

  if (!isPublicPath && !hasSession) {
    return NextResponse.redirect(new URL(clientConfig.routes.login, request.url));
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
