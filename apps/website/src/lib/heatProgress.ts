/**
 * HeatMieter — Story-Progress-Store für /heatmieter.
 *
 * Ein einziger Scroll-Runway (Akt 2) mit drei Phasen:
 *   winter1 [0 .. HM_PHASES.winter1End)   — Winter-Frames vorwärts, kalt-blau,
 *                                           Klimax: blinde Abrechnung
 *   wechsel [winter1End .. wechselEnd)    — HeatMieter übernimmt, Farbkippe,
 *                                           WP-Still, Datenlayer fährt hoch
 *   winter2 [wechselEnd .. 1]             — DIESELBEN Frames erneut vorwärts,
 *                                           orange Datenlayer, Beats,
 *                                           transparente Abrechnung
 *
 * Eigenständig neben lib/scrollProgress.ts (Homepage), lib/chargeProgress.ts
 * (/chargemieter) und lib/smokeProgress.ts (/smokemieter) — bewusste
 * Parallel-Struktur.
 */

import {
  HM_PHASES,
  HM_MONTHS,
  HM_BEATS,
  HM_RESOLVE_AT,
} from "@/content/heatmieter";

const store = {
  /** raw Story-Progress [0,1]; -1 bis die Bridge misst. */
  raw: -1,
  reduced: false,
};

export function hmSetRaw(v: number) {
  store.raw = Math.min(1, Math.max(0, v));
}
export function hmSetReduced(v: boolean) {
  store.reduced = v;
}
export function hmGetReduced() {
  return store.reduced;
}
export function hmRawFloat(): number {
  return store.raw >= 0 ? store.raw : 0;
}

function clamp01(t: number) {
  return Math.min(1, Math.max(0, t));
}
function smoothstep(t: number) {
  const x = clamp01(t);
  return x * x * (3 - 2 * x);
}

export type HmPhase = "winter1" | "wechsel" | "winter2";

/** Fortschritt [0,1] innerhalb der jeweiligen Phase. */
export function hmPhaseT(p: number): { phase: HmPhase; t: number } {
  const { winter1End, wechselEnd } = HM_PHASES;
  if (p < winter1End) return { phase: "winter1", t: p / winter1End };
  if (p < wechselEnd)
    return {
      phase: "wechsel",
      t: (p - winter1End) / (wechselEnd - winter1End),
    };
  return { phase: "winter2", t: (p - wechselEnd) / (1 - wechselEnd) };
}

/**
 * Frame-Index [0..count-1] für den Winter-Scrub.
 * winter1: vorwärts · wechsel: hält den letzten Frame ·
 * winter2: DIESELBE Sequenz erneut vorwärts (der Kern-Trick).
 */
export function hmFrameIndex(p: number, count: number): number {
  const { phase, t } = hmPhaseT(p);
  const last = count - 1;
  if (phase === "winter1") return Math.round(smoothstep(t) * last);
  if (phase === "wechsel") return last;
  return Math.round(smoothstep(t) * last);
}

/**
 * Monats-Ticker. winter1/winter2 laufen OKT→MÄR; wechsel zeigt keinen Monat.
 */
export function hmTicker(p: number): {
  winter: 1 | 2 | null;
  month: string;
} {
  const { phase, t } = hmPhaseT(p);
  if (phase === "wechsel") return { winter: null, month: "" };
  const idx = Math.min(
    HM_MONTHS.length - 1,
    Math.floor(smoothstep(t) * HM_MONTHS.length)
  );
  return { winter: phase === "winter1" ? 1 : 2, month: HM_MONTHS[idx] };
}

/** Sichtbarkeit [0,1] eines Phasen-Copy-Blocks (weich rein/raus).
 *  winter2 räumt früher (0.66–0.76) — die Auflösung (ab 0.78) übernimmt. */
export function hmCopyWeight(phase: HmPhase, p: number): number {
  const cur = hmPhaseT(p);
  if (cur.phase !== phase) return 0;
  const inn = smoothstep(cur.t / 0.14);
  const out =
    phase === "winter2"
      ? 1 - smoothstep((cur.t - 0.66) / 0.1)
      : 1 - smoothstep((cur.t - 0.82) / 0.16);
  return Math.min(inn, out);
}

/** Sichtbarkeit [0,1] der Beat-Karte i (nur winter2; bleibt stehen). */
export function hmBeatWeight(i: number, p: number): number {
  const { phase, t } = hmPhaseT(p);
  if (phase !== "winter2") return 0;
  const beat = HM_BEATS[i];
  if (!beat) return 0;
  /* Beats sind vollständig geräumt, bevor die Abrechnungs-Karte (0.78) kommt. */
  const fadeOut = 1 - smoothstep((t - (HM_RESOLVE_AT - 0.08)) / 0.06);
  return Math.min(smoothstep((t - beat.at) / 0.06), fadeOut);
}

/** Blinde Abrechnung (Karte 1): Klimax am Ende von winter1, weicht im Wechsel. */
export function hmBillBlindWeight(p: number): number {
  const { phase, t } = hmPhaseT(p);
  if (phase === "winter1") return smoothstep((t - 0.66) / 0.12);
  if (phase === "wechsel") return 1 - smoothstep(t / 0.3);
  return 0;
}

/** Transparente Abrechnung (Karte 2) + Schlusszeilen: Auflösung winter2. */
export function hmResolveWeight(p: number): number {
  const { phase, t } = hmPhaseT(p);
  if (phase !== "winter2") return 0;
  return smoothstep((t - HM_RESOLVE_AT) / 0.1);
}

/** WP-Still (Wechsel): steigt im Wechsel, weicht früh in winter2. */
export function hmPumpWeight(p: number): number {
  const { phase, t } = hmPhaseT(p);
  if (phase === "wechsel") return smoothstep(t / 0.35);
  if (phase === "winter2") return 1 - smoothstep(t / 0.12);
  return 0;
}

/** Tauwetter-Still: trägt die Auflösung ab HM_RESOLVE_AT. */
export function hmThawWeight(p: number): number {
  return hmResolveWeight(p);
}

/** Kalt-Wash (blau): voll in winter1, weicht im Wechsel, weg in winter2. */
export function hmColdWeight(p: number): number {
  const { phase, t } = hmPhaseT(p);
  if (phase === "winter1") return 1;
  if (phase === "wechsel") return 1 - smoothstep(t);
  return 0;
}

/** Warm-Wash (Heat-Akzent): wächst im Wechsel, bleibt in winter2. */
export function hmWarmWeight(p: number): number {
  const { phase, t } = hmPhaseT(p);
  if (phase === "wechsel") return smoothstep(t);
  if (phase === "winter2") return 1;
  return 0;
}

/** Datenlayer (Chips/Kurve): fährt im Wechsel hoch, trägt winter2. */
export function hmDataWeight(p: number): number {
  const { phase, t } = hmPhaseT(p);
  if (phase === "wechsel") return 0.4 * smoothstep((t - 0.5) / 0.5);
  if (phase === "winter2")
    return Math.min(
      0.4 + 0.6 * smoothstep(t / 0.1),
      1 - 0.6 * hmResolveWeight(p)
    );
  return 0;
}

/** rAF-Loop (Dev: läuft bei verstecktem Tab als Timer weiter). */
export function hmFrameLoop(cb: (now: number) => void): () => void {
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
