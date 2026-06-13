/**
 * POWERHOUSE360 — single source of truth for the 9 scroll chapters.
 *
 * EDIT COPY HERE. Copy is the FINAL client-approved wording from
 * docs/DESIGN-DIRECTION.md (§4 panel texts verbatim, §10 hero/final copy).
 * Each entry pairs the German marketing copy with the camera keyframe + which
 * 3D element is emphasised + the numbered ProductPanel (the floating product
 * card that reveals once the camera settles). The scene (BuildingScene.tsx)
 * interpolates the camera between consecutive keyframes based on the
 * plateaued section-float (scrollProgress.ts) using the per-section `hold`
 * value, so reordering / retiming chapters is a data change, not a code
 * change.
 *
 * Camera coordinates are in world units. The building sits at the origin,
 * footprint 6 × 6 (x,z), occupied massing ~y0..15.6, roof ~y15.6.
 *
 * THE STORY — the Building-OS with numbered product worlds 01–07:
 *   01 Powermieter (Strom) · 02 Heatmieter (Wärme) · 03 POWERHOUSE Hub ·
 *   04 Chargemieter (Laden) · 05 Smokemieter (Sicherheit) ·
 *   06 Bewohnerportal · 07 POWERHOUSE 360 Plattform.
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

/** A small KPI chip shown inside a ProductPanel (rendered via MetricCard). */
export interface PanelKpi {
  label: string;
  value: string;
  /** optional 0..1 mini-bar fill */
  bar?: number;
}

/** Data-driven ProductPanel content for a section (the floating product card). */
export interface ProductPanelDef {
  /** chapter / product number, "01".."07" — the Razorpay numeral leitmotif */
  number: string;
  /** small tag above the title */
  tag: string;
  title: string;
  /** §4 panel subline */
  subtitle: string;
  bullets: string[];
  kpis?: PanelKpi[];
  /** glass theme — dark over bright scenes, light over dark interiors */
  theme: "dark" | "light";
  /** brand accent for this product world */
  accent: "teal" | "green" | "aqua" | "amber";
}

export interface SectionDef {
  id: string;
  index: number;
  /** small label shown above the headline — `01 / Powermieter` style */
  kicker: string;
  headline: string;
  subline: string;
  /** layout side for the text block on desktop */
  align: "left" | "right" | "center";
  cta?: { label: string; href: string; variant: "primary" | "secondary" }[];
  /** which 3D element glows/zooms in this chapter */
  emphasis: Emphasis;
  /** camera world position at the *centre* of this chapter */
  camPos: Vector3Tuple;
  /** camera look-at target at the *centre* of this chapter */
  camTarget: Vector3Tuple;
  /**
   * Plateau share of this station's scroll band, 0..1 (motionTokens §5).
   * Default 0.75. Heatmieter 0.8; hero/dashboard/cta long.
   */
  hold?: number;
  /**
   * Photoreal station image (public/stations/*) used by the image stage and the
   * mobile cards. Optional — resolved via STATION_IMAGE in config/stage.ts when
   * omitted, so this is just a per-section override hook.
   */
  image?: string;
  /** the floating product card for this station (optional on hero/cta) */
  panel?: ProductPanelDef;
}

export const SECTIONS: SectionDef[] = [
  // ──────────────────────────────────────────────────────────── 0 · HERO
  {
    id: "hero",
    index: 0,
    kicker: "Powerhouse 360",
    headline: "Das Betriebssystem deiner Immobilie.",
    subline:
      "Strom, Wärme, Laden, Sicherheit und Abrechnung – verbunden in einem intelligenten System für Mehrfamilienhäuser.",
    align: "left",
    cta: [
      { label: "System entdecken", href: "#powermieter", variant: "primary" },
      { label: "Pilotobjekt anfragen", href: "#cta", variant: "secondary" },
    ],
    emphasis: "building",
    hold: 0.8,
    // Whole tower, frontal three-quarter, elevated dusk push-in. Pulled back
    // far enough that the roof + PV array stay IN frame (REF-1 full-building
    // night render).
    camPos: [16, 13, 21],
    camTarget: [0, 7.4, 0],
  },

  // ──────────────────────────────────────────────────── 1 · POWERMIETER
  {
    id: "powermieter",
    index: 1,
    kicker: "01 / Powermieter",
    headline: "Strom im Mehrfamilienhaus wirtschaftlich betreiben.",
    subline:
      "Mieterstrom, Gebäudestrom, Energiefluss und Abrechnung in einem klaren System.",
    align: "right",
    emphasis: "pv",
    hold: 0.78,
    // The METERING MOMENT (REF-3): inside the bright plant room, frontal on
    // the white Zählerwand (cabinet door + five meter columns, world x≈-2.7..
    // 0.55, centred ≈3.0 high on the back wall at z≈-2.8). Camera rests just
    // outside the open room front; meter wall reads centre-left, the Hub /
    // concrete continuity at frame right sits under the right-aligned panel.
    camPos: [-0.85, 3.1, 0.9],
    camTarget: [-1.05, 3.0, -2.8],
    panel: {
      number: "01",
      tag: "Produktwelt · Strom",
      title: "Powermieter",
      subtitle:
        "Mieterstrom, Gebäudestrom, Energiefluss und Abrechnung in einem klaren System.",
      bullets: [
        "PV-Strom lokal nutzen",
        "Mieter fair abrechnen",
        "Energieflüsse transparent machen",
        "Netzbezug und Eigenverbrauch sichtbar machen",
        "Abrechnung und Betrieb digitalisieren",
      ],
      kpis: [
        { label: "PV-Anteil", value: "54 %", bar: 0.54 },
        { label: "Eigenverbrauch", value: "68 %", bar: 0.68 },
        { label: "Netzbezug", value: "−31 %", bar: 0.31 },
        { label: "Ersparnis", value: "1.840 €", bar: 0.6 },
      ],
      theme: "dark",
      accent: "green",
    },
  },

  // ──────────────────────────────────────────────────── 2 · HEATMIETER
  {
    id: "heatmieter",
    index: 2,
    kicker: "02 / Heatmieter",
    headline: "Wärme und Heizkosten digital verstehen.",
    subline:
      "Heatmieter verbindet Wärmepumpe, Verbrauchsdaten, Heizkostenabrechnung und Optimierung.",
    align: "left",
    emphasis: "heatpump",
    hold: 0.8,
    // Front-three-quarter of the WIDE anthracite louvre monobloc (REF-4). Unit
    // centre is at x≈4.7 on the right plaza edge, front (louvre) face = +x.
    // Camera sits low-front-right so the horizontal-louvre intake + service
    // panel read as the hero (frame centre-right, copy left); facade + warm
    // downlight cone behind.
    camPos: [9.4, 1.85, 4.7],
    camTarget: [4.35, 0.9, 1.7],
    panel: {
      number: "02",
      tag: "Produktwelt · Wärme",
      title: "Heatmieter",
      subtitle:
        "Heatmieter verbindet Wärmepumpe, Verbrauchsdaten, Heizkostenabrechnung und Optimierung.",
      bullets: [
        "Wärmepumpenbetrieb sichtbar machen",
        "Wärmeverbrauch je Gebäude/Einheit analysieren",
        "Heizkostenabrechnung vorbereiten",
        "CO₂- und Verbrauchsdaten verständlich darstellen",
        "Optimierungspotenziale erkennen",
      ],
      kpis: [
        { label: "Vorlauf", value: "38 °C", bar: 0.52 },
        { label: "Rücklauf", value: "29 °C", bar: 0.4 },
        { label: "Wärmeverbrauch", value: "12,4 MWh", bar: 0.62 },
        { label: "CO₂-Kosten", value: "−41 %", bar: 0.66 },
        { label: "Heizkostenstatus", value: "vorbereitet", bar: 0.9 },
      ],
      theme: "dark",
      accent: "teal",
    },
  },

  // ──────────────────────────────────────────────────────── 3 · HUB
  {
    id: "hub",
    index: 3,
    kicker: "03 / POWERHOUSE Hub",
    headline: "Die lokale Schaltzentrale im Gebäude.",
    subline:
      "Der Hub verbindet Geräte, Sensoren, Zähler und Gebäudedaten zu einem steuerbaren System.",
    align: "right",
    emphasis: "hub",
    hold: 0.78,
    // INSIDE the tower envelope (outward faces back-face-cull away). The Hub
    // now hangs on the bare light-grey concrete section at world x≈1.62
    // (REF-2), with the Zählerwand + server rack as left-background context.
    // Camera frames the Hub centre-left; right stays clear for copy + panel.
    camPos: [2.5, 3.12, 1.8],
    camTarget: [1.72, 2.98, -2.7],
    panel: {
      number: "03",
      tag: "Produktwelt · Vernetzung",
      title: "POWERHOUSE Hub",
      subtitle:
        "Der Hub verbindet Geräte, Sensoren, Zähler und Gebäudedaten zu einem steuerbaren System.",
      bullets: [
        "verbindet Strom, Wärme, Laden und Sicherheit",
        "lokale Gebäudedatenplattform",
        "Schnittstelle zu Zählern, Wärmepumpe, Sensorik und Cloud",
        "Grundlage für Monitoring, Abrechnung und Betrieb",
        "macht aus Technik ein digitales Gebäudesystem",
      ],
      kpis: [
        { label: "Geräte online", value: "32 / 33", bar: 0.97 },
        { label: "Datenpunkte", value: "248", bar: 0.8 },
        { label: "Gateway-Status", value: "Online", bar: 1 },
        { label: "Verbindungsqualität", value: "99,9 %", bar: 0.99 },
      ],
      theme: "light",
      accent: "teal",
    },
  },

  // ──────────────────────────────────────────────────── 4 · CHARGEMIETER
  {
    id: "chargemieter",
    index: 4,
    kicker: "04 / Chargemieter",
    headline: "Ladeinfrastruktur für Mehrfamilienhäuser abrechenbar machen.",
    subline:
      "Wallboxen, Ladepunkte, Lastmanagement und Abrechnung in einem System.",
    align: "left",
    emphasis: "wallbox",
    hold: 0.76,
    // INSIDE the garage volume (pos y-2.0). Back wall (wallboxes) is at world
    // z≈-3.8, boxes at world y≈-1.65, x≈-2.2..0.8. Camera sits close + three-
    // quarter so the lit wallbox row + car read as the hero, left clear for copy.
    camPos: [2.4, -1.3, -1.4],
    camTarget: [-0.9, -1.55, -3.6],
    panel: {
      number: "04",
      tag: "Produktwelt · Laden",
      title: "Chargemieter",
      subtitle:
        "Wallboxen, Ladepunkte, Lastmanagement und Abrechnung in einem System.",
      bullets: [
        "Ladepunkte im MFH verwalten",
        "Verbrauch je Nutzer erfassen",
        "Lastspitzen vermeiden",
        "Ladevorgänge abrechnen",
        "Ladeinfrastruktur skalierbar betreiben",
      ],
      kpis: [
        { label: "aktive Ladepunkte", value: "6 / 8", bar: 0.75 },
        { label: "aktuelle Ladeleistung", value: "44 kW", bar: 0.5 },
        { label: "Lastreserve", value: "38 %", bar: 0.38 },
        { label: "Ladevorgänge", value: "312 / Monat", bar: 0.58 },
        { label: "Abrechnungsstatus", value: "automatisch", bar: 1 },
      ],
      theme: "light",
      accent: "aqua",
    },
  },

  // ──────────────────────────────────────────────────── 5 · SMOKEMIETER
  {
    id: "smokemieter",
    index: 5,
    kicker: "05 / Smokemieter",
    headline: "Rauchmelder digital verwalten.",
    subline:
      "Sicherheitsstatus, Wartung und Geräteverwaltung für den Bestand.",
    align: "right",
    emphasis: "smoke",
    hold: 0.75,
    // INSIDE the stairwell volume (pos y6.4, ceiling world y≈7.9). The ceiling
    // detector hangs at world ≈ (0, 7.56, -1.6). Camera sits directly below-
    // front looking UP so the round detector + its LED read clearly as the
    // CENTRED subject (upper-centre of frame); stairs/handrail left, door +
    // sconce give the landing its concrete stairwell read.
    camPos: [0.1, 6.7, 1.0],
    camTarget: [0.0, 7.48, -1.65],
    panel: {
      number: "05",
      tag: "Produktwelt · Sicherheit",
      title: "Smokemieter",
      subtitle:
        "Sicherheitsstatus, Wartung und Geräteverwaltung für den Bestand.",
      bullets: [
        "Rauchmelderstatus im Blick",
        "Wartung digital organisieren",
        "Geräte und Räume zuordnen",
        "Servicefälle dokumentieren",
        "Sicherheit transparent machen",
      ],
      kpis: [
        { label: "Geräte online", value: "48", bar: 1 },
        { label: "Status OK", value: "46 / 48", bar: 0.96 },
        { label: "Wartung fällig", value: "2", bar: 0.12 },
        { label: "letzter Test", value: "vor 3 Tagen", bar: 0.9 },
        { label: "Alarmhistorie", value: "0 / 30 Tage", bar: 0.02 },
      ],
      theme: "light",
      accent: "amber",
    },
  },

  // ──────────────────────────────────────────────────── 6 · BEWOHNERPORTAL
  {
    id: "residents",
    index: 6,
    kicker: "06 / Bewohnerportal",
    headline: "Energie wird für Bewohner verständlich.",
    subline:
      "Verbrauch, Kosten, Abrechnung und Services in einer einfachen Nutzererfahrung.",
    align: "right",
    emphasis: "apartment",
    hold: 0.76,
    // INSIDE the apartment on an upper floor (≈1.2,8.6,-2.2), front-left angle:
    // warm lounge to the left, wall display + Paula card to the right.
    camPos: [-0.2, 8.95, 0.7],
    camTarget: [1.55, 8.6, -2.0],
    panel: {
      number: "06",
      tag: "Produktwelt · Bewohner",
      title: "Bewohnerportal",
      subtitle:
        "Verbrauch, Kosten, Abrechnung und Services in einer einfachen Nutzererfahrung.",
      bullets: [
        "Strom- und Wärmeverbrauch sehen",
        "Kosten nachvollziehen",
        "Verträge und Abrechnung verstehen",
        "Services digital nutzen",
        "Paula als Energie-Assistentin",
      ],
      kpis: [
        { label: "Solarstromanteil", value: "68 %", bar: 0.68 },
        { label: "Verbrauch heute", value: "8,7 kWh", bar: 0.45 },
        { label: "Kostenprognose", value: "86 € / Monat", bar: 0.55 },
        { label: "Status Wohnung", value: "alles ok", bar: 1 },
      ],
      theme: "dark",
      accent: "green",
    },
  },

  // ──────────────────────────────────────────────────── 7 · PLATTFORM
  {
    id: "dashboard",
    index: 7,
    kicker: "07 / Plattform",
    headline: "Fünf Module. Ein System. Ein Gebäude.",
    subline:
      "Alle Produktwelten laufen in einer zentralen Verwaltungsansicht zusammen.",
    align: "center",
    emphasis: "dashboard",
    hold: 0.8,
    // Pulled back, frontal — the full tower reads as a digital twin behind the
    // platform window.
    camPos: [0, 9.0, 25],
    camTarget: [0, 8, 0],
    panel: {
      number: "07",
      tag: "Plattform",
      title: "POWERHOUSE 360 Plattform",
      subtitle:
        "Ein System für Betrieb, Abrechnung und Gebäudedaten.",
      bullets: [
        "Objektübersicht für Hausverwaltung und Eigentümer",
        "Strom, Wärme, Laden und Sicherheit in einem System",
        "Monitoring und Abrechnung verbunden",
        "transparente Daten für Entscheidungen",
        "Grundlage für den digitalen Gebäudebetrieb",
      ],
      kpis: [
        { label: "Systemstatus", value: "Online", bar: 1 },
        { label: "CO₂-Ersparnis", value: "24,6 t / a", bar: 0.7 },
        { label: "Geräte online", value: "126", bar: 0.95 },
        { label: "Abrechnung bereit", value: "98 %", bar: 0.98 },
        { label: "Objektperformance", value: "A+", bar: 0.92 },
      ],
      theme: "dark",
      accent: "teal",
    },
  },

  // ──────────────────────────────────────────────────────── 8 · FINAL
  {
    id: "cta",
    index: 8,
    kicker: "Powerhouse 360",
    headline: "Das Betriebssystem deiner Immobilie.",
    subline:
      "Vom Mehrfamilienhaus zum intelligenten Energie-Asset – wirtschaftlich, transparent und zukunftsfähig.",
    align: "left",
    cta: [
      { label: "Demo buchen", href: "#cta", variant: "primary" },
      { label: "Pilotobjekt starten", href: "#cta", variant: "secondary" },
    ],
    emphasis: "all",
    hold: 0.85,
    // Pull back out to the whole connected tower (mirrors the hero, other
    // side) — roof + PV kept in frame like REF-1.
    camPos: [14.5, 12.8, 20.5],
    camTarget: [0, 7.4, 0],
  },
];

/** Nav anchor links (chapter shortcuts). */
export const NAV_LINKS = [
  { label: "Powermieter", href: "#powermieter" },
  { label: "Heatmieter", href: "#heatmieter" },
  { label: "Hub", href: "#hub" },
  { label: "Chargemieter", href: "#chargemieter" },
  { label: "Smokemieter", href: "#smokemieter" },
  { label: "Plattform", href: "#dashboard" },
];

/** ModuleNavigation chapter indicator (00–08): number + short label per station. */
export const STATION_LABELS: Record<string, string> = {
  hero: "Start",
  powermieter: "Powermieter",
  heatmieter: "Heatmieter",
  hub: "Hub",
  chargemieter: "Chargemieter",
  smokemieter: "Smokemieter",
  residents: "Bewohner",
  dashboard: "Plattform",
  cta: "Kontakt",
};

/** The five numbered modules — used by the dashboard module grid (§10 bracket). */
export const PRODUCT_WORLDS = [
  {
    num: "01",
    name: "Powermieter",
    domain: "Strom",
    desc: "Mieterstrom, Gebäudestrom & Energiefluss",
    accent: "#43b649",
  },
  {
    num: "02",
    name: "Heatmieter",
    domain: "Wärme & Heizkosten",
    desc: "Wärmepumpe, Verbrauch & Heizkostenabrechnung",
    accent: "#2bb6b0",
  },
  {
    num: "03",
    name: "POWERHOUSE Hub",
    domain: "Vernetzung",
    desc: "Geräte, Zähler & Sensorik verbunden",
    accent: "#5b9bd5",
  },
  {
    num: "04",
    name: "Chargemieter",
    domain: "Wallboxen",
    desc: "Ladepunkte, Lastmanagement & Ladeabrechnung",
    accent: "#80cec1",
  },
  {
    num: "05",
    name: "Smokemieter",
    domain: "Rauchmelder",
    desc: "Status, Wartung & Sicherheitsnachweis",
    accent: "#ec7b13",
  },
] as const;

/** Dashboard KPI tiles (platform window strip). */
export const DASHBOARD_KPIS = [
  { label: "Systemstatus", value: "Online", trend: "alle Module" },
  { label: "CO₂ vermieden", value: "24,6 t", trend: "/ Jahr" },
  { label: "Kosten", value: "−31 %", trend: "Energiekosten" },
  { label: "Abrechnung", value: "98 %", trend: "dokumentiert" },
  { label: "Geräte online", value: "126", trend: "vernetzt" },
];
