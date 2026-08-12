/**
 * Button-Previews — Kompositionen aus echten Site-Usages:
 * Funnel-Navigation (Zurück/Weiter, apps/website/src/components/funnel/ui.tsx)
 * und CTA-Reihen der Sektionspanels. Dunkler Wrapper = Off-Black-Ground der
 * Site (Token bg-navy-900), auf dem die Varianten designt sind.
 * Hover-Verlauf (GradientHover) ist ein reiner Hover-Zustand → nicht statisch
 * renderbar, siehe NOTES.md.
 */
import { Button } from "@ph360/website";

export function Primary() {
  return (
    <div className="inline-flex rounded-2xl bg-navy-900 p-8">
      <Button variant="primary" type="button">
        Beratung anfragen
      </Button>
    </div>
  );
}

export function Secondary() {
  return (
    <div className="inline-flex rounded-2xl bg-navy-900 p-8">
      <Button variant="secondary" type="button">
        Mehr erfahren
      </Button>
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
