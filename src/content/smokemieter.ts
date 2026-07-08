/**
 * SmokeMieter — single source of truth für die /smokemieter-Seite.
 *
 * HYBRID-AUFBAU: klassischer Hero → Scroll-Story (ein Runway, 3 Phasen:
 * burn → rewind → rescue) → 8 klassische Sachsektionen → Final-CTA.
 *
 * Wording constraints (bewusst, aus dem Spec):
 *  - Recht: Pflicht ja, Details »regeln die Landesbauordnungen« — keine
 *    landesspezifischen Fristen, keine Rechtsberatung.
 *  - Ferninspektion: »je nach Gerätetyp«, »orientiert an DIN 14676« —
 *    keine Zertifizierungszusagen.
 *  - Abrechnung: »Grundlage schaffen«, keine Umlage-Garantie.
 *  - Ereignisse: »gemeldet und kommuniziert«, keine Notruf-Aufschaltung.
 *  - Story erzählt EINE konkrete Nacht — keine Statistik-Claims. Fakten:
 *    85 dB (DIN EN 14604), »Im Schlaf riecht der Mensch nichts«,
 *    Gerätetausch spätestens nach 10 Jahren.
 */

/* ────────────────────────────────────────────── CTAs */

export const SM_CTA = {
  bestandscheck: {
    label: "Kostenfreien Bestandscheck starten",
    href: "/projekt-besprechen?modul=smokemieter&thema=bestandscheck",
  },
  planung: {
    label: "Melder-Konzept planen",
    href: "/projekt-besprechen?modul=smokemieter&thema=planung",
  },
  demo: { label: "System ansehen", href: "/demo" },
} as const;

/* ────────────────────────────────────────────── Hero (Akt 1) */

export const SM_HERO = {
  kicker: "Powerhouse 360 · Modul 04",
  headline: "SmokeMieter",
  headlineAccent:
    "Rauchwarnmelder im Mehrfamilienhaus — montiert, ferngeprüft und lückenlos dokumentiert.",
  subline:
    "SmokeMieter plant, montiert und wartet Rauchwarnmelder nach DIN 14676 — mit Geräten nach DIN EN 14604. Für die Sicherheit aller Bewohner Ihrer Immobilie, mit Ferninspektion, Ereigniskommunikation und einer Dokumentation, die jeder Prüfung standhält.",
  scrollHint: "Eine Nacht, zwei Ausgänge — scrollen Sie.",
  cta: [
    { ...SM_CTA.bestandscheck, variant: "primary" as const },
    { ...SM_CTA.planung, variant: "secondary" as const },
  ],
};

/* ────────────────────────────────────────────── Story (Akt 2) */

/** Uhr-Eckwerte der Story-Nacht. */
export const SM_CLOCK = { startMin: 12, peakMin: 19, hour: 3 };

/** Phasen-Grenzen im Story-Progress [0..1]. */
export const SM_PHASES = {
  burnEnd: 0.3,
  rewindEnd: 0.55,
} as const;

export const SM_STORY = {
  burn: {
    kicker: "Wohnung 3.2 · Ohne Melder",
    headline: "Es beginnt lautlos.",
    lines: [
      "Ein Schwelbrand. Kein Feuerschein, noch nicht — nur Rauch.",
      "Im Schlaf riecht der Mensch nichts.",
      "Niemand wacht auf.",
    ],
  },
  rewind: {
    kicker: "Zurück",
    headline: "Drehen wir diese Nacht zurück.",
    subline:
      "Zurück zu dem Moment, in dem noch nichts passiert ist. Und geben dem Haus, was gefehlt hat: einen Melder, der wacht.",
  },
  rescue: {
    kicker: "Dieselbe Nacht · Mit Melder",
    headline: "Diesmal wacht jemand.",
    resolveHeadline:
      "Der Unterschied zwischen diesen zwei Nächten hängt an der Decke.",
    resolveSubline:
      "Ein Melder rettet nur, wenn er hängt, funktioniert und geprüft ist. Genau dafür gibt es SmokeMieter.",
    resolveClaim:
      "SmokeMieter — für die Sicherheit aller Bewohner Ihrer Immobilie.",
  },
} as const;

/** Push-Benachrichtigung (Phase C, über dem Telefon-Bild — echte DOM-Karte). */
export const SM_PUSH = {
  app: "SmokeMieter",
  time: "jetzt",
  title: "Alarm — Wohnung 3.2",
  body: "Rauchwarnmelder ausgelöst. Ereignis wird dokumentiert.",
} as const;

/** Rettungs-Beats (Phase C) — Zeitfenster in Phase-C-Fortschritt [0..1]. */
export interface SmBeat {
  clock: string;
  text: string;
  /** Fensterstart im Phase-C-Progress (Karte erscheint ab hier). */
  at: number;
}

export const SM_BEATS: SmBeat[] = [
  {
    clock: "03:12",
    text: "Der erste Rauch erreicht den Melder. Alarm: 85 dB.",
    at: 0.05,
  },
  {
    clock: "03:12",
    text: "Das Telefon meldet den Alarm — Wohnung 3.2.",
    at: 0.32,
  },
  { clock: "03:13", text: "Alle sind wach. Ein Anruf: 112.", at: 0.4 },
  {
    clock: "03:15",
    text: "Alle sicher draußen — in der Straße das erste Blaulicht.",
    at: 0.48,
  },
  { clock: "03:19", text: "Die Feuerwehr übernimmt.", at: 0.56 },
  {
    clock: "03:26",
    text: "Gelöscht. Der Brand bleibt eine Randnotiz.",
    at: 0.68,
  },
];

/** Ab diesem Phase-C-Progress blendet die Morgen-Auflösung ein. */
export const SM_RESOLVE_AT = 0.78;

/* ────────────────────────────────────────────── Media-Manifest */

export const SM_IMAGE = {
  burn: "/media/smokemieter/burn.jpg",
  alarm: "/media/smokemieter/alarm.jpg",
  phone: "/media/smokemieter/phone.jpg",
  firetruck: "/media/smokemieter/firetruck.jpg",
  family: "/media/smokemieter/family.jpg",
  dawn: "/media/smokemieter/dawn.jpg",
  night: "/media/smokemieter/night.jpg",
  /** Hero-Poster (Nacht, Melder im Standby) */
  heroNight: "/media/smokemieter/hero-night.jpg",
  /** Sektions-Motive (Akt 3) */
  flur: "/media/smokemieter/flur.jpg",
  objekt: "/media/smokemieter/objekt.jpg",
  produkt: "/media/smokemieter/produkt.jpg",
  wohnen: "/media/smokemieter/wohnen.jpg",
  geraet: "/media/smokemieter/geraet.jpg",
  /** Bestands-Assets der Startseite */
  detector: "/media/stills/smokemieter.jpg",
} as const;

export const SM_VIDEO = {
  detector: "/media/clips/smokemieter.mp4",
} as const;

/** Brand-Scrub-Sequenz — count/height nach dem Frame-Export verifiziert. */
export const SM_STORY_FRAMES = {
  pattern: "/media/smokemieter/story-frames/frame_%03d.jpg",
  count: 97,
  width: 1600,
  height: 900,
};

export function smStoryFramePath(i: number): string {
  return SM_STORY_FRAMES.pattern.replace(
    "%03d",
    String(Math.max(1, Math.min(SM_STORY_FRAMES.count, i))).padStart(3, "0")
  );
}

/** Hero-Scrub (Kamera steigt zum wachenden Melder — Stil ChargeMieter-Hero). */
export const SM_HERO_FRAMES = {
  pattern: "/media/smokemieter/hero-frames/frame_%03d.jpg",
  count: 97,
  width: 1600,
  height: 900,
};

export function smHeroFramePath(i: number): string {
  return SM_HERO_FRAMES.pattern.replace(
    "%03d",
    String(Math.max(1, Math.min(SM_HERO_FRAMES.count, i))).padStart(3, "0")
  );
}

/* ────────────────────────────────────────────── Sachsektionen (Akt 3) */

export interface SmSection {
  id: string;
  kicker: string;
  headline: string;
  subline: string;
  points?: string[];
  /** optionales Medium (Key aus SM_IMAGE) */
  media?: keyof typeof SM_IMAGE;
  /** optionaler Loop-Clip (Key aus SM_VIDEO) */
  video?: keyof typeof SM_VIDEO;
  cta?: { label: string; href: string; variant: "primary" | "secondary" }[];
}

export const SM_SECTIONS: SmSection[] = [
  {
    id: "pflicht",
    kicker: "Die Pflicht",
    headline: "Pflicht ist das Minimum. Nachweis ist der Standard.",
    subline:
      "Rauchwarnmelder sind in Deutschland Pflicht — die Details regeln die Landesbauordnungen. SmokeMieter plant, montiert und wartet nach DIN 14676 mit Geräten nach DIN EN 14604 und macht aus der Pflicht einen dokumentierten Zustand: Bestand, Prüfstatus und Nachweise, jederzeit abrufbar.",
    points: [
      "Bestand je Wohnung und Raum",
      "Prüfstatus auf einen Blick",
      "Nachweise für die Akte",
    ],
    media: "flur",
  },
  {
    id: "ferninspektion",
    kicker: "Ferninspektion & Live-Status",
    headline: "Geprüft, ohne zu klingeln.",
    subline:
      "Funk-Rauchwarnmelder werden je nach Gerätetyp aus der Ferne inspiziert — orientiert an DIN 14676, ohne Termin und ohne Wohnungszutritt. Der Status ist live sichtbar; Ereignisse wie Alarm, Demontage oder Störung werden erkannt und klar kommuniziert.",
    points: [
      "Inspektion ohne Wohnungszutritt",
      "Live-Status je Melder",
      "Alarm, Demontage und Störung gemeldet",
    ],
    media: "produkt",
  },
  {
    id: "verwaltung",
    kicker: "Für Hausverwaltungen",
    headline: "Weniger Termine. Weniger Rückfragen. Ein Protokoll.",
    subline:
      "SmokeMieter strukturiert den Melderbestand digital: Wohnungen, Räume, Geräte, Ereignisse und Prüfnachweise — statt Terminketten und Zettelwirtschaft.",
    points: [
      "Digitaler Bestand statt Excel-Liste",
      "Ereignisprotokoll je Objekt",
      "Dokumentation, die Prüfungen standhält",
    ],
    media: "objekt",
  },
  {
    id: "mieter",
    kicker: "Für Mieter",
    headline: "Sicherheit, die keine Termine braucht.",
    subline:
      "Kein Jahres-Termin, niemand Fremdes in der Wohnung: Bei Ferninspektion bleibt der Alltag ungestört. Und wenn etwas passiert, gibt es eine klare Information statt Rätselraten.",
    points: [
      "Kein Termin für die Sichtprüfung nötig",
      "Ungestörter Alltag",
      "Klare Information im Ereignisfall",
    ],
    media: "wohnen",
  },
  {
    id: "wartung",
    kicker: "Wartung & Austausch",
    headline: "Melder altern. Das System vergisst es nicht.",
    subline:
      "Montage, laufende Wartung nach DIN 14676 und der altersbedingte Gerätetausch — spätestens nach zehn Jahren — sind Teil des Modells. Jede Maßnahme landet in der Historie.",
    points: [
      "Montage durch Fachpartner",
      "Tausch rechtzeitig geplant",
      "Lückenlose Gerätehistorie",
    ],
    media: "geraet",
  },
  {
    id: "abrechnung",
    kicker: "Abrechnung",
    headline: "Miete statt Investition — sauber abgebildet.",
    subline:
      "Das Mietmodell schafft die Grundlage für eine betriebskostenfähige Abrechnung: klare Leistungen, klare Zeiträume, klare Belege.",
    points: [
      "Planbare monatliche Kosten",
      "Leistungen sauber dokumentiert",
      "Abrechnungsfähig strukturiert",
    ],
  },
  {
    id: "ablauf",
    kicker: "Der Weg",
    headline: "Von der Bestandsaufnahme bis zum wachenden Betrieb.",
    subline:
      "SmokeMieter führt Ihr Objekt Schritt für Schritt in den verwalteten Zustand.",
    points: [
      "Bestand aufnehmen",
      "Konzept festlegen",
      "Melder montieren",
      "Ferninspektion aktivieren",
      "Ereignisse kommunizieren",
      "Nachweise dokumentieren",
      "Abrechnung vorbereiten",
    ],
    media: "dawn",
  },
  {
    id: "plattform",
    kicker: "Das System",
    headline: "Ein Dashboard für jeden Melder im Haus.",
    subline:
      "SmokeMieter ist Teil von Powerhouse 360: Melder, Räume, Status, Ereignisse und Nachweise laufen in einer Ansicht zusammen.",
    cta: [{ ...SM_CTA.demo, variant: "secondary" }],
  },
];

/** Abrechnungs-Beleg (Sektion »abrechnung« — Struktur, keine Preise). */
export const SM_BILLING_ROWS: { label: string; value: string }[] = [
  { label: "Modell", value: "Gerätemiete statt Investition" },
  { label: "Leistung", value: "Wartung · Ferninspektion · Tausch" },
  { label: "Zeitraum", value: "Monatlich, planbar" },
  { label: "Beleg", value: "Je Objekt und Wohnung" },
  { label: "Status", value: "Abrechnungsfähig strukturiert" },
];

/** Verwaltungs-Widgets (glaubwürdige Zustände — 14 Wohnungen × 3 Melder). */
export const SM_ADMIN_WIDGETS: {
  label: string;
  value: string;
  state?: "ok" | "info" | "warn";
}[] = [
  { label: "Melder im Bestand", value: "42", state: "ok" },
  { label: "Ferninspektion", value: "Aktiv", state: "ok" },
  { label: "Letzte Prüfung", value: "Vollständig", state: "ok" },
  { label: "Offene Ereignisse", value: "0", state: "ok" },
  { label: "Nachweise", value: "Abrufbar", state: "info" },
];

/* ────────────────────────────────────────────── Final-CTA (Akt 4) */

export const SM_FINAL = {
  kicker: "SmokeMieter",
  headline: "Die zweite Version der Nacht beginnt mit einem Gespräch.",
  subline:
    "Für die Sicherheit aller Bewohner Ihrer Immobilie: geplant, montiert und gewartet nach DIN 14676 — ferngeprüft, dokumentiert und abrechnungsfähig strukturiert.",
  support: "Für Eigentümer, WEGs, Hausverwaltungen und Wohnungsunternehmen.",
  cta: [
    { ...SM_CTA.bestandscheck, variant: "primary" as const },
    { ...SM_CTA.planung, variant: "secondary" as const },
  ],
};
