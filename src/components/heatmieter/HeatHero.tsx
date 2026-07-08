"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { ButtonLink } from "@/components/ui/Button";
import { HM_HERO, HM_IMAGE } from "@/content/heatmieter";
import { hmFrameLoop } from "@/lib/heatProgress";

/**
 * HeatHero — Akt 1 als cinematischer Einstieg: EIN sticky Push-in über einen
 * kurzen Runway. Beim Scrollen fährt die Winter-Fassade näher (scale 1→1.08),
 * die Copy driftet hoch und blendet aus — so „taucht" der Hero nahtlos in das
 * Story-Kino darunter (dieselbe Winter-Bildwelt). Poster trägt reduced-motion.
 */

const HERO_RUNWAY_VH = 175;

function smoothstep(t: number) {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
}

export default function HeatHero() {
  const sectionRef = useRef<HTMLElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const cueRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduced = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (reduced) return;

    let top = 0;
    let end = 1;
    const measure = () => {
      const el = sectionRef.current;
      if (!el) return;
      const y = window.scrollY;
      top = y + el.getBoundingClientRect().top;
      end = top + Math.max(1, el.offsetHeight - window.innerHeight);
    };

    const tick = () => {
      const p = Math.min(
        1,
        Math.max(0, (window.scrollY - top) / Math.max(1, end - top))
      );
      if (mediaRef.current) {
        const s = 1 + 0.08 * smoothstep(p);
        mediaRef.current.style.transform = `scale(${s.toFixed(4)})`;
      }
      if (copyRef.current) {
        const w = 1 - smoothstep((p - 0.32) / 0.34);
        copyRef.current.style.opacity = w.toFixed(3);
        copyRef.current.style.visibility = w < 0.015 ? "hidden" : "visible";
        copyRef.current.style.transform = `translateY(${(
          smoothstep((p - 0.32) / 0.34) * -30
        ).toFixed(2)}px)`;
      }
      if (cueRef.current) {
        cueRef.current.style.opacity = (
          1 - smoothstep((p - 0.05) / 0.12)
        ).toFixed(3);
      }
    };

    measure();
    const stop = hmFrameLoop(tick);
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
      aria-labelledby="heat-hero-h"
    >
      <div className="sticky top-0 h-dvh w-full overflow-hidden bg-navy-900">
        {/* Push-in-Medium */}
        <div
          ref={mediaRef}
          className="absolute inset-0 will-change-transform"
          style={{ transformOrigin: "58% 42%" }}
        >
          <Image
            src={HM_IMAGE.winter}
            alt="Mehrfamilienhaus im Winter bei Blue Hour — Schnee, warme Fenster, Wärmepumpe im Hof"
            fill
            priority
            sizes="100vw"
            unoptimized
            className="object-cover"
            draggable={false}
          />
        </div>

        {/* Lesbarkeits-Scrim */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-navy-900/80 via-navy-900/35 to-navy-900/10" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-navy-900/90 to-transparent" />

        {/* Copy */}
        <div
          ref={copyRef}
          className="absolute inset-0 flex items-center pb-28 pt-24 will-change-[transform,opacity]"
        >
          <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
            <div className="max-w-2xl">
              <p
                className="mb-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em]"
                style={{ color: "var(--color-mod-heat)" }}
              >
                <span className="h-px w-8 bg-current opacity-60" />
                {HM_HERO.kicker}
              </p>

              <h1
                id="heat-hero-h"
                className="text-legible font-bold leading-[0.98] tracking-tight text-ink"
                style={{ fontSize: "clamp(2.5rem, 6.5vw, 6rem)" }}
              >
                Heat
                <span className="text-[color:var(--color-mod-heat)]">
                  Mieter
                </span>
              </h1>

              <p
                className="text-legible mt-4 text-lg font-semibold sm:text-2xl"
                style={{ color: "var(--color-mod-heat)" }}
              >
                {HM_HERO.headlineAccent}
              </p>

              <p className="text-legible mt-5 max-w-lg text-[15px] leading-relaxed text-ink-dim sm:text-lg">
                {HM_HERO.subline}
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                {HM_HERO.cta.map((c) => (
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
            {HM_HERO.scrollHint}
          </span>
          <span className="relative block h-9 w-px overflow-hidden bg-white/15">
            <span
              className="scroll-cue absolute left-0 top-0 h-3.5 w-px"
              style={{ background: "var(--color-mod-heat)" }}
            />
          </span>
        </div>
      </div>
    </section>
  );
}
