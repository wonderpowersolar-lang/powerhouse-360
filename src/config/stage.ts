/**
 * POWERHOUSE360 — stage configuration (the image-vs-R3F pivot).
 *
 * ONE switch decides the visual layer that sits behind the scrolling copy:
 *
 *   STAGE = "image"  → the photoreal cinematic ImageStage (Higgsfield renders).
 *   STAGE = "r3f"    → the original real-time React-Three-Fiber BuildingScene.
 *
 * Everything else (copy overlays, ProductPanel, ModuleNavigation, ScrollProgress,
 * loader, the explorer/focus chain, the 5-beat scroll mapping) is shared and
 * unchanged between the two — only the stage component swaps. The R3F path is
 * fully preserved and still type-checks/builds; flip this back to "r3f" to use
 * it. Default is the client-requested photoreal image stage.
 */
export const STAGE: "image" | "r3f" = "image";

/* ──────────────────────────────────────────────────────────── station images */

/**
 * The 9 station images (public/stations/*), one per scroll chapter, in story
 * order 00→09. These are the master Higgsfield photoreal renders; the ImageStage
 * crossfades between consecutive entries as the section-float advances, applying
 * a continuous Ken-Burns push so transitions read as a camera move, not a cut.
 *
 * Keyed by section id (sections.ts) so reordering chapters is a data change.
 */
export const STATION_IMAGE: Record<string, string> = {
  hero: "/stations/00-hero-overview.jpg",
  powermieter: "/stations/01-powermieter-meterwall.jpg",
  heatmieter: "/stations/03-heatmieter-heatpump.jpg",
  hub: "/stations/04-hub-techroom.jpg",
  chargemieter: "/stations/05-chargemieter-wallbox.jpg",
  smokemieter: "/stations/06-smokemieter-stairwell.jpg",
  residents: "/stations/07-bewohner-apartment.jpg",
  // Platform station: the connected tower at night, dimmed, behind the DOM
  // dashboard window (the dashboard is the hero of this station — see §3/§4).
  dashboard: "/stations/09-final-connected.jpg",
  // Finale: the whole tower at night, all systems lit.
  cta: "/stations/09-final-connected.jpg",
};

/** A second image used as the powermieter "approach" — the rooftop PV array,
 *  so the Strom story opens on the roof before settling on the meter wall. We
 *  keep this optional; the stage falls back to the single STATION_IMAGE entry. */
export const STATION_IMAGE_ALT: Record<string, string | undefined> = {
  powermieter: "/stations/02-powermieter-roof.jpg",
};

/** Hero image (priority-loaded) + the master overview the explorer flies from. */
export const HERO_IMAGE = STATION_IMAGE.hero;

/* ────────────────────────────────────────────────── image-space focal points */

/**
 * Per-station focal point in NORMALISED image coordinates (0..1 of the image's
 * own width/height). The Ken-Burns push and the explorer crossfade-zoom both
 * zoom TOWARD this point, so the camera move ends on the station's subject (the
 * meter wall, the heat pump, the wallbox …) rather than the image centre.
 * Default {x:0.5,y:0.5} if a station is omitted.
 */
export const STATION_FOCAL: Record<string, { x: number; y: number }> = {
  hero: { x: 0.5, y: 0.46 },
  powermieter: { x: 0.46, y: 0.5 }, // meter wall reads centre-left
  heatmieter: { x: 0.56, y: 0.56 }, // louvre monobloc, centre-right
  hub: { x: 0.44, y: 0.5 }, // hub on the wall, centre-left
  chargemieter: { x: 0.42, y: 0.55 }, // wallbox row, left
  smokemieter: { x: 0.52, y: 0.4 }, // ceiling detector, upper-centre
  residents: { x: 0.6, y: 0.5 }, // wall display, right
  dashboard: { x: 0.5, y: 0.5 },
  cta: { x: 0.5, y: 0.48 },
};

/* ───────────────────────────────────────────────────── explorer pin anchors */

/**
 * The six explorer pins, anchored to FIXED points on the hero overview image
 * (00-hero-overview.jpg) in normalised image coordinates. The hero image is a
 * 3/4 aerial dusk view of the tower on its plaza, so each module maps to a real
 * visible feature:
 *
 *   01 Powermieter → the rooftop PV array
 *   02 Heatmieter  → the heat-pump monobloc on the right plaza pad
 *   03 Hub         → the ground-floor tech facade (front-left)
 *   04 Chargemieter→ the lower facade / garage level (front-right)
 *   05 Smokemieter → the stairwell (the green ivy stripe on the right face)
 *   06 Bewohner    → a warm lit apartment window (left face)
 *
 * `side` decides which way the label chip fans (so chips clear the facade).
 * The ImageStage maps these normalised points onto the rendered (object-cover)
 * image rect each frame, so pins track the hero push-in precisely.
 */
export interface ImageHotspotAnchor {
  id: string;
  /** normalised x,y on the hero image (0..1) */
  x: number;
  y: number;
  /** chip fan direction */
  side: "left" | "right";
}

export const IMAGE_HOTSPOTS: ImageHotspotAnchor[] = [
  // roof PV — high on the array, chip fans RIGHT so it clears the left headline.
  { id: "powermieter", x: 0.52, y: 0.07, side: "right" },
  // heat-pump pad on the right plaza — chip fans right into open sky.
  { id: "heatmieter", x: 0.712, y: 0.77, side: "right" },
  // ground-floor entrance/tech facade, lower-centre — chip fans RIGHT toward the
  // building (well BELOW the headline band so it never collides with copy).
  { id: "hub", x: 0.5, y: 0.78, side: "right" },
  // lower-right facade / garage level — chip fans right.
  { id: "chargemieter", x: 0.63, y: 0.66, side: "right" },
  // stairwell ivy stripe on the right face — chip fans right.
  { id: "smokemieter", x: 0.6, y: 0.4, side: "right" },
  // lit apartment window, right face upper-mid — chip fans right (clear of copy).
  { id: "residents", x: 0.66, y: 0.52, side: "right" },
];
