/**
 * ChargeMieter — scene-float store for /chargemieter.
 *
 * Same 5-beat band system as the homepage (approach · hold · reveal ·
 * explain · transition), but self-contained: 12 scenes, own store, fed by
 * ChargeScrollBridge from `[data-cm-scene]` elements. The homepage's global
 * store (lib/scrollProgress.ts, N=9) stays untouched — the global
 * SmoothScroll bridge only reads `[data-section]`, which this route does
 * not render.
 */

import { CM_SCENES, CM_NUM_SCENES } from "@/content/chargemieter";

const LAST = CM_NUM_SCENES - 1;
const APPROACH_SPLIT = 0.75;

function holdOf(i: number): number {
  return CM_SCENES[Math.max(0, Math.min(LAST, i))]?.hold ?? 0.75;
}

function approachOf(i: number): number {
  if (i <= 0 || i >= LAST) return 0;
  return (1 - holdOf(i)) * APPROACH_SPLIT;
}

function releaseOf(i: number): number {
  if (i >= LAST) return 0;
  const travel = 1 - holdOf(i);
  return i + 1 >= LAST ? travel : travel * (1 - APPROACH_SPLIT);
}

const store = {
  /** DOM-anchored raw scene float in [0, LAST]; -1 until the bridge runs. */
  raw: -1,
  reduced: false,
};

export function cmSetRaw(v: number) {
  store.raw = Math.min(LAST, Math.max(0, v));
}

export function cmSetReduced(v: boolean) {
  store.reduced = v;
}

export function cmGetReduced() {
  return store.reduced;
}

function smoothstep(t: number) {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
}

/** Raw band float [0, LAST] — before the bridge ticks, rest on the hero. */
export function cmRawFloat(): number {
  return store.raw >= 0 ? store.raw : 0;
}

/** Plateaued scene float — the stage crossfade + map phases follow this. */
export function cmSceneFloat(): number {
  const r = cmRawFloat();
  const i = Math.min(LAST, Math.floor(r));
  if (i >= LAST) return LAST;
  const f = r - i;

  const ap = approachOf(i);
  if (f < ap && i > 0) {
    const r0 = i - releaseOf(i - 1);
    return i - 1 + smoothstep((r - r0) / (i + ap - r0));
  }

  const rel = releaseOf(i);
  if (f > 1 - rel) {
    const r0 = i + 1 - rel;
    const r1 = i + 1 + approachOf(i + 1);
    return i + smoothstep((r - r0) / (r1 - r0));
  }

  return i;
}

/** Hold strength [0,1] of scene i — drives in-scene beats (cards, bars). */
export function cmHoldWeight(index: number): number {
  const r = cmRawFloat();
  const f = r - index;

  if (index >= LAST) {
    return smoothstep((f + 0.22) / 0.22);
  }

  const ap = approachOf(index);
  const rel = releaseOf(index);
  const inn = smoothstep((f - ap) / Math.max(0.2, 0.62 - ap));
  const out = 1 - smoothstep((f - (1 - rel - 0.1)) / 0.1);
  return Math.min(inn, out);
}

/** Copy visibility [0,1] of scene i — wider window than holdWeight. */
export function cmCopyWeight(index: number): number {
  const r = cmRawFloat();
  const f = r - index;

  if (index >= LAST) {
    return smoothstep((f + 0.25) / 0.25);
  }

  const ap = approachOf(index);
  const rel = releaseOf(index);
  const inn =
    index === 0
      ? 1
      : smoothstep((f - ap * 0.4) / Math.max(0.12, ap * 0.75 + 0.08));
  const out = 1 - smoothstep((f - (1 - rel - 0.02)) / Math.max(0.06, rel));
  return Math.min(inn, out);
}

/**
 * Frame-Loop mit Dev-Fallback: in versteckten Tabs (Preview-/Test-Harness)
 * setzt Chromium rAF komplett aus — dann treibt im Dev-Build ein Timer die
 * Zustände weiter, damit die Seite verifizierbar bleibt. Produktion bleibt
 * reines requestAnimationFrame (versteckte Tabs dürfen dort ruhen).
 */
export function cmFrameLoop(cb: (now: number) => void): () => void {
  let raf = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let stopped = false;
  const pump = () => {
    if (stopped) return;
    if (
      process.env.NODE_ENV !== "production" &&
      typeof document !== "undefined" &&
      document.hidden
    ) {
      timer = setTimeout(() => {
        cb(performance.now());
        pump();
      }, 120);
    } else {
      raf = requestAnimationFrame((t) => {
        cb(t);
        pump();
      });
    }
  };
  pump();
  return () => {
    stopped = true;
    cancelAnimationFrame(raf);
    if (timer) clearTimeout(timer);
  };
}

export default store;
