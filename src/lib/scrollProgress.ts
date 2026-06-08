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
 * `section` is the floating-point section index (0..7) used to know which
 * chapter is active and how far we are between chapters.
 */

export const NUM_SECTIONS = 8;

const store = {
  /** Raw page scroll progress 0..1 */
  progress: 0,
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

/** Section position in [0, NUM_SECTIONS-1], fractional between chapters. */
export function getSectionFloat() {
  return store.progress * (NUM_SECTIONS - 1);
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
