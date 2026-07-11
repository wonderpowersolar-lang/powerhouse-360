import { NextResponse, type NextRequest } from "next/server";

/**
 * Interim admin protection (WP-1.1): HTTP Basic auth on /admin/*.
 * Replaced by better-auth sessions + RBAC in WP-1.2. If ADMIN_BASIC_PASSWORD
 * is unset, admin access is denied entirely (fail closed).
 */
export const config = { matcher: ["/admin/:path*"] };

export function middleware(req: NextRequest) {
  const user = process.env.ADMIN_BASIC_USER ?? "admin";
  const password = process.env.ADMIN_BASIC_PASSWORD ?? "";
  const header = req.headers.get("authorization");

  if (password && header?.startsWith("Basic ")) {
    const decoded = atob(header.slice(6));
    const sep = decoded.indexOf(":");
    const givenUser = decoded.slice(0, sep);
    const givenPass = decoded.slice(sep + 1);
    if (givenUser === user && givenPass === password) {
      return NextResponse.next();
    }
  }

  return new NextResponse("Authentifizierung erforderlich.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Powerhouse 360 Admin"' },
  });
}
