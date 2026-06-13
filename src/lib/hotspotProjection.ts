/**
 * Hotspot projection bridge.
 *
 * The 3D anchors for the explorer pins must be projected to SCREEN space every
 * frame (the camera is always gently moving). Doing that projection inside the
 * R3F render loop is correct (we have the live camera + size there), but the
 * pins themselves are DOM (crisp text chips, real hover/focus, a11y). So:
 *
 *   • <HotspotProjector> (inside the Canvas) writes each pin's screen x/y, a
 *     `visible` flag (in front of camera + on-screen) and a depth scale into
 *     this module-level array every frame — NO React state, same imperative
 *     pattern as scrollProgress.
 *   • <HotspotPins> (DOM, outside the Canvas) runs its own rAF loop, reads the
 *     array and writes `transform`/opacity straight onto the pin elements.
 *
 * Index i in `projected` corresponds to HOTSPOTS[i] in focusStore.
 */

export interface ProjectedHotspot {
  /** screen px from left */
  x: number;
  /** screen px from top */
  y: number;
  /** in front of camera AND inside the viewport rect */
  onScreen: boolean;
  /** 0..1 depth-based scale hint (near = 1, far = ~0.6) */
  scale: number;
}

const projected: ProjectedHotspot[] = [];

export function ensureProjectionSlots(n: number) {
  while (projected.length < n) {
    projected.push({ x: 0, y: 0, onScreen: false, scale: 1 });
  }
}

export function writeProjection(
  i: number,
  x: number,
  y: number,
  onScreen: boolean,
  scale: number
) {
  const p = projected[i];
  if (!p) return;
  p.x = x;
  p.y = y;
  p.onScreen = onScreen;
  p.scale = scale;
}

export function getProjection(i: number): ProjectedHotspot | undefined {
  return projected[i];
}

/**
 * Whether the camera is currently in an OVERVIEW framing (hero or finale band),
 * the only place the pins should show — during the linear interior chapters they
 * would clutter the read. Driven from the scroll section-float; written by the
 * projector each frame so the DOM layer can gate visibility cheaply.
 */
let overviewAmount = 0;
export function setOverviewAmount(v: number) {
  overviewAmount = Math.min(1, Math.max(0, v));
}
export function getOverviewAmount() {
  return overviewAmount;
}
