/**
 * POWERHOUSE 360 — stage configuration.
 *
 * ONE switch decides the visual layer behind the scrolling copy:
 *
 *   STAGE = "cinema" → the cinematic stage: scroll-scrubbed hero orbit
 *                      (canvas frame sequence) + per-station Higgsfield
 *                      clips with still posters, crossfaded by scroll.
 *   STAGE = "image"  → the previous photoreal still-image stage.
 *   STAGE = "r3f"    → the original real-time React-Three-Fiber scene.
 *
 * Everything else (copy overlays, ModuleNavigation, ScrollProgress, loader)
 * is shared — only the stage component swaps.
 */
export const STAGE: "cinema" | "image" | "r3f" = "cinema";

/* ─────────────────────────────────────────────── cinematic media manifest */

/**
 * Per-station STILL (poster + reduced-motion + mobile fallback). The noir
 * launch set lives in /media/stills; the previous dusk set in /stations is
 * kept as the "image" stage's source and as an emergency fallback.
 */
export const STATION_IMAGE: Record<string, string> = {
  hero: "/media/stills/hero.jpg",
  system: "/media/stills/system.jpg",
  powermieter: "/media/stills/powermieter.jpg",
  heatmieter: "/media/stills/heatmieter.jpg",
  chargemieter: "/media/stills/chargemieter.jpg",
  smokemieter: "/media/stills/smokemieter.jpg",
  exploded: "/media/stills/exploded.jpg",
  dashboard: "/media/stills/platform.jpg",
  cta: "/media/stills/cta.jpg",
};

/**
 * Per-station CLIP (Higgsfield/Seedance, 16:9, silent, scrub-optimized:
 * dense keyframes via `-g 4`). The hero has NO entry here — it renders as
 * a canvas frame sequence (HERO_FRAMES) scrubbed by scroll.
 */
export const STATION_VIDEO: Record<string, string | undefined> = {
  system: "/media/clips/system.mp4",
  powermieter: "/media/clips/powermieter.mp4",
  heatmieter: "/media/clips/heatmieter.mp4",
  chargemieter: "/media/clips/chargemieter.mp4",
  smokemieter: "/media/clips/smokemieter.mp4",
  exploded: "/media/clips/exploded.mp4",
  dashboard: "/media/clips/platform.mp4",
  cta: "/media/clips/cta.mp4",
};

/** Hero orbit frame sequence (extracted from the 1080p orbit clip). */
export const HERO_FRAMES = {
  /** printf-style pattern, 1-based frame index */
  pattern: "/media/hero-frames/frame_%03d.jpg",
  count: 96,
  /** aspect of the source frames (16:9) */
  width: 1600,
  height: 900,
};

export function heroFramePath(i: number): string {
  return HERO_FRAMES.pattern.replace(
    "%03d",
    String(Math.max(1, Math.min(HERO_FRAMES.count, i))).padStart(3, "0")
  );
}

/** Hero still (priority-loaded poster while frames stream in). */
export const HERO_IMAGE = STATION_IMAGE.hero;

/* ────────────────────────────────────────────── image-space focal points */

/**
 * Per-station focal point in NORMALISED image coordinates (0..1). The
 * Ken-Burns push zooms TOWARD this point so the camera move ends on the
 * station's subject. Default {x:0.5,y:0.5} if omitted.
 */
export const STATION_FOCAL: Record<string, { x: number; y: number }> = {
  hero: { x: 0.5, y: 0.46 },
  system: { x: 0.55, y: 0.5 }, // translucent cutaway corner, centre-right
  powermieter: { x: 0.32, y: 0.5 }, // meter cabinet wall, left
  heatmieter: { x: 0.5, y: 0.55 }, // heat pump unit, centre
  chargemieter: { x: 0.28, y: 0.5 }, // wallbox row, left
  smokemieter: { x: 0.5, y: 0.2 }, // ceiling detector, upper-centre
  exploded: { x: 0.5, y: 0.48 },
  dashboard: { x: 0.42, y: 0.5 }, // building left of the OS glass plane
  cta: { x: 0.5, y: 0.5 },
};

/* ───────────────────────────────── legacy explorer anchors (image stage) */

export interface ImageHotspotAnchor {
  id: string;
  x: number;
  y: number;
  side: "left" | "right";
}

/** Legacy hero hotspots for the retired explorer (image stage only). */
export const IMAGE_HOTSPOTS: ImageHotspotAnchor[] = [];
