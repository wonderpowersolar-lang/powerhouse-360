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

export function HellerGrund() {
  // theme-light-Scope: secondary flippt AUTOMATISCH mit (ink-Token), kein
  // tone nötig. tone="light" ist der scope-lose Artboard-Override (feste
  // Hexwerte, optisch identisch) — bewusst ohne eigene Story.
  return (
    <div className="theme-light inline-flex items-center gap-3 rounded-2xl bg-navy-900 p-8">
      <Button variant="secondary" type="button">
        Mehr erfahren
      </Button>
      <Button variant="primary" type="button">
        Beratung anfragen
      </Button>
    </div>
  );
}
