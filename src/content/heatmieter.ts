/**
 * HeatMieter — single source of truth für die /heatmieter-Seite.
 *
 * HYBRID-AUFBAU: klassischer Hero → Scroll-Story (ein Runway, 3 Phasen:
 * winter1 → wechsel → winter2) → 8 klassische Sachsektionen → Final-CTA.
 *
 * Wording constraints (bewusst, aus dem Spec):
 *  - Keine erfundenen Statistiken, keine €-Beträge, keine %-Ersparnisse.
 *    Die Story erzählt EIN Haus und ZWEI konkrete Winter.
 *  - »Falsche Abrechnung« nur als erlebte Situation dieses Hauses
 *    (Schätzwerte, Ablesung nicht erfolgt, Widerspruch) — keine
 *    Pauschalaussage über Messdienste.
 *  - Einsparpotenziale »sichtbar machen / erkennen« — keine Spargarantie.
 *  - Recht: »die Details regelt die Heizkostenverordnung« — keine
 *    Rechtsberatung. Zulässige Fakten: verbrauchsabhängige Abrechnung ist
 *    Pflicht; monatliche Verbrauchsinfo bei fernablesbaren Geräten;
 *    Nachrüstfrist Fernablesbarkeit Ende 2026.
 *  - Abrechnung »transparent, nachvollziehbar, vorbereitet«; CO₂-
 *    Kostenaufteilung »datenseitig abgebildet« / »Grundlage schaffen«.
 *  - Kein Bewohner-Blaming im Ausreißer-Beat (Muster, nicht Personen).
 */

/* ────────────────────────────────────────────── CTAs */

export const HM_CTA = {
  heizkostencheck: {
    label: "Kostenfreien Heizkosten-Check starten",
    href: "/projekt-besprechen?modul=heatmieter&thema=heizkostencheck",
  },
  planung: {
    label: "Wärme-Konzept planen",
    href: "/projekt-besprechen?modul=heatmieter&thema=planung",
  },
  demo: { label: "System ansehen", href: "/demo" },
} as const;

/* ────────────────────────────────────────────── Hero (Akt 1) */

export const HM_HERO = {
  kicker: "Powerhouse 360 · Modul 02",
  headline: "HeatMieter",
  headlineAccent:
    "Heizkosten im Mehrfamilienhaus — erfasst, transparent und nachvollziehbar abgerechnet.",
  subline:
    "HeatMieter macht Wärme betreibbar: fernablesbare Erfassung, Monatswerte je Wohnung, erkannte Einsparpotenziale und eine Heizkostenabrechnung, die sich selbst erklärt — für Eigentümer, WEGs und Hausverwaltungen.",
  scrollHint: "Zwei Winter, zwei Abrechnungen — scrollen Sie.",
  cta: [
    { ...HM_CTA.heizkostencheck, variant: "primary" as const },
    { ...HM_CTA.planung, variant: "secondary" as const },
  ],
};

/* ────────────────────────────────────────────── Story (Akt 2) */

/** Monats-Ticker der Heizperiode (läuft in Winter 1 und Winter 2). */
export const HM_MONTHS = ["OKT", "NOV", "DEZ", "JAN", "FEB", "MÄR"] as const;

/** Phasen-Grenzen im Story-Progress [0..1]. */
export const HM_PHASES = {
  winter1End: 0.35,
  wechselEnd: 0.5,
} as const;

export const HM_STORY = {
  winter1: {
    kicker: "Winter 1 · Ein Mehrfamilienhaus",
    headline: "Es heizt. Und niemand sieht es.",
    lines: [
      "Die Heizperiode beginnt. Das Haus verbraucht — unsichtbar.",
      "Der tiefste Winter: hohe Kosten, die niemand sieht.",
      "Monate später kommt der Brief.",
    ],
  },
  wechsel: {
    kicker: "Der Wechsel",
    headline: "Dann übernimmt HeatMieter.",
    subline:
      "Funk-Zähler statt Ableseliste: Monatswerte je Wohnung, Live-Status für Anlage und Verbrauch — die Wärme bekommt Daten.",
  },
  winter2: {
    kicker: "Winter 2 · Dasselbe Haus",
    headline: "Derselbe Winter. Diesmal sichtbar.",
    resolveHeadline: "Die Abrechnung erklärt sich selbst.",
    resolveSubline:
      "Zwischen diesen zwei Wintern liegt keine neue Heizung — sondern Sichtbarkeit. Genau dafür gibt es HeatMieter.",
  },
} as const;

/** Winter-2-Beats — Zeitfenster in Phase-C-Fortschritt [0..1]. */
export interface HmBeat {
  month: string;
  text: string;
  /** Fensterstart im Phase-C-Progress (Karte erscheint ab hier). */
  at: number;
}

export const HM_BEATS: HmBeat[] = [
  {
    month: "OKT",
    text: "Die Heizperiode beginnt — diesmal sichtbar. Monatswerte je Wohnung.",
    at: 0.08,
  },
  {
    month: "DEZ",
    text: "Ein Muster fällt auf, das vorher niemand sehen konnte. Einsparpotenzial erkannt.",
    at: 0.28,
  },
  {
    month: "JAN",
    text: "Bewohner sehen ihren Verbrauch — und heizen bewusster.",
    at: 0.44,
  },
  {
    month: "MÄR",
    text: "Die Heizperiode endet. Die Abrechnung ist vorbereitet.",
    at: 0.6,
  },
];

/** Ab diesem Phase-C-Progress blendet die Abrechnungs-Auflösung ein. */
export const HM_RESOLVE_AT = 0.78;

/** Abrechnungs-Karte 1 — die blinde Abrechnung (Klimax Winter 1). */
export const HM_BILL_BLIND = {
  title: "Heizkostenabrechnung",
  subtitle: "Winter 1",
  rows: [
    { label: "Verbrauch Wohnung 3.2", value: "geschätzt" },
    { label: "Ablesung", value: "nicht erfolgt" },
    { label: "Positionen", value: "nicht nachvollziehbar" },
    { label: "Rückfragen", value: "offen" },
  ],
  stamp: "Widerspruch",
} as const;

/** Abrechnungs-Karte 2 — die transparente Abrechnung (Payoff Winter 2). */
export const HM_BILL_CLEAR = {
  title: "Heizkostenabrechnung",
  subtitle: "Winter 2 · mit HeatMieter",
  rows: [
    { label: "Verbrauch Wohnung 3.2", value: "gemessen, je Monat" },
    { label: "Ablesung", value: "fernablesbar, ohne Termin" },
    { label: "CO₂-Kostenaufteilung", value: "abgebildet" },
    { label: "Rückfragen", value: "keine" },
  ],
  badge: "Vollständig",
} as const;

/** Datenlayer Winter 2 — Einheiten-Chips (glaubwürdige Zustände, neutral). */
export const HM_DATA_UNITS: {
  label: string;
  state: "ok" | "info";
}[] = [
  { label: "WE 1.1", state: "ok" },
  { label: "WE 1.2", state: "ok" },
  { label: "WE 2.1", state: "ok" },
  { label: "WE 2.2", state: "info" },
  { label: "WE 3.1", state: "ok" },
  { label: "WE 3.2", state: "ok" },
];

/* ────────────────────────────────────────────── Sachsektionen (Akt 3) */

export interface HmSection {
  id: string;
  kicker: string;
  headline: string;
  subline: string;
  points?: string[];
  /** optionales Medium (Key aus HM_IMAGE) */
  media?: keyof typeof HM_IMAGE;
  /** optionaler Loop-Clip (Key aus HM_VIDEO) */
  video?: keyof typeof HM_VIDEO;
  cta?: { label: string; href: string; variant: "primary" | "secondary" }[];
}

export const HM_SECTIONS: HmSection[] = [
  {
    id: "pflicht",
    kicker: "Pflicht & Fristen",
    headline: "Pflicht ist der Rahmen. Transparenz ist der Standard.",
    subline:
      "Die verbrauchsabhängige Heizkostenabrechnung ist Pflicht — die Details regelt die Heizkostenverordnung: fernablesbare Erfassung, monatliche Verbrauchsinformation und die Nachrüstung von Bestandsgeräten bis Ende 2026. HeatMieter macht daraus einen dokumentierten Zustand.",
    points: [
      "Erfassung je Wohnung und Einheit",
      "Monatswerte statt Jahresrätsel",
      "Nachweise für die Akte",
    ],
  },
  {
    id: "erfassung",
    kicker: "Erfassung & Live-Daten",
    headline: "Gemessen, ohne zu klingeln.",
    subline:
      "Fernablesbare Funk-Zähler und Heizkostenverteiler liefern Monatswerte je Wohnung — ohne Ablesetermin, ohne Wohnungszutritt. Auch die Anlage wird sichtbar: Wärmepumpe, Vor- und Rücklauf, Warmwasser.",
    points: [
      "Monatswerte je Wohnung",
      "Anlagen-Status live",
      "Keine Ablesetermine",
    ],
    media: "anlage",
    video: "anlage",
  },
  {
    id: "verwaltung",
    kicker: "Für Hausverwaltungen",
    headline: "Weniger Rückfragen. Klare Antworten. Eine Abrechnung.",
    subline:
      "HeatMieter strukturiert Wärme digital: Einheiten, Verbräuche, Anlagendaten und Abrechnungsstatus in einer Ansicht — Widersprüche werden mit Daten beantwortet statt mit Aktenordnern.",
    points: [
      "Rückfragen mit Daten beantworten",
      "Digitaler Bestand statt Ableselisten",
      "Abrechnung vorbereitet statt improvisiert",
    ],
  },
  {
    id: "bewohner",
    kicker: "Für Bewohner",
    headline: "Wärme, die man versteht.",
    subline:
      "Monatliche Verbrauchsinformation statt Jahresüberraschung: Bewohner sehen ihren Verbrauch, verstehen ihre Abrechnung — und können bewusster heizen.",
    points: [
      "Monatliche Verbrauchsinfo",
      "Keine Ablesetermine",
      "Nachvollziehbare Abrechnung",
    ],
  },
  {
    id: "einsparen",
    kicker: "Einsparpotenziale",
    headline: "Was sichtbar ist, lässt sich optimieren.",
    subline:
      "Ausreißer und Muster werden erkennbar — im Verbrauch wie an der Anlage. HeatMieter macht Einsparpotenziale sichtbar und hilft, Optimierung anzustoßen.",
    points: [
      "Verbrauchsmuster je Einheit",
      "Anlagen-Kennwerte im Blick",
      "Potenziale dokumentiert",
    ],
    media: "pump",
  },
  {
    id: "abrechnung",
    kicker: "Abrechnung & CO₂",
    headline: "Jede Position hat eine Geschichte.",
    subline:
      "Die Heizkostenabrechnung wird transparent und nachvollziehbar vorbereitet — inklusive der CO₂-Kostenaufteilung zwischen Vermietern und Mietern, datenseitig sauber abgebildet.",
    points: [
      "Positionen nachvollziehbar",
      "CO₂-Kostenaufteilung abgebildet",
      "Grundlage für die Betriebskostenabrechnung",
    ],
  },
  {
    id: "ablauf",
    kicker: "Der Weg",
    headline: "Vom Bestand zur Abrechnung, die sich selbst erklärt.",
    subline:
      "HeatMieter führt Ihr Objekt Schritt für Schritt in den transparenten Betrieb.",
    points: [
      "Bestand aufnehmen",
      "Zähler-Konzept festlegen",
      "Montage & Anbindung",
      "Live-Betrieb aktivieren",
      "Verbrauchsinfo bereitstellen",
      "Abrechnung vorbereiten",
    ],
  },
  {
    id: "plattform",
    kicker: "Das System",
    headline: "Ein Dashboard für Wärme, Einheiten und Abrechnung.",
    subline:
      "HeatMieter ist Teil von Powerhouse 360: Verbräuche, Anlage, Ereignisse und Abrechnungsstatus laufen in einer Ansicht zusammen.",
    cta: [{ ...HM_CTA.demo, variant: "secondary" }],
  },
];

/** Verwaltungs-Widgets (glaubwürdige Zustände — 14 Wohnungen). */
export const HM_ADMIN_WIDGETS: {
  label: string;
  value: string;
  state?: "ok" | "info" | "warn";
}[] = [
  { label: "Einheiten erfasst", value: "14", state: "ok" },
  { label: "Fernablesung", value: "Aktiv", state: "ok" },
  { label: "Monatswerte", value: "Vollständig", state: "ok" },
  { label: "Offene Rückfragen", value: "0", state: "ok" },
  { label: "Abrechnung", value: "Vorbereitet", state: "info" },
];

/* ────────────────────────────────────────────── Final-CTA (Akt 4) */

export const HM_FINAL = {
  kicker: "HeatMieter",
  headline: "Ihr zweiter Winter beginnt mit einem Gespräch.",
  subline:
    "Mit HeatMieter wird Wärme zum transparenten Zustand: gemessen, verständlich, abrechnungsfähig strukturiert — und Einsparpotenziale werden sichtbar.",
  support: "Für Eigentümer, WEGs, Hausverwaltungen und Wohnungsunternehmen.",
  cta: [
    { ...HM_CTA.heizkostencheck, variant: "primary" as const },
    { ...HM_CTA.planung, variant: "secondary" as const },
  ],
};

/* ────────────────────────────────────────────── Media-Manifest */

export const HM_IMAGE = {
  winter: "/media/heatmieter/winter.jpg",
  pump: "/media/heatmieter/pump.jpg",
  thaw: "/media/heatmieter/thaw.jpg",
  /** Bestands-Assets der Startseite */
  anlage: "/media/stills/heatmieter.jpg",
} as const;

export const HM_VIDEO = {
  anlage: "/media/clips/heatmieter.mp4",
} as const;

/** Winter-Scrub-Sequenz — count/height nach Task 2 mit Ist-Werten füllen. */
export const HM_STORY_FRAMES = {
  pattern: "/media/heatmieter/story-frames/frame_%03d.jpg",
  count: 96,
  width: 1600,
  height: 900,
};

export function hmStoryFramePath(i: number): string {
  return HM_STORY_FRAMES.pattern.replace(
    "%03d",
    String(Math.max(1, Math.min(HM_STORY_FRAMES.count, i))).padStart(3, "0")
  );
}
