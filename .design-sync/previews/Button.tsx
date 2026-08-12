/**
 * Button-Previews — Duo-Muster: Dark- und Light-Mode in EINEM Dokument
 * (linkes Panel = Noir-Marketing-Ground, rechtes = theme-light-App-Welt;
 * secondary flippt im Scope automatisch über die ink-Token).
 * Inhalte aus echten Site-Usages (CTAs, Funnel-Navigation ui.tsx).
 * Hover-Verlauf (GradientHover) ist reiner Hover-Zustand → keine Story.
 */
import { Button } from "@ph360/website";

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
        <ModeLabel>Dark · Marketing</ModeLabel>
        <div className="mt-4 flex items-center gap-3">
          <Button variant="primary" type="button">
            Beratung anfragen
          </Button>
          <Button variant="secondary" type="button">
            Mehr erfahren
          </Button>
        </div>
      </div>
      <div className="theme-light rounded-2xl border border-navy-900/15 bg-navy-900 p-6">
        <ModeLabel>Light · App-Welt</ModeLabel>
        <div className="mt-4 flex items-center gap-3">
          <Button variant="primary" type="button">
            Beratung anfragen
          </Button>
          <Button variant="secondary" type="button">
            Mehr erfahren
          </Button>
        </div>
      </div>
    </div>
  );
}

export function Gradient() {
  return (
    <div className="w-80 rounded-2xl bg-navy-900 p-8">
      <Button variant="gradient" type="button">
        Jetzt starten
      </Button>
      <div className="hairline-gradient mt-6" />
    </div>
  );
}

export function FunnelPaar() {
  return (
    <div className="inline-flex items-center gap-3 rounded-2xl bg-navy-900 p-8">
      <Button variant="secondary" type="button">
        Zurück
      </Button>
      <Button variant="primary" type="button">
        Weiter
      </Button>
    </div>
  );
}

export function Deaktiviert() {
  return (
    <div className="inline-flex rounded-2xl bg-navy-900 p-8">
      <Button variant="primary" type="button" disabled>
        Wird gesendet …
      </Button>
    </div>
  );
}
