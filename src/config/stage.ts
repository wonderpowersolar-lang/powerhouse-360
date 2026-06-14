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
import { SCENES } from "./scenes";

export const STAGE: "image" | "r3f" = "image";

/* ───────────────────────────── station images / focal points (derived) ──────
 * Per-station scene assets — dark/light still, optional scrubbed video, focal
 * point — now live in ONE manifest: src/config/scenes.ts. The exports below are
 * a back-compat surface that derive the DARK still + focal from that manifest,
 * so single-theme callers keep working while theme-aware code calls sceneImage()
 * / sceneVideo() directly. EDIT ASSETS IN scenes.ts, not here. */

/** Dark still per station (back-compat; theme-aware code uses sceneImage). */
export const STATION_IMAGE: Record<string, string> = Object.fromEntries(
  Object.entries(SCENES).map(([id, s]) => [id, s.image.dark])
);

/** Optional "approach" still per station (powermieter roof), dark slot. */
export const STATION_IMAGE_ALT: Record<string, string | undefined> =
  Object.fromEntries(Object.entries(SCENES).map(([id, s]) => [id, s.alt?.dark]));

/** Hero still (priority-loaded) + the overview the explorer flies from. */
export const HERO_IMAGE = SCENES.hero.image.dark;

/** Per-station focal point (0..1), mirrored from the manifest. */
export const STATION_FOCAL: Record<string, { x: number; y: number }> =
  Object.fromEntries(Object.entries(SCENES).map(([id, s]) => [id, s.focal]));

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
