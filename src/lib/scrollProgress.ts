/**
 * Global scroll-progress store + the 5-beat band mapping (§5).
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
 * ── 5-BEAT BAND MAPPING (Approach · Hold · Reveal · Explain · Transition) ──
 * Every section element is one scroll band. Per band, the per-section `hold`
 * value (sections.ts / motionTokens) reserves a central PLATEAU where the
 * section-float is PINNED to the integer — the camera RESTS exactly on the
 * keyframe while the ProductPanel is read. The remaining travel is split
 * across the band boundary: the RELEASE (Transition beat) at the end of the
 * outgoing band and the APPROACH beat at the start of the incoming band, so
 * within band i the camera is still arriving for the first ~(1−hold)·0.55 of
 * the band, fully at rest through the middle, and releasing for the last
 * ~(1−hold)·0.45. `holdWeight()` shapes the panel beats on top of this.
 */

import { SECTIONS } from "@/content/sections";
import { hold as HOLD, APPROACH_SPLIT } from "@/styles/motionTokens";

export const NUM_SECTIONS = 9;

const LAST = NUM_SECTIONS - 1;

/** Plateau share of band `i` (0..1). */
function holdOf(i: number): number {
  const sec = SECTIONS[Math.max(0, Math.min(LAST, i))];
  return sec?.hold ?? HOLD.default;
}

/**
 * Travel-in share at the START of band `i` (the Approach beat). Zero for the
 * first band (the page opens at rest on the hero) and for the last band (the
 * raw float clamps at the last index, so its inbound travel completes at the
 * boundary).
 */
export function approachOf(i: number): number {
  if (i <= 0 || i >= LAST) return 0;
  return (1 - holdOf(i)) * APPROACH_SPLIT;
}

/**
 * Travel-out share at the END of band `i` (the Transition/release beat). When
 * the NEXT band cannot host an approach (last band), the release absorbs the
 * full travel so the camera still arrives exactly at the boundary.
 */
export function releaseOf(i: number): number {
  if (i >= LAST) return 0;
  const travel = 1 - holdOf(i);
  return i + 1 >= LAST ? travel : travel * (1 - APPROACH_SPLIT);
}

const store = {
  /** Raw page scroll progress 0..1 */
  progress: 0,
  /**
   * DOM-anchored raw section float in [0, NUM_SECTIONS-1]. Fed by ScrollBridge
   * from the actual section element positions (viewport-top crossing), so it
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

/** Raw band position in [0, LAST] — DOM-anchored, fallback to linear map. */
function rawFloat(): number {
  const raw = store.sectionRaw >= 0 ? store.sectionRaw : store.progress * LAST;
  return Math.min(LAST, Math.max(0, raw));
}

/**
 * Section position in [0, NUM_SECTIONS-1], fractional between chapters, with
 * a per-section HOLD plateau pinned on every integer and the travel windows
 * straddling the band boundaries. See file header.
 */
export function getSectionFloat() {
  const r = rawFloat();
  const i = Math.min(LAST, Math.floor(r));
  if (i >= LAST) return LAST;
  const f = r - i;

  const ap = approachOf(i);
  if (f < ap && i > 0) {
    // Tail of the inbound travel (i-1 → i): window [i - release(i-1), i + ap].
    const r0 = i - releaseOf(i - 1);
    return i - 1 + smoothstep((r - r0) / (i + ap - r0));
  }

  const rel = releaseOf(i);
  if (f > 1 - rel) {
    // Head of the outbound travel (i → i+1): window
    // [i+1 - rel, i+1 + approach(i+1)].
    const r0 = i + 1 - rel;
    const r1 = i + 1 + approachOf(i + 1);
    return i + smoothstep((r - r0) / (r1 - r0));
  }

  return i;
}

/**
 * Per-section "hold strength" in [0,1] — the beat driver for the ProductPanel
 * state machine. Shaped so that with the reveal threshold at 0.6:
 *
 *   • w stays 0 through the Approach beat (camera still moving),
 *   • crosses 0.6 at ~40–45% of the band → Reveal happens clearly AFTER the
 *     camera has settled (beat 3, §5: reveal at 40–50%),
 *   • holds 1 through the Explain beat,
 *   • collapses just before the camera releases → the panel's 250ms exit
 *     plays while the Transition beat starts (~85–90% of the band).
 */
export function holdWeight(index: number): number {
  const r = rawFloat();
  const f = r - index; // band-relative position; may be <0 or >1

  if (index >= LAST) {
    // raw clamps at LAST — ramp in as the inbound travel completes.
    return smoothstep((f + 0.22) / 0.22);
  }

  const ap = approachOf(index);
  const rel = releaseOf(index);
  // Ramp IN from camera-rest (end of approach) toward mid-band.
  const inn = smoothstep((f - ap) / Math.max(0.2, 0.62 - ap));
  // Ramp OUT just before the camera releases.
  const out = 1 - smoothstep((f - (1 - rel - 0.1)) / 0.1);
  return Math.min(inn, out);
}

/**
 * Per-section COPY visibility in [0,1] — drives the fixed station overlay
 * (kicker + headline + subline + numeral + panel container). Wider than
 * `holdWeight`: the copy materialises during the late Approach (as the camera
 * settles), stays through Hold/Reveal/Explain, and dissolves as the camera
 * releases — so during travel only the 3D stage (+ veil) is on screen.
 */
export function copyWeight(index: number): number {
  const r = rawFloat();
  const f = r - index;

  if (index >= LAST) {
    // raw clamps at LAST — fade in as the inbound travel completes.
    return smoothstep((f + 0.25) / 0.25);
  }

  const ap = approachOf(index);
  const rel = releaseOf(index);
  const inn =
    index === 0
      ? 1 // hero copy is on from load
      : smoothstep((f - ap * 0.4) / Math.max(0.12, ap * 0.75 + 0.08));
  const out = 1 - smoothstep((f - (1 - rel - 0.02)) / Math.max(0.06, rel));
  return Math.min(inn, out);
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
