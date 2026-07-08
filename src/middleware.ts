import { NextRequest, NextResponse } from "next/server";

/**
 * Domain-Routing: Die Modul-Domain chargemieter.de zeigt an der Wurzel die
 * ChargeMieter-One-Page (Rewrite, keine Redirect — die URL bleibt sauber).
 * Alle übrigen Pfade (Funnel, Impressum, Datenschutz …) laufen unverändert
 * durch dieselbe App. powerhouse360.de bleibt komplett unberührt.
 */
const CHARGE_HOSTS = new Set(["chargemieter.de", "www.chargemieter.de"]);

export function middleware(req: NextRequest) {
  const host = (req.headers.get("host") ?? "").toLowerCase().split(":")[0];
  if (CHARGE_HOSTS.has(host)) {
    const url = req.nextUrl.clone();
    url.pathname = "/chargemieter";
    return NextResponse.rewrite(url);
  }
  return NextResponse.next();
}

/** Nur die Wurzel prüfen — alles andere braucht kein Host-Routing. */
export const config = {
  matcher: ["/"],
};
