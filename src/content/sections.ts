/**
 * POWERHOUSE 360 — single source of truth for the scroll journey + quiet copy.
 *
 * EDIT COPY HERE. German, quiet, premium, precise — very few words. The
 * cinematic journey is 9 stations (hero → system → 4 modules → exploded →
 * platform → cta); between platform and cta the page leaves the stage for
 * the four QUIET sections (why / targets / onboarding / faq), whose copy
 * also lives in this file.
 *
 * Camera coordinates are legacy R3F keyframes (world units) kept so the
 * preserved BuildingScene path still type-checks; the cinematic image/video
 * stage ignores them.
 */

import type { Vector3Tuple } from "three";

export type Emphasis =
  | "building"
  | "pv"
  | "heatpump"
  | "hub"
  | "wallbox"
  | "smoke"
  | "apartment"
  | "dashboard"
  | "all";

/** Module accent — used ONLY for orientation (kicker, hairline, status dot). */
export type Accent = "gold" | "power" | "heat" | "charge" | "smoke";

/** A small KPI chip (legacy floating panels — unused by the cinematic build). */
export interface PanelKpi {
  label: string;
  value: string;
  bar?: number;
}

/** Legacy floating product card definition (kept for type-compat). */
export interface ProductPanelDef {
  number: string;
  tag: string;
  title: string;
  subtitle: string;
  bullets: string[];
  kpis?: PanelKpi[];
  theme: "dark" | "light";
  accent: "teal" | "green" | "aqua" | "amber";
}

export interface SectionDef {
  id: string;
  index: number;
  /** small label above the headline — `01 / Powermieter` style */
  kicker: string;
  /** main headline. For module stations prefer `lines` (staccato copy). */
  headline: string;
  /** optional second headline line rendered in gold (the key line). */
  headlineAccent?: string;
  /** staccato module copy — one short sentence per line, revealed in sequence */
  lines?: string[];
  subline: string;
  /** layout side for the text block on desktop */
  align: "left" | "right" | "center";
  /** module accent for kicker / hairline / numeral */
  accent?: Accent;
  cta?: { label: string; href: string; variant: "primary" | "secondary" }[];
  /** legacy R3F emphasis (inert on the cinematic stage) */
  emphasis: Emphasis;
  /** legacy R3F camera keyframe (inert on the cinematic stage) */
  camPos: Vector3Tuple;
  camTarget: Vector3Tuple;
  /** plateau share of this station's scroll band, 0..1 */
  hold?: number;
  /** optional per-section still override (else STATION_IMAGE map) */
  image?: string;
  /** legacy floating product card (unused by the cinematic build) */
  panel?: ProductPanelDef;
}

export const SECTIONS: SectionDef[] = [
  // ──────────────────────────────────────────────────────────── 0 · HERO
  {
    id: "hero",
    index: 0,
    kicker: "Powerhouse 360",
    headline: "Powerhouse 360",
    headlineAccent: "Das Betriebssystem deiner Immobilie.",
    subline:
      "Eine Plattform für Energie, Wärme, Ladeinfrastruktur, Sicherheit und digitale Prozesse im Mehrfamilienhaus.",
    align: "left",
    accent: "gold",
    cta: [
      { label: "Demo anfragen", href: "/demo", variant: "primary" },
      {
        label: "Projekt besprechen",
        href: "/projekt-besprechen",
        variant: "secondary",
      },
    ],
    emphasis: "building",
    hold: 0.8,
    camPos: [16, 13, 21],
    camTarget: [0, 7.4, 0],
  },

  // ─────────────────────────────────────────── 1 · DAS GEBÄUDE WIRD SYSTEM
  {
    id: "system",
    index: 1,
    kicker: "Das Gebäude wird System",
    headline: "Ein Mehrfamilienhaus ist heute ein technisches System.",
    headlineAccent: "Powerhouse 360 macht es steuerbar.",
    subline:
      "Energieflüsse, Wärmedaten, Ladeinfrastruktur, Sicherheitsgeräte, Bewohner, Abrechnung, Kommunikation – ein modernes Gebäude ist längst mehr als Beton, Zähler und Papier.",
    align: "left",
    accent: "gold",
    emphasis: "building",
    hold: 0.76,
    camPos: [10, 9, 16],
    camTarget: [0, 6, 0],
  },

  // ──────────────────────────────────────────────────── 2 · POWERMIETER
  {
    id: "powermieter",
    index: 2,
    kicker: "01 / Powermieter",
    headline: "Strom",
    lines: [
      "Stromflüsse sichtbar machen.",
      "Verbrauch erfassen.",
      "Mieter sauber einbinden.",
      "Abrechnung digital vorbereiten.",
    ],
    subline:
      "Das Modul für Mieterstrom, Energietransparenz und digitale Stromprozesse im Mehrfamilienhaus.",
    align: "right",
    accent: "power",
    cta: [
      {
        label: "Mehr zu Powermieter",
        href: "https://powermieter.de",
        variant: "secondary",
      },
    ],
    emphasis: "pv",
    hold: 0.78,
    camPos: [-0.85, 3.1, 0.9],
    camTarget: [-1.05, 3.0, -2.8],
  },

  // ──────────────────────────────────────────────────── 3 · HEATMIETER
  {
    id: "heatmieter",
    index: 3,
    kicker: "02 / Heatmieter",
    headline: "Wärme",
    lines: [
      "Wärme wird messbar.",
      "Verbrauch wird transparent.",
      "Heizkostenprozesse werden digital.",
    ],
    subline:
      "Das Modul für Wärme, Heizkosten und CO₂-Kostenlogik – mit besserer Datenqualität für den Gebäudebetrieb.",
    align: "left",
    accent: "heat",
    cta: [
      {
        label: "Mehr zu Heatmieter",
        href: "https://heatmieter.de",
        variant: "secondary",
      },
    ],
    emphasis: "heatpump",
    hold: 0.78,
    camPos: [9.4, 1.85, 4.7],
    camTarget: [4.35, 0.9, 1.7],
  },

  // ──────────────────────────────────────────────────── 4 · CHARGEMIETER
  {
    id: "chargemieter",
    index: 4,
    kicker: "03 / Chargemieter",
    headline: "Laden",
    lines: [
      "Ladeinfrastruktur wird planbar.",
      "Lasten werden steuerbar.",
      "Nutzung wird abrechenbar.",
    ],
    subline:
      "Das Modul für Ladeinfrastruktur, Lastmanagement und Abrechnung im Mehrfamilienhaus.",
    align: "right",
    accent: "charge",
    cta: [
      {
        label: "Mehr zu Chargemieter",
        href: "https://chargemieter.de",
        variant: "secondary",
      },
    ],
    emphasis: "wallbox",
    hold: 0.78,
    camPos: [2.4, -1.3, -1.4],
    camTarget: [-0.9, -1.55, -3.6],
  },

  // ──────────────────────────────────────────────────── 5 · SMOKEMIETER
  {
    id: "smokemieter",
    index: 5,
    kicker: "04 / Smokemieter",
    headline: "Sicherheit",
    lines: [
      "Status sichtbar.",
      "Ferninspektion möglich.",
      "Ereignisse klar kommuniziert.",
    ],
    subline:
      "Das Modul für digitale Rauchwarnmelder-Verwaltung: Ferninspektion, Live-Status und Ereigniskommunikation.",
    align: "left",
    accent: "smoke",
    cta: [
      {
        label: "Mehr zu Smokemieter",
        href: "https://smokemieter.de",
        variant: "secondary",
      },
    ],
    emphasis: "smoke",
    hold: 0.78,
    camPos: [0.1, 6.7, 1.0],
    camTarget: [0.0, 7.48, -1.65],
  },

  // ─────────────────────────────────────────────── 6 · EXPLODED ASSEMBLY
  {
    id: "exploded",
    index: 6,
    kicker: "Ein Betriebssystem",
    headline: "Viele Systeme. Ein Gebäude. Eine Plattform.",
    subline:
      "Dach, Zähler, Technikraum, Wärme, Ladepunkte, Wohnungen, Rauchwarnmelder – Powerhouse 360 verbindet fragmentierte Systeme zu einem Betriebssystem.",
    align: "center",
    accent: "gold",
    emphasis: "all",
    hold: 0.76,
    camPos: [0, 9, 25],
    camTarget: [0, 8, 0],
  },

  // ──────────────────────────────────────────────────── 7 · PLATTFORM
  {
    id: "dashboard",
    index: 7,
    kicker: "Die Plattform",
    headline: "Ein Gebäude. Vier Module. Ein Betriebssystem.",
    subline:
      "Alle Module laufen in einer zentralen Ansicht zusammen – Status, Onboarding und Abrechnungsreife auf einen Blick.",
    align: "center",
    accent: "gold",
    emphasis: "dashboard",
    hold: 0.8,
    camPos: [0, 9.0, 25],
    camTarget: [0, 8, 0],
  },

  // ──────────────────────────────────────────────────────── 8 · FINAL CTA
  {
    id: "cta",
    index: 8,
    kicker: "Powerhouse 360",
    headline: "Mach dein Mehrfamilienhaus digital steuerbar.",
    subline:
      "Powerhouse 360 verbindet Energie, Wärme, Ladeinfrastruktur, Sicherheit und Prozesse in einem zentralen Betriebssystem für Immobilien.",
    align: "left",
    accent: "gold",
    cta: [
      { label: "Demo anfragen", href: "/demo", variant: "primary" },
      {
        label: "Projekt besprechen",
        href: "/projekt-besprechen",
        variant: "secondary",
      },
    ],
    emphasis: "all",
    hold: 0.85,
    camPos: [14.5, 12.8, 20.5],
    camTarget: [0, 7.4, 0],
  },
];

/** Nav anchor links (chapter shortcuts; "/#" works from every route). */
export const NAV_LINKS = [
  { label: "System", href: "/#system" },
  { label: "Module", href: "/#powermieter" },
  { label: "Plattform", href: "/#dashboard" },
  { label: "Vorteile", href: "/#vorteile" },
  { label: "Ablauf", href: "/#ablauf" },
  { label: "FAQ", href: "/#faq" },
];

/** ModuleNavigation chapter indicator: number + short label per station. */
export const STATION_LABELS: Record<string, string> = {
  hero: "Start",
  system: "System",
  powermieter: "Powermieter",
  heatmieter: "Heatmieter",
  chargemieter: "Chargemieter",
  smokemieter: "Smokemieter",
  exploded: "Ein System",
  dashboard: "Plattform",
  cta: "Kontakt",
};

/** Accent → CSS custom property (globals.css @theme tokens). */
export const ACCENT_VAR: Record<Accent, string> = {
  gold: "var(--color-gold)",
  power: "var(--color-mod-power)",
  heat: "var(--color-mod-heat)",
  charge: "var(--color-mod-charge)",
  smoke: "var(--color-mod-smoke)",
};

/**
 * The four modules — platform grid, mobile cards, Modul-Detail-Links.
 * `url` ist die jeweilige Modul-Domain (Powerhouse 360 bleibt der Hub);
 * zentral hier pflegen, alle Buttons ziehen daraus.
 */
export const MODULES = [
  {
    num: "01",
    id: "powermieter",
    name: "Powermieter",
    domain: "Strom",
    desc: "Mieterstrom, Energieflüsse und digitale Stromprozesse",
    accent: "power" as Accent,
    url: "https://powermieter.de",
  },
  {
    num: "02",
    id: "heatmieter",
    name: "Heatmieter",
    domain: "Wärme",
    desc: "Wärme, Heizkosten und CO₂-Kostenlogik",
    accent: "heat" as Accent,
    url: "https://heatmieter.de",
  },
  {
    num: "03",
    id: "chargemieter",
    name: "Chargemieter",
    domain: "Laden",
    desc: "Ladeinfrastruktur, Lastmanagement und Abrechnung",
    accent: "charge" as Accent,
    url: "https://chargemieter.de",
  },
  {
    num: "04",
    id: "smokemieter",
    name: "Smokemieter",
    domain: "Sicherheit",
    desc: "Rauchwarnmelder, Ferninspektion und Ereignisse",
    accent: "smoke" as Accent,
    url: "https://smokemieter.de",
  },
] as const;

/**
 * Platform dashboard cards — believable abstract UI states, no fake
 * customer data, no meaningless dummy metrics.
 */
export const PLATFORM_CARDS: {
  label: string;
  state: string;
  accent: Accent;
  detail: string;
}[] = [
  { label: "Energie", state: "Aktiv", accent: "power", detail: "Energieflüsse werden erfasst" },
  { label: "Wärme", state: "Aktiv", accent: "heat", detail: "Verbrauchsdaten laufen ein" },
  { label: "Ladepunkte", state: "Aktiv", accent: "charge", detail: "Lastmanagement in Betrieb" },
  { label: "Rauchwarnmelder", state: "Überwacht", accent: "smoke", detail: "Alle Geräte melden Status" },
  { label: "Bewohner", state: "Eingebunden", accent: "gold", detail: "Zugänge eingerichtet" },
  { label: "Abrechnung", state: "Vorbereitet", accent: "gold", detail: "Daten abrechnungsbereit" },
  { label: "Onboarding", state: "Abgeschlossen", accent: "gold", detail: "Alle Schritte dokumentiert" },
  { label: "Betriebsstatus", state: "Stabil", accent: "gold", detail: "System läuft im Regelbetrieb" },
];

/* ─────────────────────────────────────────────────────── quiet sections */

/** §9 — Warum Powerhouse 360. */
export const WHY_BLOCKS = [
  {
    title: "Ein System statt Insellösungen",
    body: "Alle Gewerke laufen in einer Plattform zusammen – statt in getrennten Portalen und Listen.",
  },
  {
    title: "Weniger manueller Verwaltungsaufwand",
    body: "Digitale Prozesse ersetzen wiederkehrende Handarbeit in Betrieb und Abrechnung.",
  },
  {
    title: "Klare Daten für Betrieb und Abrechnung",
    body: "Ein Datenbestand, auf den sich Verwaltung, Eigentümer und Partner verlassen können.",
  },
  {
    title: "Modular einführbar",
    body: "Mit einem Modul starten, weitere zuschalten, wenn das Objekt bereit ist.",
  },
  {
    title: "Für Bestand und Neubau",
    body: "Powerhouse 360 arbeitet mit vorhandener Technik – und wächst mit neuen Projekten.",
  },
  {
    title: "Skalierbar für Portfolios",
    body: "Von der einzelnen WEG bis zum Wohnungsunternehmen mit hunderten Einheiten.",
  },
];

/** §10 — Zielgruppen. */
export const TARGET_GROUPS = [
  {
    title: "Hausverwaltungen",
    body: "Weniger Einzelsysteme, klare Zuständigkeiten und ein Objektstatus, der ohne Rückfragen auskommt.",
  },
  {
    title: "WEGs",
    body: "Transparente Daten und nachvollziehbare Abrechnung für Eigentümergemeinschaften.",
  },
  {
    title: "Bestandshalter",
    body: "Bestandsgebäude digital steuerbar machen – ohne Kernsanierung der Technik.",
  },
  {
    title: "Wohnungsunternehmen",
    body: "Ein Betriebsmodell für viele Objekte: standardisiert, skalierbar, berichtsfähig.",
  },
  {
    title: "Stadtwerke & Betreiber",
    body: "Energie- und Ladeprodukte im Mehrfamilienhaus betreiben – auf einer gemeinsamen Plattform.",
  },
];

/** §11 — Einführung / Onboarding. */
export const ONBOARDING_STEPS = [
  {
    step: "01",
    title: "Objekt prüfen",
    body: "Gebäude, Technik und Ziele erfassen. Wir bewerten, was vorhanden ist.",
  },
  {
    step: "02",
    title: "Module auswählen",
    body: "Energie, Wärme, Laden, Sicherheit – nur was das Objekt braucht.",
  },
  {
    step: "03",
    title: "Infrastruktur und Daten anbinden",
    body: "Zähler, Geräte und Datenquellen werden verbunden.",
  },
  {
    step: "04",
    title: "Bewohner einbinden",
    body: "Nutzer werden informiert, eingebunden und digital angebunden.",
  },
  {
    step: "05",
    title: "Betrieb digital steuern",
    body: "Das Objekt läuft im Betriebssystem – mit klarem Status und klaren Prozessen.",
  },
];

/** §12 — FAQ. */
export const FAQ_ITEMS = [
  {
    q: "Kann man einzelne Module separat nutzen?",
    a: "Ja. Jedes Modul funktioniert eigenständig. Die Plattform verbindet sie, sobald mehrere aktiv sind – der Einstieg ist mit einem einzelnen Modul möglich.",
  },
  {
    q: "Ist Powerhouse 360 für Bestandsgebäude geeignet?",
    a: "Ja. Die Plattform ist für den Bestand gebaut: vorhandene Zähler, Anlagen und Geräte werden angebunden, wo es technisch sinnvoll ist. Ein Neubau ist keine Voraussetzung.",
  },
  {
    q: "Wie läuft die Einführung ab?",
    a: "In fünf Schritten: Objekt prüfen, Module auswählen, Infrastruktur und Daten anbinden, Bewohner einbinden, Betrieb digital steuern. Der Zeitrahmen hängt vom Objekt ab – typisch sind wenige Wochen.",
  },
  {
    q: "Welche Daten werden benötigt?",
    a: "Zu Beginn Objektstammdaten, eine Zähler- und Anlagenübersicht sowie die gewünschten Module. Alles Weitere entsteht strukturiert im Onboarding.",
  },
  {
    q: "Für welche Objektgrößen eignet sich die Plattform?",
    a: "Vom einzelnen Mehrfamilienhaus bis zum Portfolio. Entscheidend ist nicht die Größe, sondern der Anspruch, das Objekt digital zu betreiben.",
  },
  {
    q: "Gibt es eine Demo?",
    a: "Ja. Wir zeigen das System an einem Beispielobjekt – online, in rund 30 Minuten. Eine kurze Anfrage genügt.",
  },
];
