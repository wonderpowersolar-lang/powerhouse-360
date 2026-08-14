/**
 * Powermieter — single source of truth für die /powermieter-Journey.
 *
 * EDIT COPY HERE. Deutsch, ruhig, präzise, Premium. Erzählachse:
 * »Betrieb komplett abgenommen« — Eigentümer-Nutzen zuerst, der Pilot
 * (WEG Christinenstraße) als dokumentarischer Beweis-Höhepunkt.
 *
 * Wording constraints (bewusst, siehe Masterplan §-Offenposten):
 *  - KEINE Preis- oder Rendite-Zahlen, keine Ertragsversprechen.
 *  - KEINE §-42a-/EEG-Zusagen — Regulatorik ist »zu verifizieren«;
 *    Formulierungen bleiben bei »strukturieren«, »vorbereiten«, »digital«.
 *  - Abrechnung: »abrechnungsfähig strukturiert«, nie Eichrechts-Zusagen.
 *  - Referenzen: NUR der Pilot ist echt und nennbar — nichts dazuerfinden.
 */

export type PmOverlay =
  | "none"
  | "complexity"
  | "benefits"
  | "owner"
  | "adminboard"
  | "resident"
  | "pilot";

export interface PmScene {
  id: string;
  index: number;
  kicker: string;
  headline: string;
  /** optionale zweite Headline-Zeile im Modul-Akzent (die Schlüsselzeile) */
  headlineAccent?: string;
  subline: string;
  align: "left" | "right" | "center";
  overlay: PmOverlay;
  cta?: { label: string; href: string; variant: "primary" | "secondary" | "gradient" }[];
}

/* CTAs — führen in den bestehenden Projekt-Funnel (Brief-Entscheidung:
   kein eigener Powermieter-Funnel). */
export const PM_CTA = {
  projekt: {
    label: "Mieterstrom-Projekt besprechen",
    href: "/projekt-besprechen?modul=powermieter",
  },
  pilot: {
    label: "Referenzprojekt ansehen",
    href: "#pilot",
  },
} as const;

export const PM_SCENES: PmScene[] = [
  // ───────────────────────────────────────────────── 0 · HERO
  {
    id: "hero",
    index: 0,
    kicker: "Powerhouse 360 · Modul 01",
    headline: "Powermieter",
    headlineAccent: "Mieterstrom. Komplett betrieben.",
    subline:
      "Solarstrom vom eigenen Dach für die Bewohner — und für Eigentümer ein Projekt, das wir vollständig übernehmen: PV und Speicher, Messkonzept, Verträge, Betrieb und Abrechnung.",
    align: "left",
    overlay: "none",
    cta: [
      { ...PM_CTA.projekt, variant: "primary" },
      { ...PM_CTA.pilot, variant: "secondary" },
    ],
  },

  // ───────────────────────────────────────────────── 1 · PROBLEM
  {
    id: "komplexitaet",
    index: 1,
    kicker: "Die Ausgangslage",
    headline: "Eine PV-Anlage ist schnell geplant.",
    headlineAccent: "Mieterstrom ist ein Betrieb.",
    subline:
      "Zwischen Dach und Stromrechnung liegen Messkonzept, Zählerwechsel, Teilnehmerverwaltung, Verträge und Abrechnung — Aufgaben, die im Mehrfamilienhaus niemand nebenbei führt. Genau diesen Betrieb übernimmt Powermieter.",
    align: "left",
    overlay: "complexity",
  },

  // ───────────────────────────────────────────────── 2 · LÖSUNG
  {
    id: "loesung",
    index: 2,
    kicker: "Die Komplettlösung",
    headline: "Powermieter übernimmt das Mieterstrom-Projekt — vollständig.",
    subline:
      "Von der Anlage bis zur Abrechnung arbeitet alles in einem System: Erzeugung, Speicher, Messstellen, Tarife, Verträge und Bewohner — ohne dass Stammdaten doppelt erfasst werden.",
    align: "right",
    overlay: "benefits",
  },

  // ───────────────────────────────────────────────── 3 · EIGENTÜMER & WEG
  {
    id: "eigentuemer",
    index: 3,
    kicker: "Für Eigentümer & WEGs",
    headline: "Ihr Gebäude liefert Strom.",
    headlineAccent: "Ohne dass Sie einen Betrieb führen.",
    subline:
      "Powermieter macht aus dem Dach einen geordneten Mehrwert: Das Gebäude wird attraktiver für Bewohner, die Struktur bleibt planbar — und der laufende Aufwand liegt bei uns, nicht bei Ihnen.",
    align: "left",
    overlay: "owner",
  },

  // ───────────────────────────────────────────────── 4 · BETRIEB & VERWALTUNG
  {
    id: "betrieb",
    index: 4,
    kicker: "Der laufende Betrieb",
    headline: "Messstellen, Teilnehmer, Abrechnung — geführt in einem System.",
    subline:
      "Jede Messstelle, jeder Teilnehmerstatus und jede Abrechnungsperiode ist digital erfasst. Hausverwaltungen sehen Zustände statt Zettel — und Rückfragen werden seltener.",
    align: "right",
    overlay: "adminboard",
  },

  // ───────────────────────────────────────────────── 5 · BEWOHNER
  {
    id: "bewohner",
    index: 5,
    kicker: "Für Bewohner",
    headline: "Sonnenstrom vom eigenen Dach.",
    subline:
      "Bewohner beziehen Strom, der über ihnen erzeugt wird — mit dynamischem Sonnenstrompreis, digitalem Vertrag und transparenter Abrechnung. Verbrauch und Erzeugung bleiben jederzeit nachvollziehbar.",
    align: "left",
    overlay: "resident",
  },

  // ───────────────────────────────────────────────── 6 · PILOT / REFERENZ
  {
    id: "pilot",
    index: 6,
    kicker: "Referenzprojekt · Berlin",
    headline: "Kein Konzept. Ein Haus.",
    subline:
      "Powermieter wird am realen Objekt aufgebaut und verifiziert — mit Hausverwaltung, Messkonzept und Betriebsverantwortung. Dokumentiert, nicht versprochen.",
    align: "center",
    overlay: "pilot",
  },

  // ───────────────────────────────────────────────── 7 · FINAL CTA
  {
    id: "cta",
    index: 7,
    kicker: "Powermieter",
    headline: "Ihr Dach kann mehr als dicht sein.",
    subline:
      "Besprechen Sie Ihr Mieterstrom-Projekt mit uns — wir prüfen Objekt, Messkonzept und Umsetzbarkeit und übernehmen den Betrieb.",
    align: "center",
    overlay: "none",
    cta: [{ ...PM_CTA.projekt, variant: "gradient" }],
  },
];

export const PM_NUM_SCENES = PM_SCENES.length;

/** Support-Zeile unter dem finalen CTA. */
export const PM_CTA_SUPPORT =
  "Für WEGs, Hausverwaltungen, Eigentümer und Wohnungsunternehmen.";

/* ────────────────────────────────────────────── overlay content blocks */

/** Szene 1 — was Mieterstrom im Alltag bedeutet (chaotisch → geordnet). */
export const PM_COMPLEXITY_LABELS = [
  "Messkonzept",
  "Zählerwechsel",
  "Teilnehmerverwaltung",
  "Stromverträge",
  "SEPA-Mandate",
  "Tarifpflege",
  "Energiezuordnung",
  "Abrechnung",
];

/** Szene 2 — Leistungsbausteine der Komplettlösung. */
export const PM_BENEFITS = [
  "PV-Anlage & Speicher",
  "Messkonzept & Zähler",
  "Teilnehmer & Verträge",
  "Dynamischer Sonnenstrompreis",
  "Energiezuordnung",
  "Abrechnung & Service",
];

/** Szene 3 — Eigentümer/WEG-Karten (Struktur, keine Renditezahlen). */
export const PM_OWNER_CARDS = [
  "Gebäude aufwerten",
  "Bewohner binden",
  "Kein eigener Betriebsaufwand",
  "Planbare Struktur statt Einzelgewerke",
  "Digital dokumentiert",
  "Betrieb in Verantwortung von Powerhouse 360",
];

/** Szene 4 — Betriebs-Widgets (glaubwürdige Zustände, konsistent mit dem
 *  Pilotumfang von 21 Messstellen — keine Fantasiezahlen). */
export const PM_ADMIN_WIDGETS: {
  label: string;
  value: string;
  state?: "ok" | "info" | "warn";
}[] = [
  { label: "Messstellen aktiv", value: "21 / 21", state: "ok" },
  { label: "Teilnehmer aktiv", value: "18", state: "ok" },
  { label: "Verträge signiert", value: "18", state: "ok" },
  { label: "Zählerwechsel geplant", value: "2", state: "info" },
  { label: "Abrechnungsperiode", value: "Vorbereitet", state: "ok" },
  { label: "Offene Vorgänge", value: "1", state: "warn" },
];

/** Szene 5 — Bewohner-Karte (Sonnenstrom-Moment) + Vorteile. */
export const PM_RESIDENT_CARD = {
  title: "Sonnenstrom aktiv",
  rows: [
    { label: "Tarif", value: "Dynamischer Sonnenstrompreis" },
    { label: "Erzeugung jetzt", value: "PV + Speicher" },
    { label: "Vertrag", value: "Digital signiert" },
  ],
};

export const PM_RESIDENT_BENEFITS = [
  "Strom vom eigenen Dach",
  "Dynamischer Sonnenstrompreis",
  "Digitaler Vertragsabschluss",
  "Verbrauch transparent",
  "Abrechnung nachvollziehbar",
];

/** Szene 6 — Pilot-Fakten (ECHT — einzige Referenz, nichts erfinden). */
export const PM_PILOT = {
  name: "WEG Christinenstraße 36 / Lottumstraße 22",
  ort: "Berlin Prenzlauer Berg",
  facts: [
    { label: "Objekt", value: "WEG Christinenstraße 36 / Lottumstraße 22, Berlin" },
    { label: "Hausverwaltung", value: "Hennings" },
    { label: "Messstellen", value: "21" },
    { label: "Betriebskonzept", value: "AKL Powerhouse 360" },
  ],
  note: "Pilotprojekt im Aufbau — hier entsteht der Mieterstrom-Betrieb, den Powermieter danach in weitere Objekte trägt.",
};

/** Kapitel-Labels für die Fortschrittsanzeige. */
export const PM_SCENE_LABELS: Record<string, string> = {
  hero: "Start",
  komplexitaet: "Ausgangslage",
  loesung: "Lösung",
  eigentuemer: "Eigentümer",
  betrieb: "Betrieb",
  bewohner: "Bewohner",
  pilot: "Referenz",
  cta: "Kontakt",
};

/* ────────────────────────────────────────────── media manifest
 * Vorhandene Assets (config/stage.ts nutzt dieselben auf der Startseite).
 * Weitere Powermieter-Fotografie kann hier später ergänzt werden. */

export const PM_IMAGE = {
  hero: "/media/stills/powermieter.jpg",
} as const;

export const PM_VIDEO = {
  hero: "/media/clips/powermieter.mp4",
} as const;
