/**
 * HeatMieter — Cine-Szenen-Float-Store für /heatmieter (Desktop).
 *
 * Port von lib/chargeProgress.ts: dasselbe 5-Beat-Band-System (approach · hold
 * · reveal · explain · transition) über 14 Szenen, eigener Store, gespeist von
 * HeatCineScrollBridge aus den `[data-hm-scene]`-Bändern.
 *
 * ZUSÄTZLICH: `hmStoryProgress()` remapped den (kontinuierlichen) Szenen-Float
 * auf den Story-Fortschritt [0,1] der bestehenden Zwei-Winter-Logik
 * (lib/heatProgress). So bleiben Frame-Scrub, Ticker, Washes, Bills, Beats und
 * Datenlayer UNVERÄNDERT — sie werden nur mit `p = hmStoryProgress()` statt dem
 * alten Runway-Progress gefüttert. Die Phasengrenzen (HM_PHASES / HM_RESOLVE_AT)
 * landen exakt auf den Story-Szenen-Grenzen: winter1 → Szene 1, wechsel →
 * Szene 2, winter2 → Szene 3, Auflösung → Szene 4.
 *
 * Eigenständig neben lib/scrollProgress.ts (Homepage), lib/chargeProgress.ts
 * (/chargemieter), lib/smokeProgress.ts (/smokemieter) und lib/heatProgress.ts
 * (Mobile-Story) — bewusste Parallel-Struktur.
 */

import { HM_CINE_NUM_SCENES, HM_SCENES } from "@/content/heatmieter";
import { HM_PHASES, HM_RESOLVE_AT } from "@/content/heatmieter";

const LAST = HM_CINE_NUM_SCENES - 1;
const APPROACH_SPLIT = 0.75;

function holdOf(i: number): number {
  return HM_SCENES[Math.max(0, Math.min(LAST, i))]?.hold ?? 0.75;
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
  /** DOM-verankerter roher Szenen-Float in [0, LAST]; -1 bis die Bridge läuft. */
  raw: -1,
  reduced: false,
};

export function hmCineSetRaw(v: number) {
  store.raw = Math.min(LAST, Math.max(0, v));
}

export function hmCineSetReduced(v: boolean) {
  store.reduced = v;
}

export function hmCineGetReduced() {
  return store.reduced;
}

function smoothstep(t: number) {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
}

/** Roher Band-Float [0, LAST] — vor dem ersten Bridge-Tick auf dem Hero. */
export function hmCineRawFloat(): number {
  return store.raw >= 0 ? store.raw : 0;
}

/** Plateaued Szenen-Float — Bühnen-Crossfade + Panel-Phasen folgen ihm. */
export function hmCineSceneFloat(): number {
  const r = hmCineRawFloat();
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

/** Hold-Stärke [0,1] der Szene i — treibt szeneninterne Beats (Karten, Balken). */
export function hmCineHoldWeight(index: number): number {
  const r = hmCineRawFloat();
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

/** Copy-Sichtbarkeit [0,1] der Szene i — breiteres Fenster als holdWeight. */
export function hmCineCopyWeight(index: number): number {
  const r = hmCineRawFloat();
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

/* ══════════════════════════ Story-Remap ══════════════════════════
 * Die Story besetzt die Szenen 1..4. Der ROHE (kontinuierliche) Szenen-Float
 * wird stückweise-linear auf den Story-Fortschritt [0,1] abgebildet, so dass
 * die Phasengrenzen der heatProgress-Logik exakt auf den Szenen-Grenzen sitzen:
 *   Szene-Float 1→2  ⟶  p 0            → winter1End   (winter1: Frames vorwärts)
 *   Szene-Float 2→3  ⟶  p winter1End   → wechselEnd   (Wechsel: WP, Farbkippe)
 *   Szene-Float 3→4  ⟶  p wechselEnd   → resolveStart (winter2: Frames erneut)
 *   Szene-Float 4→5  ⟶  p resolveStart → 1            (Auflösung: klare Bill)
 * Damit läuft der Frame-Scrub durchgehend glatt (raw), während die Sachthemen
 * das Plateau-Drama des Szenen-Floats bekommen.
 * ================================================================= */

const STORY_FIRST = 1;
const STORY_LAST_EDGE = 5; // Szene-Float-Wert am Ende von Szene 4
const RESOLVE_START =
  HM_PHASES.wechselEnd + HM_RESOLVE_AT * (1 - HM_PHASES.wechselEnd);

function seg(r: number, loF: number, hiF: number, loP: number, hiP: number) {
  const t = Math.min(1, Math.max(0, (r - loF) / (hiF - loF)));
  return loP + t * (hiP - loP);
}

/** Story-Fortschritt [0,1] für die bestehenden hmXxx(p)-Funktionen. */
export function hmStoryProgress(): number {
  const r = hmCineRawFloat();
  if (r <= STORY_FIRST) return 0;
  if (r >= STORY_LAST_EDGE) return 1;
  const { winter1End, wechselEnd } = HM_PHASES;
  if (r < 2) return seg(r, 1, 2, 0, winter1End);
  if (r < 3) return seg(r, 2, 3, winter1End, wechselEnd);
  if (r < 4) return seg(r, 3, 4, wechselEnd, RESOLVE_START);
  return seg(r, 4, 5, RESOLVE_START, 1);
}

/** Sichtbarkeit [0,1] des Story-Mega-Layers (Szenen 1–4). */
export function hmStoryStageWeight(): number {
  const r = hmCineRawFloat();
  const inn = smoothstep((r - 0.78) / 0.5);
  const out = 1 - smoothstep((r - 4.3) / 0.5);
  return Math.min(inn, out);
}

/**
 * Frame-Loop mit Dev-Fallback: in versteckten Tabs (Preview-/Test-Harness)
 * setzt Chromium rAF aus — dann treibt im Dev-Build ein Timer die Zustände
 * weiter, damit die Seite verifizierbar bleibt. Produktion bleibt reines
 * requestAnimationFrame (versteckte Tabs dürfen dort ruhen).
 */
export function hmCineFrameLoop(cb: (now: number) => void): () => void {
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
