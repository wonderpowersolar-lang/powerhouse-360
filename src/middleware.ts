import { NextRequest, NextResponse } from "next/server";

/**
 * Domain-Routing: Modul-Domains zeigen an der Wurzel ihre One-Page
 * (Rewrite, keine Redirect — die URL bleibt sauber). Alle übrigen Pfade
 * (Funnel, Impressum, Datenschutz …) laufen unverändert durch dieselbe
 * App. powerhouse360.de bleibt komplett unberührt.
 */
const MODULE_HOSTS: Record<string, string> = {
  "chargemieter.de": "/chargemieter",
  "www.chargemieter.de": "/chargemieter",
  "smokemieter.de": "/smokemieter",
  "www.smokemieter.de": "/smokemieter",
};

export function middleware(req: NextRequest) {
  const host = (req.headers.get("host") ?? "").toLowerCase().split(":")[0];
  const target = MODULE_HOSTS[host];
  if (target) {
    const url = req.nextUrl.clone();
    url.pathname = target;
    return NextResponse.rewrite(url);
  }
  return NextResponse.next();
}

/** Nur die Wurzel prüfen — alles andere braucht kein Host-Routing. */
export const config = {
  matcher: ["/"],
};
