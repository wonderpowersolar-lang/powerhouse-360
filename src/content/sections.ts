/**
 * POWERHOUSE360 — single source of truth for the 9 scroll chapters.
 *
 * EDIT COPY HERE. Each entry pairs the German marketing copy with the camera
 * keyframe + which 3D element is emphasised + the data-driven ProductPanel
 * (the floating product card that eases in once the camera settles). The scene
 * (BuildingScene.tsx) interpolates the camera between consecutive keyframes
 * based on the plateaued section-float (scrollProgress.ts), so reordering /
 * retiming chapters is a data change, not a code change.
 *
 * Camera coordinates are in world units. The building sits at the origin,
 * footprint 6 × 6 (x,z), occupied massing ~y0..15.6, roof ~y15.6.
 *
 * THE STORY — modular Building-OS with FOUR product worlds:
 *   Powermieter (Strom) · Heatmieter (Wärme + Heizkosten) ·
 *   Chargemieter (Wallboxen/Laden) · Smokemieter (Rauchmelder/Sicherheit).
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

/** A small KPI chip shown inside a ProductPanel. */
export interface PanelKpi {
  label: string;
  value: string;
  /** optional 0..1 mini-bar fill */
  bar?: number;
}

/** Data-driven ProductPanel content for a section (the floating product card). */
export interface ProductPanelDef {
  /** small tag above the title */
  tag: string;
  title: string;
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
  /** small label shown above the headline */
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
  /** the floating product card for this station (optional on hero/cta) */
  panel?: ProductPanelDef;
}

export const SECTIONS: SectionDef[] = [
  // ──────────────────────────────────────────────────────────── 0 · HERO
  {
    id: "hero",
    index: 0,
    kicker: "Das Building-OS",
    headline: "POWERHOUSE360 macht Mehrfamilienhäuser intelligent.",
    subline:
      "Strom, Wärme, Laden, Sicherheit und Abrechnung – verbunden in einem System.",
    align: "left",
    cta: [
      { label: "System entdecken", href: "#dashboard", variant: "primary" },
      { label: "Pilotobjekt anfragen", href: "#cta", variant: "secondary" },
    ],
    emphasis: "building",
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
    kicker: "01 — Powermieter",
    headline: "Die Stromplattform für Mehrfamilienhäuser.",
    subline:
      "Powermieter verbindet PV-Erzeugung, Energiefluss und Messung zu einer wirtschaftlichen Stromlösung.",
    align: "right",
    emphasis: "pv",
    // The METERING MOMENT (REF-3): inside the bright plant room, frontal on
    // the white Zählerwand (cabinet door + five meter columns, world x≈-2.7..
    // 0.55, centred ≈3.0 high on the back wall at z≈-2.8). Camera rests just
    // outside the open room front; meter wall reads centre-left, the Hub /
    // concrete continuity at frame right sits under the right-aligned panel.
    camPos: [-0.85, 3.1, 0.9],
    camTarget: [-1.05, 3.0, -2.8],
    panel: {
      tag: "Produktwelt · Strom",
      title: "Powermieter",
      subtitle: "Die Stromplattform für Mehrfamilienhäuser",
      bullets: [
        "Mieterstrom & Gebäudestrom",
        "Energiefluss transparent machen",
        "Stromkosten senken",
        "Bewohner fair abrechnen",
        "Lokale Energie wirtschaftlich nutzen",
      ],
      kpis: [
        { label: "Eigenverbrauch", value: "68 %", bar: 0.68 },
        { label: "PV-Anteil", value: "54 %", bar: 0.54 },
        { label: "Netzbezug", value: "−31 %", bar: 0.31 },
        { label: "Einsparung", value: "1.840 €", bar: 0.6 },
      ],
      theme: "dark",
      accent: "green",
    },
  },

  // ──────────────────────────────────────────────────── 2 · HEATMIETER
  {
    id: "heatmieter",
    index: 2,
    kicker: "02 — Heatmieter",
    headline: "Wärme, Verbrauch und Heizkosten digital gedacht.",
    subline:
      "Heatmieter integriert Wärmepumpen, macht den Wärmeverbrauch sichtbar und digitalisiert die Heizkostenabrechnung.",
    align: "left",
    emphasis: "heatpump",
    // Front-three-quarter of the WIDE anthracite louvre monobloc (REF-4). Unit
    // centre is at x≈4.7 on the right plaza edge, front (louvre) face = +x.
    // Camera sits low-front-right so the horizontal-louvre intake + service
    // panel read as the hero (frame centre-right, copy left); facade + warm
    // downlight cone behind.
    camPos: [9.4, 1.85, 4.7],
    camTarget: [4.35, 0.9, 1.7],
    panel: {
      tag: "Produktwelt · Wärme",
      title: "Heatmieter",
      subtitle: "Wärme, Verbrauch und Heizkosten digital gedacht",
      bullets: [
        "Wärmepumpen-Integration",
        "Wärmeverbrauch transparent machen",
        "Heizkostenabrechnung digitalisieren",
        "Grundlage für Optimierung schaffen",
        "Betrieb und Verbrauch intelligent verbinden",
      ],
      kpis: [
        { label: "Vorlauf", value: "38 °C", bar: 0.52 },
        { label: "Rücklauf", value: "29 °C", bar: 0.4 },
        { label: "Verbrauch", value: "12,4 MWh", bar: 0.62 },
        { label: "Wärmekosten", value: "−24 %", bar: 0.5 },
        { label: "CO₂", value: "−41 %", bar: 0.66 },
      ],
      theme: "dark",
      accent: "teal",
    },
  },

  // ──────────────────────────────────────────────────────── 3 · HUB
  {
    id: "hub",
    index: 3,
    kicker: "03 — POWERHOUSE Hub",
    headline: "Die lokale Schaltzentrale im Gebäude.",
    subline:
      "Der POWERHOUSE Hub verbindet Geräte und Datenpunkte und vernetzt Strom, Wärme, Laden und Sicherheit.",
    align: "right",
    emphasis: "hub",
    // INSIDE the tower envelope (outward faces back-face-cull away). The Hub
    // now hangs on the bare light-grey concrete section at world x≈1.62
    // (REF-2), with the Zählerwand + server rack as left-background context.
    // Camera frames the Hub centre-left; right stays clear for copy + panel.
    camPos: [2.5, 3.12, 1.8],
    camTarget: [1.72, 2.98, -2.7],
    panel: {
      tag: "Das Gebäudehirn",
      title: "POWERHOUSE Hub",
      subtitle: "Die lokale Schaltzentrale im Gebäude",
      bullets: [
        "Verbindet Geräte und Datenpunkte",
        "Vernetzt Strom, Wärme, Laden und Sicherheit",
        "Schafft die Grundlage für Monitoring und Abrechnung",
        "Lokales Gebäudehirn für das Building-OS",
      ],
      kpis: [
        { label: "Datenpunkte", value: "248", bar: 0.8 },
        { label: "Geräte online", value: "32 / 33", bar: 0.97 },
        { label: "Latenz", value: "12 ms", bar: 0.3 },
        { label: "Uptime", value: "99,9 %", bar: 0.99 },
      ],
      theme: "light",
      accent: "teal",
    },
  },

  // ──────────────────────────────────────────────────── 4 · CHARGEMIETER
  {
    id: "chargemieter",
    index: 4,
    kicker: "04 — Chargemieter",
    headline: "Wallboxen und Ladeabrechnung fürs MFH.",
    subline:
      "Chargemieter integriert Wallboxen, verwaltet Ladepunkte und rechnet Ladevorgänge fair ab – mit Lastmanagement.",
    align: "left",
    emphasis: "wallbox",
    // INSIDE the garage volume (pos y-2.0). Back wall (wallboxes) is at world
    // z≈-3.8, boxes at world y≈-1.65, x≈-2.2..0.8. Camera sits close + three-
    // quarter so the lit wallbox row + car read as the hero, left clear for copy.
    camPos: [2.4, -1.3, -1.4],
    camTarget: [-0.9, -1.55, -3.6],
    panel: {
      tag: "Produktwelt · Laden",
      title: "Chargemieter",
      subtitle: "Wallboxen und Ladeabrechnung für Mehrfamilienhäuser",
      bullets: [
        "Wallboxen im MFH integrieren",
        "Ladepunkte verwalten",
        "Stromverbräuche erfassen",
        "Lastmanagement ermöglichen",
        "Ladevorgänge abrechnen",
      ],
      kpis: [
        { label: "Ladepunkte aktiv", value: "6 / 8", bar: 0.75 },
        { label: "Ladeleistung", value: "11 kW", bar: 0.5 },
        { label: "Verbrauch", value: "284 kWh", bar: 0.58 },
        { label: "Verfügbarkeit", value: "98 %", bar: 0.98 },
      ],
      theme: "light",
      accent: "aqua",
    },
  },

  // ──────────────────────────────────────────────────── 5 · SMOKEMIETER
  {
    id: "smokemieter",
    index: 5,
    kicker: "05 — Smokemieter",
    headline: "Digitale Rauchmelderverwaltung für den Bestand.",
    subline:
      "Smokemieter behält Status und Wartung der Rauchmelder im Blick und macht den Sicherheitsstatus transparent.",
    align: "right",
    emphasis: "smoke",
    // INSIDE the stairwell volume (pos y6.4, ceiling world y≈7.9). The ceiling
    // detector hangs at world ≈ (0, 7.56, -1.6). Camera sits directly below-
    // front looking UP so the round detector + its LED read clearly as the
    // CENTRED subject (upper-centre of frame); stairs/handrail left, door +
    // sconce give the landing its concrete stairwell read.
    camPos: [0.1, 6.7, 1.0],
    camTarget: [0.0, 7.48, -1.65],
    panel: {
      tag: "Produktwelt · Sicherheit",
      title: "Smokemieter",
      subtitle: "Digitale Rauchmelderverwaltung für den Bestand",
      bullets: [
        "Rauchmelderstatus im Blick",
        "Wartung und Service organisieren",
        "Sicherheitsstatus transparent machen",
        "Gebäudeschutz digital verwalten",
      ],
      kpis: [
        { label: "Status ok", value: "46 / 48", bar: 0.96 },
        { label: "Wartung fällig", value: "2", bar: 0.12 },
        { label: "Geräte online", value: "48", bar: 1 },
        { label: "Alarmhistorie", value: "0 / 30 T", bar: 0.02 },
      ],
      theme: "light",
      accent: "amber",
    },
  },

  // ──────────────────────────────────────────────────── 6 · RESIDENTS
  {
    id: "residents",
    index: 6,
    kicker: "06 — Für Bewohner",
    headline: "Für Bewohner verständlich und einfach.",
    subline:
      "Alle Energie- und Gebäudethemen in einer klaren Nutzererfahrung – Verbrauch, Kosten und Services auf einen Blick.",
    align: "right",
    emphasis: "apartment",
    // INSIDE the apartment on an upper floor (≈1.2,8.6,-2.2), front-left angle:
    // warm lounge to the left, wall display + Paula card to the right.
    camPos: [-0.2, 8.95, 0.7],
    camTarget: [1.55, 8.6, -2.0],
    panel: {
      tag: "Bewohnererlebnis",
      title: "Für Bewohner verständlich und einfach",
      subtitle:
        "Alle Energie- und Gebäudethemen in einer klaren Nutzererfahrung",
      bullets: [
        "Verbrauch verstehen",
        "Kosten nachvollziehen",
        "Energieflüsse sehen",
        "Services digital nutzen",
      ],
      kpis: [
        { label: "Verbrauch", value: "8,7 kWh", bar: 0.45 },
        { label: "Vom Dach", value: "68 %", bar: 0.68 },
        { label: "Gespart", value: "31 €", bar: 0.55 },
      ],
      theme: "dark",
      accent: "green",
    },
  },

  // ──────────────────────────────────────────────────── 7 · DASHBOARD
  {
    id: "dashboard",
    index: 7,
    kicker: "07 — Ein System",
    headline: "Ein System. Vier Produktwelten. Ein Gebäude.",
    subline:
      "POWERHOUSE360 verbindet Betrieb, Abrechnung und Gebäudedaten – über alle Energie- und Gebäudethemen hinweg.",
    align: "center",
    emphasis: "dashboard",
    // Pulled back, frontal — the full tower reads as a digital twin behind the
    // platform window.
    camPos: [0, 9.0, 25],
    camTarget: [0, 8, 0],
  },

  // ──────────────────────────────────────────────────────── 8 · CTA
  {
    id: "cta",
    index: 8,
    kicker: "Vom Gebäude zur Plattform",
    headline: "Vom Gebäude zur Plattform.",
    subline:
      "POWERHOUSE360 macht Mehrfamilienhäuser wirtschaftlicher, transparenter und zukunftsfähig.",
    align: "left",
    cta: [
      { label: "Demo buchen", href: "#cta", variant: "primary" },
      { label: "Pilot starten", href: "#cta", variant: "secondary" },
    ],
    emphasis: "all",
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

/** The four product worlds — used by the dashboard module grid. */
export const PRODUCT_WORLDS = [
  {
    name: "Powermieter",
    domain: "Strom",
    desc: "Mieterstrom, Gebäudestrom & Energiefluss",
    accent: "#43b649",
  },
  {
    name: "Heatmieter",
    domain: "Wärme & Heizkosten",
    desc: "Wärmepumpe, Verbrauch & Heizkostenabrechnung",
    accent: "#2bb6b0",
  },
  {
    name: "Chargemieter",
    domain: "Wallboxen",
    desc: "Ladepunkte, Lastmanagement & Ladeabrechnung",
    accent: "#80cec1",
  },
  {
    name: "Smokemieter",
    domain: "Rauchmelder",
    desc: "Status, Wartung & Sicherheitsnachweis",
    accent: "#ec7b13",
  },
] as const;

/** Dashboard KPI tiles (Section 7). */
export const DASHBOARD_KPIS = [
  { label: "Systemstatus", value: "Online", trend: "alle Module" },
  { label: "CO₂ vermieden", value: "24,6 t", trend: "/ Jahr" },
  { label: "Kosten", value: "−31 %", trend: "Energiekosten" },
  { label: "Abrechnung", value: "98 %", trend: "dokumentiert" },
  { label: "Geräte online", value: "126", trend: "vernetzt" },
];
