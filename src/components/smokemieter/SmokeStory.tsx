"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import {
  SM_IMAGE,
  SM_STORY,
  SM_BEATS,
  SM_STORY_FRAMES,
  smStoryFramePath,
} from "@/content/smokemieter";
import {
  smRawFloat,
  smGetReduced,
  smFrameLoop,
  smFrameIndex,
  smPhaseT,
  smClock,
  smCopyWeight,
  smBurnLineWeight,
  smBeatWeight,
  smResolveWeight,
  smAlarmWeight,
  smDangerWeight,
} from "@/lib/smokeProgress";

/**
 * SmokeStory — das Scroll-Kino der /smokemieter-Seite (Akt 2).
 *
 * Ein Runway (RUNWAY_VH) mit sticky Stage. Der Brand-Clip liegt als
 * Frame-Sequenz auf einem Canvas und wird in Phase »burn« vorwärts, in
 * »rewind« RÜCKWÄRTS gescrubbt — die Zeitumkehr ist reine Index-Inversion.
 * Phase »rescue« übernehmen Alarm-/Morgen-Stills mit Beat-Karten.
 * Layer-Stapel: burn-Still (Poster/reduced) → Canvas → alarm → dawn →
 * Farb-Washes → Grade → Uhr/Copy/Beats.
 */

const RUNWAY_VH = 800;
const ACCENT = "var(--color-mod-smoke)";
const DANGER = "#c22a18";

export default function SmokeStory() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const alarmRef = useRef<HTMLDivElement>(null);
  const dawnRef = useRef<HTMLDivElement>(null);
  const dangerRef = useRef<HTMLDivElement>(null);
  const amberRef = useRef<HTMLDivElement>(null);
  const clockRef = useRef<HTMLDivElement>(null);
  const burnCopyRef = useRef<HTMLDivElement>(null);
  const burnLineRefs = useRef<(HTMLParagraphElement | null)[]>([]);
  const rewindCopyRef = useRef<HTMLDivElement>(null);
  const rescueCopyRef = useRef<HTMLDivElement>(null);
  const beatRefs = useRef<(HTMLDivElement | null)[]>([]);
  const resolveRef = useRef<HTMLDivElement>(null);

  const framesRef = useRef<(HTMLImageElement | null)[]>([]);
  const drawnFrameRef = useRef(-1);
  const canvasOnRef = useRef(false);

  /* ── Frames streamen (nicht bei reduced motion / save-data) ── */
  useEffect(() => {
    const rm = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const conn = (
      navigator as Navigator & { connection?: { saveData?: boolean } }
    ).connection;
    if (rm || conn?.saveData) return;

    const N = SM_STORY_FRAMES.count;
    if (framesRef.current.length !== N)
      framesRef.current = new Array(N).fill(null);
    let disposed = false;
    let next = 0;
    let inFlight = 0;
    const CONCURRENCY = 6;

    const pump = () => {
      while (!disposed && inFlight < CONCURRENCY && next < N) {
        const idx = next++;
        if (framesRef.current[idx]) continue;
        inFlight++;
        const img = new window.Image();
        img.decoding = "async";
        img.onload = () => {
          framesRef.current[idx] = img;
          inFlight--;
          pump();
        };
        img.onerror = () => {
          inFlight--;
          pump();
        };
        img.src = smStoryFramePath(idx + 1);
      }
    };
    pump();
    return () => {
      disposed = true;
    };
  }, []);

  /* ── Canvas-Größe (DPR-gedeckelt) ── */
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const size = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      cv.width = Math.round(window.innerWidth * dpr);
      cv.height = Math.round(window.innerHeight * dpr);
      drawnFrameRef.current = -1;
    };
    size();
    window.addEventListener("resize", size);
    return () => window.removeEventListener("resize", size);
  }, []);

  /* ── Frame-Treiber ── */
  useEffect(() => {
    const draw = (idx: number) => {
      const cv = canvasRef.current;
      const img = framesRef.current[idx];
      if (!cv || !img) return;
      const ctx = cv.getContext("2d");
      if (!ctx) return;
      const cw = cv.width;
      const ch = cv.height;
      const iw = img.naturalWidth || 1;
      const ih = img.naturalHeight || 1;
      const sc = Math.max(cw / iw, ch / ih);
      const dw = iw * sc;
      const dh = ih * sc;
      ctx.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
      drawnFrameRef.current = idx;
      if (!canvasOnRef.current) {
        canvasOnRef.current = true;
        cv.style.opacity = "1";
      }
    };

    const setW = (el: HTMLElement | null, w: number, rise = 14) => {
      if (!el) return;
      el.style.opacity = w.toFixed(3);
      el.style.visibility = w < 0.012 ? "hidden" : "visible";
      el.style.transform = `translateY(${((1 - w) * rise).toFixed(2)}px)`;
    };

    const tick = () => {
      const rm = smGetReduced();
      const p = smRawFloat();
      const { phase } = smPhaseT(p);

      /* Canvas-Scrub (alarm/dawn decken ihn in rescue ab) */
      if (!rm && framesRef.current.length) {
        const target = smFrameIndex(p, SM_STORY_FRAMES.count);
        if (target !== drawnFrameRef.current) {
          let pick = -1;
          for (let k = target; k >= 0; k--) {
            if (framesRef.current[k]) {
              pick = k;
              break;
            }
          }
          if (pick >= 0 && pick !== drawnFrameRef.current) draw(pick);
        }
      }

      /* Stills + Washes */
      const alarmW = smAlarmWeight(p);
      const resolveW = smResolveWeight(p);
      if (alarmRef.current) {
        alarmRef.current.style.opacity = alarmW.toFixed(3);
        alarmRef.current.style.visibility =
          alarmW < 0.012 ? "hidden" : "visible";
      }
      if (dawnRef.current) {
        dawnRef.current.style.opacity = resolveW.toFixed(3);
        dawnRef.current.style.visibility =
          resolveW < 0.012 ? "hidden" : "visible";
      }
      if (dangerRef.current)
        dangerRef.current.style.opacity = (0.36 * smDangerWeight(p)).toFixed(3);
      if (amberRef.current)
        amberRef.current.style.opacity = (0.22 * resolveW).toFixed(3);

      /* Uhr */
      if (clockRef.current) {
        const { text, rewinding } = smClock(p);
        const label = rewinding ? `◀◀ ${text}` : text;
        if (clockRef.current.textContent !== label)
          clockRef.current.textContent = label;
        clockRef.current.style.color =
          phase === "burn"
            ? "#ff8a63"
            : phase === "rewind"
            ? "rgba(240,244,252,0.72)"
            : ACCENT;
      }

      /* Copy-Blöcke */
      setW(burnCopyRef.current, smCopyWeight("burn", p));
      SM_STORY.burn.lines.forEach((_, k) => {
        setW(burnLineRefs.current[k], smBurnLineWeight(k, p), 10);
      });
      setW(rewindCopyRef.current, smCopyWeight("rewind", p));
      const rescueCopyW =
        smCopyWeight("rescue", p) * (1 - smResolveWeight(p));
      setW(rescueCopyRef.current, rescueCopyW);

      /* Beats + Auflösung */
      SM_BEATS.forEach((_, i) => {
        setW(beatRefs.current[i], smBeatWeight(i, p), 18);
      });
      setW(resolveRef.current, resolveW, 20);
    };

    return smFrameLoop(tick);
  }, []);

  return (
    <section
      id="story"
      data-sm-story
      className="relative w-full"
      style={{ height: `${RUNWAY_VH}vh` }}
      aria-label="Die Geschichte einer Nacht — ohne und mit Rauchwarnmelder"
    >
      <div className="sticky top-0 h-dvh w-full overflow-hidden bg-navy-900">
        {/* 1 · burn-Still: Poster + reduced-motion-Fallback */}
        <div className="absolute inset-0">
          <Image
            src={SM_IMAGE.burn}
            alt="Mehrfamilienhaus bei Nacht — Feuerschein und Rauch hinter einem Fenster im dritten Obergeschoss"
            fill
            priority
            sizes="100vw"
            unoptimized
            className="object-cover"
            draggable={false}
          />
        </div>

        {/* 2 · Canvas: Brand-Scrub vorwärts/rückwärts */}
        <canvas
          ref={canvasRef}
          aria-hidden
          className="absolute inset-0 h-full w-full transition-opacity duration-500 will-change-[opacity]"
          style={{ opacity: 0 }}
        />

        {/* 3 · Alarm-Still (rescue) */}
        <div
          ref={alarmRef}
          aria-hidden
          className="absolute inset-0 will-change-[opacity]"
          style={{ opacity: 0, visibility: "hidden" }}
        >
          <Image
            src={SM_IMAGE.alarm}
            alt=""
            fill
            loading="lazy"
            sizes="100vw"
            unoptimized
            className="object-cover"
            draggable={false}
          />
        </div>

        {/* 4 · Morgen-Still (Auflösung) */}
        <div
          ref={dawnRef}
          aria-hidden
          className="absolute inset-0 will-change-[opacity]"
          style={{ opacity: 0, visibility: "hidden" }}
        >
          <Image
            src={SM_IMAGE.dawn}
            alt=""
            fill
            loading="lazy"
            sizes="100vw"
            unoptimized
            className="object-cover"
            draggable={false}
          />
        </div>

        {/* 5 · Farb-Washes */}
        <div
          ref={dangerRef}
          aria-hidden
          className="pointer-events-none absolute inset-0 will-change-[opacity]"
          style={{
            opacity: 0,
            background: `linear-gradient(180deg, ${DANGER}8c 0%, ${DANGER}26 55%, transparent 100%)`,
          }}
        />
        <div
          ref={amberRef}
          aria-hidden
          className="pointer-events-none absolute inset-0 will-change-[opacity]"
          style={{
            opacity: 0,
            background:
              "linear-gradient(180deg, rgba(232,151,60,0.5) 0%, rgba(232,151,60,0.12) 60%, transparent 100%)",
          }}
        />

        {/* 6 · Grade: Tiefen-Wash + Vignette (Muster ChargeStage) */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(6,7,9,0.4) 0%, rgba(6,7,9,0) 28%, rgba(6,7,9,0) 62%, rgba(6,7,9,0.55) 100%)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(125% 100% at 50% 44%, transparent 52%, rgba(6,7,9,0.55) 100%)",
          }}
        />

        {/* 7 · Uhr */}
        <div
          ref={clockRef}
          aria-hidden
          className="absolute left-1/2 top-[5.5rem] -translate-x-1/2 font-mono text-3xl font-semibold tabular-nums tracking-[0.18em] sm:top-24 sm:text-5xl"
          style={{ color: "#ff8a63", textShadow: "0 2px 24px rgba(0,0,0,0.6)" }}
        >
          03:12
        </div>

        {/* 8 · Copy: burn (links) */}
        <div
          ref={burnCopyRef}
          className="absolute inset-x-5 top-1/2 -translate-y-1/2 sm:inset-x-8 lg:left-[8%] lg:right-auto lg:max-w-xl"
          style={{ opacity: 0, visibility: "hidden" }}
        >
          <p
            className="mb-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em]"
            style={{ color: "#ff8a63" }}
          >
            <span className="h-px w-8 bg-current opacity-60" />
            {SM_STORY.burn.kicker}
          </p>
          <h2 className="text-legible text-3xl font-bold leading-[1.08] text-ink sm:text-4xl lg:text-[2.9rem]">
            {SM_STORY.burn.headline}
          </h2>
          <div className="mt-5 space-y-3">
            {SM_STORY.burn.lines.map((line, k) => (
              <p
                key={line}
                ref={(el) => {
                  burnLineRefs.current[k] = el;
                }}
                className={`text-legible text-lg leading-relaxed sm:text-xl ${
                  k === 1 ? "font-semibold text-ink" : "text-ink-dim"
                }`}
                style={{ opacity: 0 }}
              >
                {line}
              </p>
            ))}
          </div>
        </div>

        {/* 9 · Copy: rewind (zentriert) */}
        <div
          ref={rewindCopyRef}
          className="absolute inset-x-5 top-1/2 -translate-y-1/2 text-center sm:inset-x-8"
          style={{ opacity: 0, visibility: "hidden" }}
        >
          <div className="mx-auto max-w-3xl">
            <p className="mb-4 inline-flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-ink-dim">
              <span className="h-px w-8 bg-current opacity-60" />
              {SM_STORY.rewind.kicker}
              <span className="h-px w-8 bg-current opacity-60" />
            </p>
            <h2 className="text-legible text-3xl font-bold leading-[1.08] text-ink sm:text-4xl lg:text-[2.9rem]">
              {SM_STORY.rewind.headline}
            </h2>
            <p className="text-legible mx-auto mt-5 max-w-2xl text-base leading-relaxed text-ink-dim sm:text-lg">
              {SM_STORY.rewind.subline}
            </p>
          </div>
        </div>

        {/* 10 · Copy: rescue (links) + Beat-Karten */}
        <div
          ref={rescueCopyRef}
          className="absolute inset-x-5 top-[22%] sm:inset-x-8 lg:left-[8%] lg:right-auto lg:top-1/2 lg:max-w-md lg:-translate-y-1/2"
          style={{ opacity: 0, visibility: "hidden" }}
        >
          <p
            className="mb-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em]"
            style={{ color: ACCENT }}
          >
            <span className="h-px w-8 bg-current opacity-60" />
            {SM_STORY.rescue.kicker}
          </p>
          <h2 className="text-legible text-3xl font-bold leading-[1.08] text-ink sm:text-4xl lg:text-[2.9rem]">
            {SM_STORY.rescue.headline}
          </h2>
        </div>

        <div className="absolute inset-x-5 bottom-16 flex flex-col gap-3 sm:inset-x-8 md:inset-x-auto md:bottom-auto md:right-[7%] md:top-1/2 md:w-[360px] md:-translate-y-1/2">
          {SM_BEATS.map((b, i) => (
            <div
              key={b.clock + b.at}
              ref={(el) => {
                beatRefs.current[i] = el;
              }}
              className="rounded-xl border border-white/12 bg-black/45 px-4 py-3 backdrop-blur-md"
              style={{ opacity: 0, visibility: "hidden" }}
            >
              <div className="flex items-baseline gap-3">
                <span
                  className="shrink-0 font-mono text-sm font-semibold tabular-nums"
                  style={{ color: ACCENT }}
                >
                  {b.clock}
                </span>
                <p className="text-legible text-sm leading-snug text-ink sm:text-base">
                  {b.text}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* 11 · Auflösung (Morgen) */}
        <div
          ref={resolveRef}
          className="absolute inset-x-5 top-1/2 -translate-y-1/2 text-center sm:inset-x-8"
          style={{ opacity: 0, visibility: "hidden" }}
        >
          <div className="mx-auto max-w-3xl">
            <h2 className="text-legible text-3xl font-bold leading-[1.1] text-ink sm:text-4xl lg:text-[2.9rem]">
              {SM_STORY.rescue.resolveHeadline}
            </h2>
            <p
              className="text-legible mx-auto mt-6 max-w-2xl text-lg font-semibold leading-relaxed sm:text-xl"
              style={{ color: ACCENT }}
            >
              {SM_STORY.rescue.resolveSubline}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
