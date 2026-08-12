/**
 * LogoLockup-Previews — die zwei realen Einbau-Größen der Site:
 * Navigation (h-11, apps/website/src/components/Nav.tsx) und
 * Footer (h-8, Footer.tsx). Dunkler Wrapper = Off-Black-Ground (bg-navy-900),
 * für den das Lockup gebaut ist (warmweiße Wortmarke + Verlaufs-„360").
 */
import { LogoLockup } from "@ph360/website";

export function Navigation() {
  return (
    <div className="inline-flex rounded-2xl bg-navy-900 px-8 py-6">
      <LogoLockup className="h-11 w-auto" />
    </div>
  );
}

export function Footer() {
  return (
    <div className="inline-flex rounded-2xl bg-navy-900 px-8 py-6">
      <LogoLockup className="h-8 w-auto" />
    </div>
  );
}

export function HellerGrund() {
  // theme-light flippt die Ground-/Text-Tokens: bg-navy-900 rendert hell,
  // die Wortmarke wechselt auf Marken-Navy — gleiche Klassennamen.
  return (
    <div className="theme-light inline-flex rounded-2xl border border-navy-900/15 bg-navy-900 px-8 py-6">
      <LogoLockup className="h-9 w-auto" />
    </div>
  );
}
