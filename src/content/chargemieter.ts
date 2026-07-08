/**
 * ChargeMieter — single source of truth for the /chargemieter scroll journey.
 *
 * EDIT COPY HERE. German, quiet, premium, precise. The journey is 12 scenes:
 * hero (car→wallbox scrub) → problem → lösung → eigentümer → verwaltung →
 * mieter → lastmanagement → abrechnung → förderung → ablauf → plattform → cta.
 *
 * Wording constraints (bewusst):
 *  - Förderung: nie garantieren — »prüfen«, »erste Einordnung«, »abhängig von
 *    Programm, Objekt und Zeitpunkt«.
 *  - Abrechnung: keine Eichrechts-Zusagen — »Grundlage für transparente
 *    Abrechnung schaffen«, »abrechnungsfähig strukturieren«.
 */

export type CmOverlay =
  | "none"
  | "complexity"
  | "benefits"
  | "phases"
  | "adminboard"
  | "session"
  | "loadbalance"
  | "billing"
  | "funding"
  | "journey"
  | "dashboard";

export interface CmScene {
  id: string;
  index: number;
  /** scroll runway height of this scene's band (vh) */
  heightVh: number;
  /** plateau share of the band where the stage rests (0..1) */
  hold: number;
  kicker: string;
  headline: string;
  /** optional second headline line in cyan (the key line) */
  headlineAccent?: string;
  subline: string;
  align: "left" | "right" | "center";
  overlay: CmOverlay;
  cta?: { label: string; href: string; variant: "primary" | "secondary" }[];
}

/* CTAs — auf die bestehenden Funnel vorbereitet (Parameter werden vom Funnel
   später ausgelesen; heute landen Besucher im geführten Projekt-Funnel). */
export const CM_CTA = {
  foerderung: {
    label: "Kostenfreie Förderberatung",
    href: "/projekt-besprechen?modul=chargemieter&thema=foerderung",
  },
  planung: {
    label: "Ladeinfrastruktur planen",
    href: "/projekt-besprechen?modul=chargemieter&thema=planung",
  },
  demo: {
    label: "Abrechnungssystem ansehen",
    href: "/demo",
  },
} as const;

export const CM_SCENES: CmScene[] = [
  // ───────────────────────────────────────────────── 0 · HERO
  {
    id: "hero",
    index: 0,
    heightVh: 280,
    hold: 0.82,
    kicker: "Powerhouse 360 · Modul 03",
    headline: "ChargeMieter",
    headlineAccent:
      "Wallboxen im Mehrfamilienhaus — geplant, gesteuert und sauber abgerechnet.",
    subline:
      "ChargeMieter macht Ladeinfrastruktur für WEGs, Hausverwaltungen und Eigentümer einfach betreibbar: von der Förderprüfung über Planung und Lastmanagement bis zur nutzerbezogenen Abrechnung.",
    align: "left",
    overlay: "none",
    cta: [
      { ...CM_CTA.foerderung, variant: "primary" },
      { ...CM_CTA.planung, variant: "secondary" },
    ],
  },

  // ───────────────────────────────────────────────── 1 · PROBLEM
  {
    id: "komplexitaet",
    index: 1,
    heightVh: 190,
    hold: 0.74,
    kicker: "Die Ausgangslage",
    headline: "Eine Wallbox ist einfach.",
    headlineAccent: "Ein Mehrfamilienhaus ist komplex.",
    subline:
      "Im Mehrfamilienhaus müssen Stellplätze, Nutzer, Netzanschluss, Eigentümerfreigaben, Lastmanagement und Abrechnung zusammenpassen. Genau hier beginnt ChargeMieter.",
    align: "left",
    overlay: "complexity",
  },

  // ───────────────────────────────────────────────── 2 · LÖSUNG
  {
    id: "loesung",
    index: 2,
    heightVh: 190,
    hold: 0.74,
    kicker: "Die Komplettlösung",
    headline: "ChargeMieter bringt Struktur in Ihr Ladeinfrastruktur-Projekt.",
    subline:
      "Wir verbinden technische Planung, Förderberatung, Ladepunktverwaltung, Nutzerzuordnung, Lastmanagement und Abrechnung zu einem klaren System für Mehrfamilienhäuser.",
    align: "right",
    overlay: "benefits",
  },

  // ───────────────────────────────────────────────── 3 · EIGENTÜMER & WEG
  {
    id: "eigentuemer",
    index: 3,
    heightVh: 185,
    hold: 0.74,
    kicker: "Für Eigentümer & WEGs",
    headline: "Ladefähigkeit wird zum Standortvorteil.",
    subline:
      "ChargeMieter hilft Eigentümern und WEGs, Ladeinfrastruktur geordnet aufzubauen, Fördermöglichkeiten zu prüfen und den Gebäudewert langfristig zu stärken — Ausbau in Etappen inklusive.",
    align: "left",
    overlay: "phases",
  },

  // ───────────────────────────────────────────────── 4 · VERWALTUNG
  {
    id: "verwaltung",
    index: 4,
    heightVh: 190,
    hold: 0.76,
    kicker: "Für Hausverwaltungen",
    headline: "Weniger Rückfragen. Klare Zuordnung. Saubere Abrechnung.",
    subline:
      "ChargeMieter reduziert operativen Aufwand: Nutzer, Ladepunkte, Ladevorgänge und Abrechnungsdaten werden digital strukturiert.",
    align: "right",
    overlay: "adminboard",
  },

  // ───────────────────────────────────────────────── 5 · MIETER
  {
    id: "mieter",
    index: 5,
    heightVh: 190,
    hold: 0.76,
    kicker: "Für Mieter",
    headline: "Bequem zuhause laden.",
    subline:
      "Mieter erhalten einen klar zugeordneten Ladepunkt, transparente Ladevorgänge und eine nachvollziehbare Abrechnung — direkt im eigenen Wohnumfeld.",
    align: "left",
    overlay: "session",
  },

  // ───────────────────────────────────────────────── 6 · LASTMANAGEMENT
  {
    id: "lastmanagement",
    index: 6,
    heightVh: 195,
    hold: 0.76,
    kicker: "Lastmanagement",
    headline: "Intelligentes Lastmanagement statt Netzanschluss-Chaos.",
    subline:
      "ChargeMieter steuert Ladepunkte so, dass verfügbare Leistung effizient genutzt wird. So kann Ladeinfrastruktur schrittweise wachsen, ohne den Betrieb zu überlasten.",
    align: "right",
    overlay: "loadbalance",
  },

  // ───────────────────────────────────────────────── 7 · ABRECHNUNG
  {
    id: "abrechnung",
    index: 7,
    heightVh: 190,
    hold: 0.76,
    kicker: "Abrechnung",
    headline: "Jeder Ladevorgang wird sauber erfasst und abrechenbar.",
    subline:
      "ChargeMieter dokumentiert Ladevorgänge nutzerbezogen und schafft die Grundlage für transparente Abrechnung gegenüber Mietern, Eigentümern oder Nutzern.",
    align: "left",
    overlay: "billing",
  },

  // ───────────────────────────────────────────────── 8 · FÖRDERUNG
  {
    id: "foerderung",
    index: 8,
    heightVh: 185,
    hold: 0.74,
    kicker: "Förderung",
    headline: "Förderung für Ladeinfrastruktur im Mehrfamilienhaus prüfen.",
    subline:
      "ChargeMieter unterstützt bei der ersten Einordnung möglicher Förderprogramme — abhängig von Programm, Objekt und Zeitpunkt — und bereitet Planung, Ladepunkte und Umsetzung professionell vor.",
    align: "right",
    overlay: "funding",
    cta: [
      {
        label: "Kostenfreie Förderberatung starten",
        href: CM_CTA.foerderung.href,
        variant: "primary",
      },
    ],
  },

  // ───────────────────────────────────────────────── 9 · ABLAUF
  {
    id: "ablauf",
    index: 9,
    heightVh: 210,
    hold: 0.78,
    kicker: "Der Weg",
    headline: "Von der Anfrage bis zum laufenden Betrieb.",
    subline:
      "ChargeMieter führt Ihr Ladeprojekt Schritt für Schritt: prüfen, planen, freigeben, installieren, betreiben und abrechnen.",
    align: "center",
    overlay: "journey",
  },

  // ───────────────────────────────────────────────── 10 · PLATTFORM
  {
    id: "plattform",
    index: 10,
    heightVh: 195,
    hold: 0.78,
    kicker: "Das System",
    headline: "Ein System für Ladepunkte, Nutzer und Abrechnung.",
    subline:
      "ChargeMieter bündelt alle relevanten Informationen: Ladepunkte, Nutzer, Stellplätze, Ladevorgänge, Tarife, Lastmanagement und Abrechnungsstatus.",
    align: "center",
    overlay: "dashboard",
    cta: [{ ...CM_CTA.demo, variant: "secondary" }],
  },

  // ───────────────────────────────────────────────── 11 · FINAL CTA
  {
    id: "cta",
    index: 11,
    heightVh: 165,
    hold: 0.84,
    kicker: "ChargeMieter",
    headline:
      "Ladeinfrastruktur im Mehrfamilienhaus — endlich sauber organisiert.",
    subline:
      "Mit ChargeMieter planen, steuern und rechnen Sie Wallboxen im Mehrfamilienhaus digital ab. Für Eigentümer, WEGs, Verwaltungen und Mieter.",
    align: "center",
    overlay: "none",
    cta: [
      { ...CM_CTA.foerderung, variant: "primary" },
      { ...CM_CTA.planung, variant: "secondary" },
    ],
  },
];

export const CM_NUM_SCENES = CM_SCENES.length;

/** Support line under the final CTA. */
export const CM_CTA_SUPPORT =
  "Für WEGs, Hausverwaltungen, Eigentümer und Wohnungsunternehmen.";

/* ────────────────────────────────────────────── overlay content blocks */

/** Szene 1 — Komplexitäts-Labels (chaotisch → geordnet). */
export const CM_COMPLEXITY_LABELS = [
  "Stellplatz-Zuordnung",
  "WEG-Freigabe",
  "Netzanschluss",
  "Lastmanagement",
  "Nutzerverwaltung",
  "Ladevorgänge",
  "Abrechnung",
  "Förderung",
];

/** Szene 2 — Leistungsbausteine der Komplettlösung. */
export const CM_BENEFITS = [
  "Planung & Auslegung",
  "Förderprüfung",
  "Wallbox-Verwaltung",
  "Nutzerzuordnung",
  "Lastmanagement",
  "Abrechnung",
  "Betrieb & Support",
];

/** Szene 3 — Eigentümer/WEG-Karten. */
export const CM_OWNER_CARDS = [
  "Gebäudewert stärken",
  "E-Mobilität im Bestand ermöglichen",
  "Förderung prüfen",
  "Planungssicherheit schaffen",
  "Ausbau in Etappen ermöglichen",
  "Betrieb sauber organisieren",
];

/** Szene 4 — Verwaltungs-Widgets (glaubwürdige Zustände, keine Fantasiezahlen). */
export const CM_ADMIN_WIDGETS: {
  label: string;
  value: string;
  state?: "ok" | "info" | "warn";
}[] = [
  { label: "Aktive Ladepunkte", value: "12 / 14", state: "ok" },
  { label: "Zugeordnete Nutzer", value: "14", state: "ok" },
  { label: "Ladevorgänge heute", value: "9", state: "info" },
  { label: "Abrechnungsstatus", value: "Vorbereitet", state: "ok" },
  { label: "Offene Freigaben", value: "2", state: "warn" },
  { label: "Supportfälle", value: "0", state: "ok" },
  { label: "Lastmanagement", value: "Aktiv", state: "ok" },
];

/** Szene 5 — Mieter-Ladekarte + Vorteile. */
export const CM_SESSION_CARD = {
  title: "Ladevorgang gestartet",
  rows: [
    { label: "Ladepunkt", value: "Stellplatz 14" },
    { label: "Nutzer", value: "Wohnung 3.2" },
    { label: "Status", value: "aktiv" },
  ],
};

export const CM_TENANT_BENEFITS = [
  "Laden am eigenen Stellplatz",
  "Ladevorgänge transparent",
  "Nutzer klar zugeordnet",
  "Abrechnung nachvollziehbar",
  "Komfort im Alltag",
];

/** Szene 6 — Lastmanagement-Begriffe. */
export const CM_LOAD_LABELS = [
  "Verfügbare Leistung",
  "Priorisierung",
  "Ladepunkte",
  "Gebäudelast",
  "Netzanschluss",
  "Dynamische Verteilung",
];

/** Szene 7 — Abrechnungsfelder (Ladevorgang → abrechnungsfähiger Datensatz). */
export const CM_BILLING_FIELDS = [
  { label: "Ladevorgang", value: "#2041" },
  { label: "Nutzer", value: "Wohnung 3.2" },
  { label: "Ladepunkt", value: "Stellplatz 14" },
  { label: "kWh", value: "18,4" },
  { label: "Zeitraum", value: "22:10 – 06:30" },
  { label: "Tarif", value: "Haustarif" },
  { label: "Abrechnungsstatus", value: "Bereit" },
];

/** Szene 8 — Förder-Checkliste. */
export const CM_FUNDING_STEPS = [
  "Objekt prüfen",
  "Anzahl Ladepunkte",
  "Netzanschluss einschätzen",
  "Förderfähigkeit einordnen",
  "Umsetzung vorbereiten",
];

/** Szene 9 — Projektschritte. */
export const CM_JOURNEY_STEPS = [
  "Objekt & Stellplätze prüfen",
  "Fördermöglichkeiten einordnen",
  "Ladekonzept erstellen",
  "Netzanschluss & Lastmanagement planen",
  "Wallboxen umsetzen",
  "Nutzer zuordnen",
  "Ladevorgänge abrechnen",
  "Betrieb laufend überwachen",
];

/** Szene 10 — Plattform-Widgets. */
export const CM_DASHBOARD_WIDGETS: {
  label: string;
  value: string;
  bar?: number;
}[] = [
  { label: "Ladepunkte gesamt", value: "14" },
  { label: "Aktive Ladevorgänge", value: "5" },
  { label: "Auslastung", value: "62 %", bar: 0.62 },
  { label: "Lastmanagement", value: "Aktiv" },
  { label: "Nutzerzuordnung", value: "14 / 14", bar: 1 },
  { label: "Abrechnungsstatus", value: "Vorbereitet" },
  { label: "Förderstatus", value: "In Prüfung" },
  { label: "Support & Betrieb", value: "Stabil" },
];

/** Kapitel-Labels für die Fortschrittsleiste. */
export const CM_SCENE_LABELS: Record<string, string> = {
  hero: "Start",
  komplexitaet: "Ausgangslage",
  loesung: "Lösung",
  eigentuemer: "Eigentümer",
  verwaltung: "Verwaltung",
  mieter: "Mieter",
  lastmanagement: "Lastmanagement",
  abrechnung: "Abrechnung",
  foerderung: "Förderung",
  ablauf: "Ablauf",
  plattform: "System",
  cta: "Kontakt",
};

/* ────────────────────────────────────────────── media manifest */

/** Per-scene STILL (poster + reduced-motion + mobile fallback). */
export const CM_IMAGE: Record<string, string> = {
  hero: "/media/chargemieter/hero.jpg",
  garage: "/media/chargemieter/garage.jpg",
  plug: "/media/chargemieter/plug.jpg",
  cta: "/media/chargemieter/cta.jpg",
  /** Bestands-Asset der Startseite (Wallbox-Reihe) als Sekundärszene. */
  row: "/media/stills/chargemieter.jpg",
};

/** Per-scene CLIP (silent, scrub-optimiert mit dichten Keyframes). */
export const CM_VIDEO: Record<string, string | undefined> = {
  plug: "/media/chargemieter/plug.mp4",
  garage: "/media/chargemieter/garage.mp4",
  cta: "/media/chargemieter/cta.mp4",
};

/** Hero-Scrub-Sequenz (Auto → Wallbox), extrahiert aus dem Hero-Clip. */
export const CM_HERO_FRAMES = {
  pattern: "/media/chargemieter/hero-frames/frame_%03d.jpg",
  count: 97,
  width: 1600,
  height: 900,
};

export function cmHeroFramePath(i: number): string {
  return CM_HERO_FRAMES.pattern.replace(
    "%03d",
    String(Math.max(1, Math.min(CM_HERO_FRAMES.count, i))).padStart(3, "0")
  );
}

/**
 * Welche Media-Ebene liegt hinter welcher Szene — und wie stark die Karte
 * (ChargeMap) sie überlagert. mediaDim 0 = Bild voll sichtbar, 1 = Karte trägt
 * die Szene allein.
 */
export const CM_SCENE_STAGE: Record<
  string,
  { media?: keyof typeof CM_IMAGE; mediaDim: number; map: number }
> = {
  hero: { media: "hero", mediaDim: 0, map: 0.16 },
  komplexitaet: { media: "hero", mediaDim: 0.82, map: 1 },
  loesung: { media: "row", mediaDim: 0.72, map: 1 },
  eigentuemer: { media: "hero", mediaDim: 0.62, map: 0.95 },
  verwaltung: { media: "row", mediaDim: 0.66, map: 0.35 },
  mieter: { media: "plug", mediaDim: 0.08, map: 0.12 },
  lastmanagement: { media: "garage", mediaDim: 0.14, map: 0.2 },
  abrechnung: { media: "garage", mediaDim: 0.7, map: 0.55 },
  foerderung: { media: "hero", mediaDim: 0.68, map: 0.95 },
  ablauf: { media: "hero", mediaDim: 0.76, map: 1 },
  plattform: { media: "cta", mediaDim: 0.55, map: 0.3 },
  cta: { media: "cta", mediaDim: 0.06, map: 0.18 },
};
