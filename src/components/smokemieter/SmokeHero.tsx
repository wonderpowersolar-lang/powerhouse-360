"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { ButtonLink } from "@/components/ui/Button";
import {
  SM_HERO,
  SM_IMAGE,
  SM_HERO_FRAMES,
  smHeroFramePath,
} from "@/content/smokemieter";
import { smFrameLoop } from "@/lib/smokeProgress";

/**
 * SmokeHero — Akt 1 als Scroll-Kino (Stil ChargeMieter-Hero): Die Kamera
 * steigt beim Scrollen durch den nächtlichen Wohnraum zum wachenden Melder
 * (Frame-Scrub auf Canvas, Poster darunter). Marke, Value Prop und CTAs
 * liegen als Overlay auf der Stage und weichen dem Bild beim Scrubben.
 * Self-contained: eigener Runway + eigene Progress-Messung, unabhängig vom
 * Story-Store der Szenen darunter.
 */

const HERO_RUNWAY_VH = 260;
/** Der Scrub ist bei diesem Anteil des Hero-Bands abgeschlossen. */
const SCRUB_END = 0.85;

function smoothstep(t: number) {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
}

export default function SmokeHero() {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const cueRef = useRef<HTMLDivElement>(null);
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

    const N = SM_HERO_FRAMES.count;
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
        img.src = smHeroFramePath(idx + 1);
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

  /* ── Progress-Messung + Frame-Treiber ── */
  useEffect(() => {
    let top = 0;
    let end = 1;

    const measure = () => {
      const el = sectionRef.current;
      if (!el) return;
      const y = window.scrollY;
      top = y + el.getBoundingClientRect().top;
      end = top + Math.max(1, el.offsetHeight - window.innerHeight);
    };

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

    const tick = () => {
      const p = Math.min(
        1,
        Math.max(0, (window.scrollY - top) / Math.max(1, end - top))
      );

      /* Scrub */
      if (framesRef.current.length) {
        const t = smoothstep(Math.min(1, p / SCRUB_END));
        const target = Math.min(
          SM_HERO_FRAMES.count - 1,
          Math.round(t * (SM_HERO_FRAMES.count - 1))
        );
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

      /* Copy weicht dem Bild beim Scrubben; Cue verschwindet früher. */
      if (copyRef.current) {
        const w = 1 - smoothstep((p - 0.42) / 0.26);
        copyRef.current.style.opacity = w.toFixed(3);
        copyRef.current.style.visibility = w < 0.015 ? "hidden" : "visible";
        copyRef.current.style.transform = `translateY(${(
          smoothstep((p - 0.42) / 0.26) * -26
        ).toFixed(2)}px)`;
      }
      if (cueRef.current) {
        const w = 1 - smoothstep((p - 0.06) / 0.12);
        cueRef.current.style.opacity = w.toFixed(3);
      }
    };

    measure();
    const stop = smFrameLoop(tick);
    window.addEventListener("resize", measure);
    const ro = new ResizeObserver(measure);
    ro.observe(document.body);
    return () => {
      stop();
      window.removeEventListener("resize", measure);
      ro.disconnect();
    };
  }, []);

  return (
    <section
      id="start"
      ref={sectionRef}
      className="relative w-full"
      style={{ height: `${HERO_RUNWAY_VH}vh` }}
      aria-labelledby="smoke-hero-h"
    >
      <div className="sticky top-0 h-dvh w-full overflow-hidden bg-navy-900">
        {/* Poster (Start-Frame; trägt auch reduced-motion/save-data) */}
        <Image
          src={SM_IMAGE.heroNight}
          alt="Nächtlicher Wohnraum — an der Decke wacht der SmokeMieter-Rauchwarnmelder"
          fill
          priority
          sizes="100vw"
          unoptimized
          className="object-cover"
          draggable={false}
        />

        {/* Frame-Scrub */}
        <canvas
          ref={canvasRef}
          aria-hidden
          className="absolute inset-0 h-full w-full transition-opacity duration-500 will-change-[opacity]"
          style={{ opacity: 0 }}
        />

        {/* Lesbarkeits-Scrim */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-navy-900/80 via-navy-900/35 to-navy-900/10" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-navy-900/90 to-transparent" />

        {/* Copy-Overlay */}
        <div
          ref={copyRef}
          className="absolute inset-0 flex items-center pb-28 pt-24 will-change-[transform,opacity]"
        >
          <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
            <div className="max-w-2xl">
              <p
                className="mb-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em]"
                style={{ color: "var(--color-mod-smoke)" }}
              >
                <span className="h-px w-8 bg-current opacity-60" />
                {SM_HERO.kicker}
              </p>

              <h1
                id="smoke-hero-h"
                className="text-legible font-bold leading-[0.98] tracking-tight text-ink"
                style={{ fontSize: "clamp(2.5rem, 6.5vw, 6rem)" }}
              >
                Smoke
                <span className="text-[color:var(--color-mod-smoke)]">
                  Mieter
                </span>
              </h1>

              <p
                className="text-legible mt-4 text-lg font-semibold sm:text-2xl"
                style={{ color: "var(--color-mod-smoke)" }}
              >
                {SM_HERO.headlineAccent}
              </p>

              <p className="text-legible mt-5 max-w-lg text-[15px] leading-relaxed text-ink-dim sm:text-lg">
                {SM_HERO.subline}
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                {SM_HERO.cta.map((c) => (
                  <ButtonLink key={c.label} href={c.href} variant={c.variant}>
                    {c.label}
                  </ButtonLink>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Scroll-Cue */}
        <div
          ref={cueRef}
          aria-hidden
          className="pointer-events-none absolute bottom-7 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2.5"
        >
          <span className="max-w-[280px] text-center text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-dim sm:max-w-none">
            {SM_HERO.scrollHint}
          </span>
          <span className="relative block h-9 w-px overflow-hidden bg-white/15">
            <span
              className="scroll-cue absolute left-0 top-0 h-3.5 w-px"
              style={{ background: "var(--color-mod-smoke)" }}
            />
          </span>
        </div>
      </div>
    </section>
  );
}
