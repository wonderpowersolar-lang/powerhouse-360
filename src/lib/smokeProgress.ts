/**
 * SmokeMieter — Story-Progress-Store für /smokemieter.
 *
 * Ein einziger Scroll-Runway (Akt 2) mit drei Phasen:
 *   burn   [0 .. SM_PHASES.burnEnd)    — Brand-Frames vorwärts, Uhr vor
 *   rewind [burnEnd .. rewindEnd)      — dieselben Frames rückwärts, Uhr zurück
 *   rescue [rewindEnd .. 1]            — Alarm/Beats/Morgen-Auflösung
 *
 * Eigenständig neben lib/scrollProgress.ts (Homepage, N=9) und
 * lib/chargeProgress.ts (/chargemieter, N=12) — bewusste Parallel-Struktur.
 */

import {
  SM_PHASES,
  SM_CLOCK,
  SM_BEATS,
  SM_RESOLVE_AT,
} from "@/content/smokemieter";

const store = {
  /** raw Story-Progress [0,1]; -1 bis die Bridge misst. */
  raw: -1,
  reduced: false,
};

export function smSetRaw(v: number) {
  store.raw = Math.min(1, Math.max(0, v));
}
export function smSetReduced(v: boolean) {
  store.reduced = v;
}
export function smGetReduced() {
  return store.reduced;
}
export function smRawFloat(): number {
  return store.raw >= 0 ? store.raw : 0;
}

function clamp01(t: number) {
  return Math.min(1, Math.max(0, t));
}
function smoothstep(t: number) {
  const x = clamp01(t);
  return x * x * (3 - 2 * x);
}

export type SmPhase = "burn" | "rewind" | "rescue";

/** Fortschritt [0,1] innerhalb der jeweiligen Phase. */
export function smPhaseT(p: number): { phase: SmPhase; t: number } {
  const { burnEnd, rewindEnd } = SM_PHASES;
  if (p < burnEnd) return { phase: "burn", t: p / burnEnd };
  if (p < rewindEnd)
    return { phase: "rewind", t: (p - burnEnd) / (rewindEnd - burnEnd) };
  return { phase: "rescue", t: (p - rewindEnd) / (1 - rewindEnd) };
}

/**
 * Frame-Index [0..count-1] für den Brand-Scrub.
 * burn: vorwärts · rewind: rückwärts · rescue: Frame 0 (ausgeblendet).
 */
export function smFrameIndex(p: number, count: number): number {
  const { phase, t } = smPhaseT(p);
  const last = count - 1;
  if (phase === "burn") return Math.round(smoothstep(t) * last);
  if (phase === "rewind") return Math.round((1 - smoothstep(t)) * last);
  return 0;
}

/**
 * Uhranzeige "03:MM" (+ Rewind-Flag für das ◀◀-Präfix).
 * rescue folgt den Beat-Uhrzeiten aus SM_BEATS.
 */
export function smClock(p: number): { text: string; rewinding: boolean } {
  const { phase, t } = smPhaseT(p);
  const span = SM_CLOCK.peakMin - SM_CLOCK.startMin;
  let min = SM_CLOCK.startMin;
  let rewinding = false;
  if (phase === "burn") {
    min = SM_CLOCK.startMin + Math.round(smoothstep(t) * span);
  } else if (phase === "rewind") {
    min = SM_CLOCK.startMin + Math.round((1 - smoothstep(t)) * span);
    rewinding = true;
  } else {
    let clock = SM_BEATS[0].clock;
    for (const b of SM_BEATS) if (t >= b.at) clock = b.clock;
    return { text: clock, rewinding: false };
  }
  const h = String(SM_CLOCK.hour).padStart(2, "0");
  return { text: `${h}:${String(min).padStart(2, "0")}`, rewinding };
}

/** Sichtbarkeit [0,1] eines Phasen-Copy-Blocks (weich rein/raus). */
export function smCopyWeight(phase: SmPhase, p: number): number {
  const cur = smPhaseT(p);
  if (cur.phase !== phase) return 0;
  const inn = smoothstep(cur.t / 0.14);
  const out = phase === "rescue" ? 1 : 1 - smoothstep((cur.t - 0.82) / 0.16);
  return Math.min(inn, out);
}

/** Staffelung der burn-Zeilen: Zeile k blendet ab eigenem Fenster ein. */
export function smBurnLineWeight(k: number, p: number): number {
  const { phase, t } = smPhaseT(p);
  if (phase !== "burn") return 0;
  return smoothstep((t - (0.15 + k * 0.22)) / 0.1);
}

/** Sichtbarkeit [0,1] der Beat-Karte i (nur in rescue; bleibt stehen). */
export function smBeatWeight(i: number, p: number): number {
  const { phase, t } = smPhaseT(p);
  if (phase !== "rescue") return 0;
  const beat = SM_BEATS[i];
  if (!beat) return 0;
  const fadeOut = 1 - smoothstep((t - (SM_RESOLVE_AT + 0.04)) / 0.08);
  return Math.min(smoothstep((t - beat.at) / 0.06), fadeOut);
}

/** Sichtbarkeit [0,1] der Morgen-Auflösung (Bild + Schlusszeilen). */
export function smResolveWeight(p: number): number {
  const { phase, t } = smPhaseT(p);
  if (phase !== "rescue") return 0;
  return smoothstep((t - SM_RESOLVE_AT) / 0.1);
}

/** Alarm-Still-Deckkraft: trägt rescue bis zur Auflösung. */
export function smAlarmWeight(p: number): number {
  const { phase, t } = smPhaseT(p);
  if (phase !== "rescue") return 0;
  return Math.min(smoothstep(t / 0.08), 1 - smResolveWeight(p));
}

/** Roter Gefahren-Wash: wächst in burn, weicht in rewind, weg in rescue. */
export function smDangerWeight(p: number): number {
  const { phase, t } = smPhaseT(p);
  if (phase === "burn") return 0.25 + 0.75 * smoothstep(t);
  if (phase === "rewind") return 1 - smoothstep(t);
  return 0;
}

/** rAF-Loop (Dev: läuft bei verstecktem Tab als Timer weiter). */
export function smFrameLoop(cb: (now: number) => void): () => void {
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
