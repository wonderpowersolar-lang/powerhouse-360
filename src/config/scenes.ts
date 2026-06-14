/**
 * POWERHOUSE360 — scene asset manifest (single source of truth).
 *
 * One entry per scroll chapter (keyed by section id, see content/sections.ts),
 * carrying BOTH theme variants of every visual: the still image (dark/light),
 * an OPTIONAL scroll-scrubbed video (dark/light, mp4 + optional webm), an
 * optional poster, and the normalised focal point used by the Ken-Burns push
 * and object-position.
 *
 * ── Asset paths (the spec's structure) ───────────────────────────────────────
 *   public/assets/powerhouse/scenes/dark/<id>.jpg     still, dark mode
 *   public/assets/powerhouse/scenes/light/<id>.jpg    still, light mode
 *   public/assets/powerhouse/video/dark/<id>.mp4      scrubbed video, dark
 *   public/assets/powerhouse/video/light/<id>.mp4     scrubbed video, light
 *
 * Today every entry points at a still only (the existing photoreal renders,
 * copied into both theme slots as placeholders — the light slots get real
 * daylight renders in the asset pass). When a station gets a generated video,
 * fill its `video` field and the stage mounts a scroll-scrubbed <SceneVideo>
 * over the still automatically; until then the still + Ken-Burns is used.
 *
 * TO SWAP AN ASSET: drop the file in the path above and (if the name differs)
 * edit the entry here. Nothing else needs to change.
 */

import type { Theme } from "@/lib/themeStore";

export interface SceneVideoSrc {
  /** required H.264 mp4 (universal) */
  mp4: string;
  /** optional VP9/AV1 webm (smaller; served first where supported) */
  webm?: string;
}

export interface SceneAsset {
  /** still image per theme (always present — also the video poster/fallback) */
  image: { dark: string; light: string };
  /** optional scroll-scrubbed video per theme; falls back to `image` */
  video?: { dark?: SceneVideoSrc; light?: SceneVideoSrc };
  /** optional explicit poster per theme (defaults to `image`) */
  poster?: { dark: string; light: string };
  /** normalised focal point (0..1 of the image w/h) for Ken-Burns + crop */
  focal: { x: number; y: number };
  /** optional "approach" still (e.g. the PV roof before the meter wall) */
  alt?: { dark: string; light: string };
}

const S = "/assets/powerhouse/scenes";

/** id → { scenes/dark/<id>.jpg, scenes/light/<id>.jpg } */
function still(id: string) {
  return { dark: `${S}/dark/${id}.jpg`, light: `${S}/light/${id}.jpg` };
}

export const SCENES: Record<string, SceneAsset> = {
  hero: {
    image: still("hero"),
    // First scroll-scrubbed clip (Seedance 2.0, dark): a slow cinematic push-in.
    // Light has no video yet → light mode falls back to the still + Ken-Burns.
    video: { dark: { mp4: "/assets/powerhouse/video/dark/hero.mp4" } },
    focal: { x: 0.5, y: 0.46 },
  },
  powermieter: {
    image: still("powermieter"),
    alt: still("powermieter_alt"),
    focal: { x: 0.46, y: 0.5 },
  },
  heatmieter: {
    image: still("heatmieter"),
    video: { dark: { mp4: "/assets/powerhouse/video/dark/heatmieter.mp4" } },
    focal: { x: 0.56, y: 0.56 },
  },
  hub: {
    image: still("hub"),
    video: { dark: { mp4: "/assets/powerhouse/video/dark/hub.mp4" } },
    focal: { x: 0.44, y: 0.5 },
  },
  chargemieter: { image: still("chargemieter"), focal: { x: 0.42, y: 0.55 } },
  smokemieter: { image: still("smokemieter"), focal: { x: 0.52, y: 0.4 } },
  residents: { image: still("residents"), focal: { x: 0.6, y: 0.5 } },
  dashboard: { image: still("dashboard"), focal: { x: 0.5, y: 0.5 } },
  cta: {
    image: still("cta"),
    video: { dark: { mp4: "/assets/powerhouse/video/dark/cta.mp4" } },
    focal: { x: 0.5, y: 0.48 },
  },
};

/** Active-theme still for a station (falls back to hero). */
export function sceneImage(id: string, theme: Theme): string {
  return (SCENES[id] ?? SCENES.hero).image[theme];
}

/** Active-theme "approach" still, if the station defines one. */
export function sceneAlt(id: string, theme: Theme): string | undefined {
  return SCENES[id]?.alt?.[theme];
}

/** Focal point for a station (default centre). */
export function sceneFocal(id: string): { x: number; y: number } {
  return SCENES[id]?.focal ?? { x: 0.5, y: 0.5 };
}

/** Active-theme scrubbed video for a station, or undefined (→ use the still). */
export function sceneVideo(id: string, theme: Theme): SceneVideoSrc | undefined {
  return SCENES[id]?.video?.[theme];
}

/** Active-theme poster (explicit, else the still). */
export function scenePoster(id: string, theme: Theme): string {
  return SCENES[id]?.poster?.[theme] ?? sceneImage(id, theme);
}
