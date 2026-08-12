/**
 * LogoMark-Previews — Duo-Muster: das freistehende Markenzeichen (64/40 px)
 * auf Noir und in der theme-light-App-Welt, in EINEM Dokument.
 */
import { LogoMark } from "@ph360/website";

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
      <div className="rounded-2xl bg-navy-900 p-6">
        <ModeLabel>Dark</ModeLabel>
        <div className="mt-4 flex items-end gap-6">
          <LogoMark size={64} />
          <LogoMark size={40} />
        </div>
      </div>
      <div className="theme-light rounded-2xl border border-navy-900/15 bg-navy-900 p-6">
        <ModeLabel>Light</ModeLabel>
        <div className="mt-4 flex items-end gap-6">
          <LogoMark size={64} />
          <LogoMark size={40} />
        </div>
      </div>
    </div>
  );
}
