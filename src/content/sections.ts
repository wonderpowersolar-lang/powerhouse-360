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
    // whole TOWER with headroom (frontal three-quarter, elevated) — pushes in.
    // Tower is ~18u tall (7 floors + setback penthouse), centred ~y8.
    camPos: [15, 11, 19],
    camTarget: [0, 8.0, 0],
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
    // steep, CLOSE look down onto the rooftop array (centred ~y16.1, z≈1.6).
    // Camera sits high/front so the tilted modules fill the left/centre of the
    // frame (text block on the right). Target on the array keeps it framed.
    camPos: [-2.2, 20.5, 7.0],
    camTarget: [-1.0, 15.9, 1.4],
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
    // Proven front-left three-quarter of the outdoor unit (at ≈-4.7,0.9,1.2; fan
    // faces -x), tower mass behind it. Low, close, slightly elevated. Headline
    // is left-aligned; this lands the unit centre/right where it reads clearly.
    camPos: [-9.2, 2.8, 4.8],
    camTarget: [-4.7, 1.0, 1.2],
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
    // INSIDE the tower envelope (outward faces back-face-cull away) so the
    // wall-mounted Hub (≈-0.2,3.05,-2.7) reads as the LARGE hero. Headline is
    // IMPORTANT — read before editing these numbers:
    // The DOM #hub anchor settles at section-float s≈2.54, NOT the pure hub
    // keyframe (s=3.0). So the camera the viewer SEES is a ~56% blend from the
    // HEAT keyframe (heatPos x≈-9.2,+z) toward this one; the pure values below
    // are never shown directly. They were SOLVED so that the blend at s=2.54
    // lands the camera at ≈[0.4,3.1,1.6] looking at the Hub centre ≈[-0.3,3,-2.7]
    // — i.e. ~4.3u frontal, Hub big in the LEFT-centre, right ~45% clear for the
    // right-aligned copy. The brighter TechRoom fill keeps the white enclosure
    // bright so the 4-tile screen + "HUB v1" read. (Solve: kf=(view-heat·(1-f))/f,
    // f=smoothstep(0.54)≈0.563.) Verified against the qa-anchor #hub screenshot.
    camPos: [7.85, 3.33, -0.88],
    camTarget: [3.12, 4.55, -5.73],
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
    // INSIDE the envelope, LEVEL with the cabinet centre (≈1.6,3.0,-2.5) so the
    // full Zählerschrank reads straight-on. Staying level keeps any accent band
    // edge-on / out of frame.
    camPos: [1.6, 3.05, 0.3],
    camTarget: [1.6, 3.0, -2.5],
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
    // INSIDE the apartment on an upper floor (≈1.2,8.6,-2.2), front-left angle:
    // warm lounge to the left, energy display + Paula card to the right.
    camPos: [-0.2, 8.95, 0.7],
    camTarget: [1.3, 8.6, -2.0],
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
    // pulled back, frontal, full tower reads as a digital twin behind the cards
    camPos: [0, 9.0, 25],
    camTarget: [0, 8, 0],
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
    // pull back out to the whole connected tower (mirrors the hero, other side)
    camPos: [13.5, 11, 19.5],
    camTarget: [0, 8.0, 0],
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
