import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

/** WP-1.2: optimistic session-cookie gate on /admin/*. Real permission checks
 *  happen server-side in each page/action. Replaces the interim Basic-Auth. */
export const config = { matcher: ["/admin/:path*"] };

export function middleware(req: NextRequest) {
  const cookie = getSessionCookie(req);
  if (!cookie) {
    const url = new URL("/login", req.url);
    url.searchParams.set("next", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}
