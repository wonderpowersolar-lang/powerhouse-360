"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import {
  HM_IMAGE,
  HM_STORY,
  HM_BEATS,
  HM_BILL_BLIND,
  HM_BILL_CLEAR,
  HM_DATA_UNITS,
  HM_STORY_FRAMES,
  hmStoryFramePath,
} from "@/content/heatmieter";
import {
  hmFrameIndex,
  hmPhaseT,
  hmTicker,
  hmCopyWeight,
  hmBeatWeight,
  hmBillBlindWeight,
  hmResolveWeight,
  hmPumpWeight,
  hmThawWeight,
  hmColdWeight,
  hmWarmWeight,
  hmDataWeight,
} from "@/lib/heatProgress";
import {
  hmCineGetReduced,
  hmCineFrameLoop,
  hmStoryProgress,
  hmStoryStageWeight,
} from "@/lib/heatCine";

/**
 * HeatStoryLayer — die Zwei-Winter-Story als Mega-Layer der fixierten Bühne.
 *
 * Rendert exakt die bestehende Story (Winter-Frame-Scrub auf Canvas, Kalt/Warm-
 * Washes, WP-/Tauwetter-Still, Datenlayer, Ticker, Copy, Abrechnungs-Karten,
 * Beats) — aber getrieben von `hmStoryProgress()` (aus dem Szenen-Float
 * remapped) statt dem alten Runway-Progress, und als Ganzes ein-/ausgeblendet
 * über `hmStoryStageWeight()` (Szenen 1–4). Die Story-Logik selbst
 * (lib/heatProgress) bleibt unverändert: dieselben reinen `hmXxx(p)`-Funktionen,
 * nur `p` kommt jetzt vom Szenen-Float. Desktop-only (Mobile: HeatStory).
 */

const ACCENT = "var(--color-mod-heat)";
const STAMP = "#cf4a2e";

function ss(t: number) {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
}

export default function HeatStoryLayer() {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pumpRef = useRef<HTMLDivElement>(null);
  const thawRef = useRef<HTMLDivElement>(null);
  const coldRef = useRef<HTMLDivElement>(null);
  const warmRef = useRef<HTMLDivElement>(null);
  const dataRef = useRef<HTMLDivElement>(null);
  const tickerRef = useRef<HTMLDivElement>(null);
  const w1CopyRef = useRef<HTMLDivElement>(null);
  const w1LineRefs = useRef<(HTMLParagraphElement | null)[]>([]);
  const wechselCopyRef = useRef<HTMLDivElement>(null);
  const w2CopyRef = useRef<HTMLDivElement>(null);
  const beatRefs = useRef<(HTMLDivElement | null)[]>([]);
  const billBlindRef = useRef<HTMLDivElement>(null);
  const billClearRef = useRef<HTMLDivElement>(null);
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

    const N = HM_STORY_FRAMES.count;
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
        img.src = hmStoryFramePath(idx + 1);
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
      const rm = hmCineGetReduced();
      const storyW = hmStoryStageWeight();

      /* Ganzen Layer ein-/ausblenden (Szenen 1–4). */
      if (rootRef.current) {
        rootRef.current.style.opacity = storyW.toFixed(3);
        rootRef.current.style.visibility = storyW < 0.012 ? "hidden" : "visible";
      }
      if (storyW < 0.012) return;

      const p = hmStoryProgress();
      const { phase, t } = hmPhaseT(p);

      /* Canvas-Scrub (pump/thaw decken ihn in wechsel/resolve ab) */
      if (!rm && framesRef.current.length) {
        const target = hmFrameIndex(p, HM_STORY_FRAMES.count);
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

      /* Stills + Washes + Datenlayer */
      const setLayer = (el: HTMLDivElement | null, w: number) => {
        if (!el) return;
        el.style.opacity = w.toFixed(3);
        el.style.visibility = w < 0.012 ? "hidden" : "visible";
      };
      setLayer(pumpRef.current, hmPumpWeight(p));
      setLayer(thawRef.current, hmThawWeight(p));
      if (coldRef.current)
        coldRef.current.style.opacity = (0.3 * hmColdWeight(p)).toFixed(3);
      if (warmRef.current)
        warmRef.current.style.opacity = (0.2 * hmWarmWeight(p)).toFixed(3);
      setLayer(dataRef.current, hmDataWeight(p));

      const resolveW = hmResolveWeight(p);

      /* Monats-Ticker (blendet zur Auflösung aus) */
      if (tickerRef.current) {
        const { winter, month } = hmTicker(p);
        const label = winter ? `WINTER ${winter} · ${month}` : "· · ·";
        if (tickerRef.current.textContent !== label)
          tickerRef.current.textContent = label;
        tickerRef.current.style.color =
          phase === "winter2" ? ACCENT : "rgba(240,244,252,0.72)";
        tickerRef.current.style.opacity = (1 - resolveW).toFixed(3);
      }

      /* Copy-Blöcke */
      setW(w1CopyRef.current, hmCopyWeight("winter1", p));
      HM_STORY.winter1.lines.forEach((_, k) => {
        const lw =
          phase === "winter1"
            ? ss((t - (0.14 + k * 0.2)) / 0.08) * (1 - ss((t - 0.82) / 0.16))
            : 0;
        setW(w1LineRefs.current[k], lw, 10);
      });
      setW(wechselCopyRef.current, hmCopyWeight("wechsel", p));
      setW(w2CopyRef.current, hmCopyWeight("winter2", p) * (1 - resolveW));

      /* Beats (Desktop-Stack) */
      HM_BEATS.forEach((_, i) => setW(beatRefs.current[i], hmBeatWeight(i, p), 18));

      /* Abrechnungs-Karten + Auflösung */
      setW(billBlindRef.current, hmBillBlindWeight(p), 16);
      setW(billClearRef.current, resolveW, 16);
      setW(resolveRef.current, resolveW, 20);
    };

    return hmCineFrameLoop(tick);
  }, []);

  return (
    <div
      ref={rootRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 will-change-[opacity]"
      style={{ opacity: 0, visibility: "hidden" }}
    >
      {/* 1 · winter-Still: Poster + reduced-motion-Fallback */}
      <div className="absolute inset-0">
        <Image
          src={HM_IMAGE.winter}
          alt=""
          fill
          priority
          sizes="100vw"
          unoptimized
          className="object-cover"
          draggable={false}
        />
      </div>

      {/* 2 · Canvas: Winter-Scrub (läuft in winter1 UND winter2) */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full transition-opacity duration-500 will-change-[opacity]"
        style={{ opacity: 0 }}
      />

      {/* 3 · Wärmepumpen-Still (Wechsel) */}
      <div
        ref={pumpRef}
        className="absolute inset-0 will-change-[opacity]"
        style={{ opacity: 0, visibility: "hidden" }}
      >
        <Image
          src={HM_IMAGE.pump}
          alt=""
          fill
          loading="lazy"
          sizes="100vw"
          unoptimized
          className="object-cover"
          draggable={false}
        />
      </div>

      {/* 4 · Tauwetter-Still (Auflösung) */}
      <div
        ref={thawRef}
        className="absolute inset-0 will-change-[opacity]"
        style={{ opacity: 0, visibility: "hidden" }}
      >
        <Image
          src={HM_IMAGE.thaw}
          alt=""
          fill
          loading="lazy"
          sizes="100vw"
          unoptimized
          className="object-cover"
          draggable={false}
        />
      </div>

      {/* 5 · Farb-Washes: kalt (winter1) / warm (ab Wechsel) */}
      <div
        ref={coldRef}
        className="pointer-events-none absolute inset-0 will-change-[opacity]"
        style={{
          opacity: 0,
          background:
            "linear-gradient(200deg, rgba(46,86,150,0.5) 0%, rgba(46,86,150,0.12) 55%, transparent 100%)",
        }}
      />
      <div
        ref={warmRef}
        className="pointer-events-none absolute inset-0 will-change-[opacity]"
        style={{
          opacity: 0,
          background:
            "linear-gradient(180deg, rgba(228,106,63,0.5) 0%, rgba(228,106,63,0.12) 60%, transparent 100%)",
        }}
      />

      {/* 6 · Datenlayer (winter2): Sparkline + Einheiten-Chips */}
      <div
        ref={dataRef}
        className="pointer-events-none absolute bottom-14 left-[8%] will-change-[opacity]"
        style={{ opacity: 0, visibility: "hidden" }}
      >
        <svg
          width="300"
          height="44"
          viewBox="0 0 300 44"
          fill="none"
          className="opacity-90"
        >
          <polyline
            points="0,34 30,30 60,31 90,24 120,26 150,18 180,22 210,12 240,16 270,10 300,13"
            stroke={ACCENT}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <div className="mt-3 flex flex-wrap gap-2">
          {HM_DATA_UNITS.map((u) => (
            <span
              key={u.label}
              className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-black/45 px-3 py-1.5 backdrop-blur-md"
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{
                  background:
                    u.state === "ok" ? "rgba(126,224,160,0.9)" : ACCENT,
                }}
              />
              <span className="font-mono text-[11px] tracking-wide text-ink-dim">
                {u.label}
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* 7 · Monats-Ticker */}
      <div
        ref={tickerRef}
        className="absolute left-1/2 top-[4.25rem] -translate-x-1/2 whitespace-nowrap font-mono text-xl font-semibold tabular-nums tracking-[0.18em] md:top-24 md:text-4xl"
        style={{
          color: "rgba(240,244,252,0.72)",
          textShadow: "0 2px 24px rgba(0,0,0,0.6)",
        }}
      >
        WINTER 1 · OKT
      </div>

      {/* 8 · Copy: winter1 (links) */}
      <div
        ref={w1CopyRef}
        className="absolute inset-x-5 top-[55%] -translate-y-1/2 sm:inset-x-8 lg:left-[8%] lg:right-auto lg:max-w-xl"
        style={{ opacity: 0, visibility: "hidden" }}
      >
        <p className="mb-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-ink-dim">
          <span className="h-px w-8 bg-current opacity-60" />
          {HM_STORY.winter1.kicker}
        </p>
        <h2 className="text-legible text-3xl font-bold leading-[1.08] text-ink sm:text-4xl lg:text-[2.9rem]">
          {HM_STORY.winter1.headline}
        </h2>
        <div className="mt-5 space-y-3">
          {HM_STORY.winter1.lines.map((line, k) => (
            <p
              key={line}
              ref={(el) => {
                w1LineRefs.current[k] = el;
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

      {/* 9 · Copy: wechsel (zentriert) */}
      <div
        ref={wechselCopyRef}
        className="absolute inset-x-5 top-1/2 -translate-y-1/2 text-center sm:inset-x-8"
        style={{ opacity: 0, visibility: "hidden" }}
      >
        <div className="mx-auto max-w-3xl">
          <p
            className="mb-4 inline-flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.22em]"
            style={{ color: ACCENT }}
          >
            <span className="h-px w-8 bg-current opacity-60" />
            {HM_STORY.wechsel.kicker}
            <span className="h-px w-8 bg-current opacity-60" />
          </p>
          <h2 className="text-legible text-3xl font-bold leading-[1.08] text-ink sm:text-4xl lg:text-[2.9rem]">
            {HM_STORY.wechsel.headline}
          </h2>
          <p className="text-legible mx-auto mt-5 max-w-2xl text-base leading-relaxed text-ink-dim sm:text-lg">
            {HM_STORY.wechsel.subline}
          </p>
        </div>
      </div>

      {/* 10 · Copy: winter2 (links) */}
      <div
        ref={w2CopyRef}
        className="absolute inset-x-5 top-[7rem] sm:inset-x-8 md:top-1/2 md:-translate-y-1/2 lg:left-[8%] lg:right-auto lg:max-w-md"
        style={{ opacity: 0, visibility: "hidden" }}
      >
        <p
          className="mb-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em]"
          style={{ color: ACCENT }}
        >
          <span className="h-px w-8 bg-current opacity-60" />
          {HM_STORY.winter2.kicker}
        </p>
        <h2 className="text-legible text-2xl font-bold leading-[1.08] text-ink sm:text-4xl lg:text-[2.9rem]">
          {HM_STORY.winter2.headline}
        </h2>
      </div>

      {/* 11 · Beats — Desktop-Stack rechts */}
      <div className="absolute right-[7%] top-1/2 flex w-[360px] -translate-y-1/2 flex-col gap-3">
        {HM_BEATS.map((b, i) => (
          <div
            key={b.month + b.at}
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
                {b.month}
              </span>
              <p className="text-legible text-sm leading-snug text-ink md:text-base">
                {b.text}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* 12 · Abrechnungs-Karte 1: blind (Klimax winter1) */}
      <div
        ref={billBlindRef}
        className="absolute right-[7%] top-1/2 w-[380px] -translate-y-1/2"
        style={{ opacity: 0, visibility: "hidden" }}
      >
        <BillBlindCard />
      </div>

      {/* 13 · Abrechnungs-Karte 2: transparent (Auflösung) */}
      <div
        ref={billClearRef}
        className="absolute right-[7%] top-1/2 w-[380px] -translate-y-1/2"
        style={{ opacity: 0, visibility: "hidden" }}
      >
        <BillClearCard />
      </div>

      {/* 14 · Auflösung */}
      <div
        ref={resolveRef}
        className="absolute inset-x-5 top-[42%] -translate-y-1/2 text-center sm:inset-x-8 md:inset-x-auto md:left-[8%] md:right-[36%] md:text-left"
        style={{ opacity: 0, visibility: "hidden" }}
      >
        <div className="mx-auto max-w-3xl md:mx-0">
          <h2 className="text-legible text-3xl font-bold leading-[1.1] text-ink sm:text-4xl lg:text-[2.9rem]">
            {HM_STORY.winter2.resolveHeadline}
          </h2>
          <p
            className="text-legible mt-6 max-w-2xl text-lg font-semibold leading-relaxed sm:text-xl"
            style={{ color: ACCENT }}
          >
            {HM_STORY.winter2.resolveSubline}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Abrechnungs-Karten (Dokument-Look) ── */

function BillBlindCard() {
  return (
    <div className="relative overflow-hidden rounded-xl border border-white/12 bg-black/55 p-5 backdrop-blur-md">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-dim">
          {HM_BILL_BLIND.title}
        </p>
        <p className="font-mono text-[11px] text-ink-faint">
          {HM_BILL_BLIND.subtitle}
        </p>
      </div>
      <div className="mt-4 space-y-2.5">
        {HM_BILL_BLIND.rows.map((r) => (
          <div
            key={r.label}
            className="flex items-baseline justify-between gap-4 border-b border-white/8 pb-2 text-sm"
          >
            <span className="text-ink-dim">{r.label}</span>
            <span className="italic text-ink-faint">{r.value}</span>
          </div>
        ))}
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rotate-[-10deg] rounded border-2 px-3 py-1.5 text-sm font-bold uppercase tracking-[0.2em]"
        style={{ borderColor: STAMP, color: STAMP }}
      >
        {HM_BILL_BLIND.stamp}
      </div>
    </div>
  );
}

function BillClearCard() {
  return (
    <div className="relative overflow-hidden rounded-xl border border-white/12 bg-black/55 p-5 backdrop-blur-md">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-dim">
          {HM_BILL_CLEAR.title}
        </p>
        <p className="font-mono text-[11px] text-ink-faint">
          {HM_BILL_CLEAR.subtitle}
        </p>
      </div>
      <div className="mt-4 space-y-2.5">
        {HM_BILL_CLEAR.rows.map((r) => (
          <div
            key={r.label}
            className="flex items-baseline justify-between gap-4 border-b border-white/8 pb-2 text-sm"
          >
            <span className="text-ink-dim">{r.label}</span>
            <span className="font-medium text-ink">{r.value}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex justify-end">
        <span
          className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]"
          style={{
            borderColor: "rgba(228,106,63,0.4)",
            background: "rgba(228,106,63,0.14)",
            color: ACCENT,
          }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: ACCENT }}
          />
          {HM_BILL_CLEAR.badge}
        </span>
      </div>
    </div>
  );
}
