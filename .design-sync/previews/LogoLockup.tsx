/**
 * LogoLockup-Previews — Duo-Muster: beide Modi in EINEM Dokument.
 * Nav-Größe (h-11, Nav.tsx) auf Noir und in der theme-light-App-Welt —
 * die Wortmarke flippt auf Marken-Navy, Icon und Verlaufs-„360" bleiben.
 * Dazu die Footer-Größe (h-8, Footer.tsx) auf ihrem nativen Noir-Ground.
 */
import { LogoLockup } from "@ph360/website";

function ModeLabel({ children }: { children: string }) {
  return (
    <p className="text-xs font-medium uppercase tracking-widest text-ink-faint">
      {children}
    </p>
  );
}

export function ModiDuo() {
  return (
    <div className="flex items-stretch gap-3">
      <div className="rounded-2xl bg-navy-900 px-8 py-6">
        <ModeLabel>Dark</ModeLabel>
        <div className="mt-4">
          <LogoLockup className="h-11 w-auto" />
        </div>
      </div>
      <div className="theme-light rounded-2xl border border-navy-900/15 bg-navy-900 px-8 py-6">
        <ModeLabel>Light</ModeLabel>
        <div className="mt-4">
          <LogoLockup className="h-11 w-auto" />
        </div>
      </div>
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
