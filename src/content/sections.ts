/**
 * POWERHOUSE360 — single source of truth for the 8 scroll chapters.
 *
 * EDIT COPY HERE. Each entry pairs the German marketing copy with the camera
 * keyframe + which 3D element is emphasised. The scene (BuildingScene.tsx)
 * interpolates the camera between consecutive keyframes based on scroll
 * progress, so reordering/retiming chapters is a data change, not a code change.
 *
 * Camera coordinates are in world units. The building sits at the origin,
 * roughly 12 units tall, footprint ~7 x 5.
 */

import type { Vector3Tuple } from "three";

export type Emphasis =
  | "building"
  | "pv"
  | "heatpump"
  | "hub"
  | "meters"
  | "apartment"
  | "dashboard"
  | "all";

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
}

export const SECTIONS: SectionDef[] = [
  {
    id: "hero",
    index: 0,
    kicker: "Das Building-OS",
    headline: "POWERHOUSE360 macht Mehrfamilienhäuser energieaktiv.",
    subline:
      "Solarstrom, Wärme, Messung, Abrechnung und Betrieb – verbunden in einem intelligenten Gebäudesystem.",
    align: "left",
    cta: [
      { label: "Projekt prüfen lassen", href: "#cta", variant: "primary" },
      { label: "Demo ansehen", href: "#cta", variant: "secondary" },
    ],
    emphasis: "building",
    camPos: [9.5, 5.2, 13.5],
    camTarget: [0, 4.5, 0],
  },
  {
    id: "pv",
    index: 1,
    kicker: "01 — Powermaker",
    headline: "Das Dach wird zur Energiequelle.",
    subline:
      "Powermaker verbindet PV, Speicher und Monitoring zu einer wirtschaftlichen Stromlösung für Mehrfamilienhäuser.",
    align: "right",
    emphasis: "pv",
    camPos: [5.5, 12.5, 8.5],
    camTarget: [0, 9.6, 0],
  },
  {
    id: "heat",
    index: 2,
    kicker: "02 — Heatmaker",
    headline: "Wärme wird planbar, effizient und förderfähig.",
    subline:
      "Heatmaker integriert Wärmepumpen in bestehende Mehrfamilienhäuser – inklusive Planung, Umsetzung und Betriebsdaten.",
    align: "left",
    emphasis: "heatpump",
    camPos: [-7.5, 2.6, 7.5],
    camTarget: [-3.4, 1.4, 0.5],
  },
  {
    id: "hub",
    index: 3,
    kicker: "03 — POWERHOUSE Hub v1",
    headline: "Der Hub ist das Gehirn des Gebäudes.",
    subline:
      "Der POWERHOUSE Hub verbindet Zähler, Wärmepumpe, Wechselrichter, LoRaWAN-Sensorik und lokale Gebäudedaten.",
    align: "right",
    emphasis: "hub",
    camPos: [0.4, 2.0, 4.1],
    camTarget: [-0.1, 2.0, -2.2],
  },
  {
    id: "meters",
    index: 4,
    kicker: "04 — Powermieter",
    headline: "Messung und Abrechnung werden digital.",
    subline:
      "Powermieter bildet Mieterstrom, Gebäudestrom, Teilnehmerlogik und Abrechnung in einem klaren Prozess ab.",
    align: "left",
    emphasis: "meters",
    camPos: [3.0, 2.4, 4.4],
    camTarget: [1.9, 2.2, -1.8],
  },
  {
    id: "residents",
    index: 5,
    kicker: "05 — Bewohnerportal mit Paula",
    headline: "Bewohner verstehen ihren Energieverbrauch.",
    subline:
      "Paula begleitet Nutzer durch Vertrag, Verbrauch, Einsparung und Abrechnung – einfach und verständlich.",
    align: "right",
    emphasis: "apartment",
    camPos: [3.6, 6.4, 5.2],
    camTarget: [1.4, 6.2, -1.6],
  },
  {
    id: "dashboard",
    index: 6,
    kicker: "06 — PowerPilot",
    headline: "Ein System für Eigentümer, Hausverwaltung und Bewohner.",
    subline:
      "POWERHOUSE360 macht Betrieb, Abrechnung, Monitoring und Dokumentation steuerbar – über alle Energie- und Gebäudedaten hinweg.",
    align: "center",
    emphasis: "dashboard",
    camPos: [0, 7.5, 22],
    camTarget: [0, 6, 0],
  },
  {
    id: "cta",
    index: 7,
    kicker: "Vom Gebäude zum Asset",
    headline: "Vom Gebäude zum intelligenten Energie-Asset.",
    subline:
      "POWERHOUSE360 bündelt Planung, Umsetzung, Messung, Abrechnung und Betrieb – damit Mehrfamilienhäuser wirtschaftlich, transparent und zukunftsfähig werden.",
    align: "left",
    cta: [
      { label: "Pilotobjekt anfragen", href: "#cta", variant: "primary" },
      { label: "Demo buchen", href: "#cta", variant: "secondary" },
    ],
    emphasis: "all",
    camPos: [11, 6, 15],
    camTarget: [0, 4.8, 0],
  },
];

/** Nav anchor links (chapter shortcuts). */
export const NAV_LINKS = [
  { label: "Solar", href: "#pv" },
  { label: "Wärme", href: "#heat" },
  { label: "Hub", href: "#hub" },
  { label: "Messung", href: "#meters" },
  { label: "Bewohner", href: "#residents" },
  { label: "Plattform", href: "#dashboard" },
];

/** Dashboard module chips (Section 7). */
export const DASHBOARD_MODULES = [
  "Powermieter",
  "Heatmieter",
  "Smokemieter",
  "Chargemieter",
  "PowerPilot",
];

/** Dashboard KPI cards (Section 7). */
export const DASHBOARD_KPIS = [
  { label: "Eigenverbrauch", value: "68 %", trend: "+12 %" },
  { label: "CO₂ vermieden", value: "24,6 t", trend: "/ Jahr" },
  { label: "Kosten", value: "−31 %", trend: "Energiekosten" },
  { label: "Systemstatus", value: "Online", trend: "alle Module" },
];
