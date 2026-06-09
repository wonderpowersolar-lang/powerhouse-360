/**
 * Global scroll-progress store.
 *
 * A tiny module-level singleton shared between the DOM scroll layer (Lenis)
 * and the R3F render loop. We deliberately avoid React state here: the camera
 * reads `progress` every frame inside useFrame, so pushing it through React
 * would cause thousands of re-renders. Instead the scroll layer mutates the
 * value and the scene reads it imperatively.
 *
 * `progress` is 0 at the top of the page and 1 at the bottom.
 * `getSectionFloat()` is the floating-point section index (0..8) used to know
 * which chapter is active and how far we are between chapters.
 *
 * ── HOLD / PLATEAU MAPPING ──────────────────────────────────────────────────
 * The 9 sections are an equal-width scroll band each. Inside every band we
 * reserve a wide central HOLD zone where the section-float is PINNED to the
 * integer (the camera RESTS exactly on the keyframe while the ProductPanel is
 * read), flanked by short TRAVEL zones that smoothly carry the float to the
 * next integer. The result: the camera plateaus at each station instead of
 * sweeping continuously, so the user can never rush past the key moments.
 */

export const NUM_SECTIONS = 9;

/**
 * Fraction of each section band spent TRAVELLING to the next keyframe.
 * The remaining (1 - 2*TRAVEL) is the HOLD plateau on the current keyframe.
 * 0.34 → ~34% travel, ~66% rest. Calmer, gives every station a clear beat.
 */
const TRAVEL = 0.34;

const store = {
  /** Raw page scroll progress 0..1 */
  progress: 0,
  /**
   * DOM-anchored raw section float in [0, NUM_SECTIONS-1]. Fed by ScrollBridge
   * from the actual section element positions (viewport-centre crossing), so it
   * is immune to unequal section heights / Nav / Footer offsets. When -1 the
   * DOM bridge hasn't run yet and we fall back to the linear `progress` map.
   */
  sectionRaw: -1,
  /** Smoothed progress the scene actually follows (eased toward `progress`) */
  smooth: 0,
  /** Viewport considered "mobile/reduced" — scene runs in light mode */
  reduced: false,
};

export function setProgress(p: number) {
  store.progress = Math.min(1, Math.max(0, p));
}

export function getProgress() {
  return store.progress;
}

/** ScrollBridge feeds the DOM-anchored raw section float here every tick. */
export function setSectionRaw(v: number) {
  store.sectionRaw = Math.min(NUM_SECTIONS - 1, Math.max(0, v));
}

function smoothstep(t: number) {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
}

/**
 * Section position in [0, NUM_SECTIONS-1], fractional between chapters, with a
 * HOLD plateau centred on every integer. See file header.
 */
export function getSectionFloat() {
  const N = NUM_SECTIONS;
  const last = N - 1;
  // Prefer the DOM-anchored raw float (robust to layout); fall back to linear.
  const raw = store.sectionRaw >= 0 ? store.sectionRaw : store.progress * last;
  const i = Math.min(last, Math.floor(raw));
  if (i >= last) return last;
  const frac = raw - i; // 0..1 within band i→i+1

  // Each band [i, i+1) is: HOLD on keyframe i until `1-TRAVEL`, then TRAVEL to
  // i+1 over the last TRAVEL fraction — so the camera plateaus on every station.
  if (frac <= 1 - TRAVEL) return i;
  const t = (frac - (1 - TRAVEL)) / TRAVEL; // 0..1
  return i + smoothstep(t);
}

/**
 * Per-section "hold strength" in [0,1] — 1 while resting on `index`, ramping to
 * 0 across the travel into/out of it. Used to drive ProductPanel reveal so the
 * panel only shows once the camera has settled. Robust to the plateau mapping.
 */
export function holdWeight(index: number): number {
  const s = getSectionFloat();
  const d = Math.abs(s - index);
  // Inside ~0.5 of the integer we are essentially resting; fade out by ~0.85.
  return 1 - smoothstep((d - 0.12) / 0.6);
}

export function getSmooth() {
  return store.smooth;
}

export function setSmooth(v: number) {
  store.smooth = v;
}

export function setReduced(v: boolean) {
  store.reduced = v;
}

export function getReduced() {
  return store.reduced;
}

export default store;
