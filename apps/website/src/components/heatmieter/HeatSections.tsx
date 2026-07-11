"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { ButtonLink } from "@/components/ui/Button";
import {
  HM_SECTIONS,
  HM_ADMIN_WIDGETS,
  HM_BILL_CLEAR,
  HM_IMAGE,
  HM_VIDEO,
  type HmSection,
} from "@/content/heatmieter";
import { hmFrameLoop } from "@/lib/heatProgress";

/**
 * HeatSections — Akt 3: acht Sachsektionen mit durchgehender Scroll-Motion.
 * Reveal-Muster wie die Homepage (IntersectionObserver → `.is-in`), zusätzlich
 * ein sanfter Parallax auf den Medien: der lange Sachteil „lebt" beim Scrollen
 * statt statisch dazustehen. Unter prefers-reduced-motion: alles ruhig sichtbar.
 */

const ACCENT = "var(--color-mod-heat)";

function Points({ section }: { section: HmSection }) {
  if (!section.points) return null;
  const numbered = section.id === "ablauf";
  return (
    <ul
      className={
        numbered ? "mt-8 grid gap-3 sm:grid-cols-2" : "mt-6 space-y-3"
      }
    >
      {section.points.map((p, i) => (
        <li
          key={p}
          className="hm-reveal flex items-baseline gap-3"
          style={{ transitionDelay: `${120 + i * 70}ms` }}
        >
          {numbered ? (
            <span
              className="shrink-0 font-mono text-sm font-semibold tabular-nums"
              style={{ color: ACCENT }}
            >
              {String(i + 1).padStart(2, "0")}
            </span>
          ) : (
            <span
              aria-hidden
              className="h-1.5 w-1.5 shrink-0 translate-y-[-2px] rounded-full"
              style={{ background: ACCENT }}
            />
          )}
          <span className="text-legible text-base text-ink-dim sm:text-lg">
            {p}
          </span>
        </li>
      ))}
    </ul>
  );
}

function Media({ section }: { section: HmSection }) {
  if (
    !section.media &&
    section.id !== "plattform" &&
    section.id !== "abrechnung"
  )
    return null;

  if (section.id === "abrechnung") {
    return (
      <div className="hm-reveal w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.04] p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-faint">
          Beleg-Struktur
        </p>
        <dl className="mt-4 space-y-3">
          {HM_BILL_CLEAR.rows.map((r, i) => (
            <div
              key={r.label}
              className="hm-reveal flex items-baseline justify-between gap-4 border-b border-white/5 pb-3 last:border-b-0 last:pb-0"
              style={{ transitionDelay: `${120 + i * 70}ms` }}
            >
              <dt className="shrink-0 text-sm text-ink-faint">{r.label}</dt>
              <dd className="text-right text-sm font-semibold text-ink">
                {r.value}
              </dd>
            </div>
          ))}
        </dl>
        <div className="mt-4 flex items-center gap-2">
          <span
            aria-hidden
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: ACCENT }}
          />
          <span className="text-xs text-ink-dim">
            Grundlage für die Betriebskostenabrechnung
          </span>
        </div>
      </div>
    );
  }

  if (section.id === "plattform") {
    return (
      <div className="grid w-full max-w-md grid-cols-2 gap-3 sm:grid-cols-2">
        {HM_ADMIN_WIDGETS.map((w, i) => (
          <div
            key={w.label}
            className="hm-reveal rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3.5"
            style={{ transitionDelay: `${i * 80}ms` }}
          >
            <div className="flex items-center gap-2">
              <span
                aria-hidden
                className="h-1.5 w-1.5 rounded-full"
                style={{
                  background:
                    w.state === "warn"
                      ? "#e8b23c"
                      : w.state === "info"
                      ? "rgba(240,244,252,0.55)"
                      : ACCENT,
                }}
              />
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
                {w.label}
              </span>
            </div>
            <p className="mt-1.5 text-lg font-bold text-ink">{w.value}</p>
          </div>
        ))}
      </div>
    );
  }

  const img = section.media ? HM_IMAGE[section.media] : undefined;
  const vid = section.video ? HM_VIDEO[section.video] : undefined;
  if (!img) return null;

  return (
    <div className="hm-reveal relative aspect-[16/10] w-full max-w-lg overflow-hidden rounded-2xl border border-white/10">
      {/* Parallax-Ebene: leicht größer als der Rahmen, verschiebt beim Scrollen */}
      <div
        data-hm-par
        className="absolute inset-0 will-change-transform"
        style={{ transform: "scale(1.16)" }}
      >
        {vid ? (
          <video
            muted
            loop
            playsInline
            autoPlay
            preload="metadata"
            poster={img}
            aria-hidden
            tabIndex={-1}
            className="absolute inset-0 h-full w-full object-cover"
          >
            <source src={vid} type="video/mp4" />
          </video>
        ) : (
          <Image
            src={img}
            alt=""
            fill
            loading="lazy"
            sizes="(min-width: 1024px) 40vw, 90vw"
            unoptimized
            className="object-cover"
            draggable={false}
          />
        )}
      </div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-navy-900/40 to-transparent" />
    </div>
  );
}

export default function HeatSections() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reduced = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    // Reveal beim Reinscrollen
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.18, rootMargin: "0px 0px -8% 0px" }
    );
    root.querySelectorAll(".hm-reveal").forEach((el) => io.observe(el));

    if (reduced) return () => io.disconnect();

    // Sanfter Medien-Parallax
    const pars = Array.from(
      root.querySelectorAll<HTMLElement>("[data-hm-par]")
    );
    const stop = hmFrameLoop(() => {
      const vh = window.innerHeight || 1;
      for (const el of pars) {
        const r = el.getBoundingClientRect();
        if (r.bottom < -80 || r.top > vh + 80) continue;
        const center = r.top + r.height / 2;
        const rel = (center - vh / 2) / vh; // -0.5..0.5 im Viewport
        const shift = -rel * 42; // px
        el.style.transform = `scale(1.16) translate3d(0, ${shift.toFixed(
          1
        )}px, 0)`;
      }
    });

    return () => {
      io.disconnect();
      stop();
    };
  }, []);

  return (
    <div ref={rootRef} className="relative bg-navy-900">
      {HM_SECTIONS.map((s, i) => {
        const mediaNode = <Media section={s} />;
        const hasMedia =
          s.media || s.id === "plattform" || s.id === "abrechnung";
        const mediaRight = i % 2 === 0;

        return (
          <section
            key={s.id}
            id={s.id}
            className="border-t border-white/5"
            aria-labelledby={`${s.id}-h`}
          >
            <div
              className={`mx-auto flex w-full max-w-7xl flex-col gap-10 px-5 py-20 sm:px-8 md:py-28 ${
                hasMedia
                  ? `lg:items-center lg:gap-16 ${
                      mediaRight ? "lg:flex-row" : "lg:flex-row-reverse"
                    }`
                  : ""
              }`}
            >
              <div className={hasMedia ? "lg:w-1/2" : "max-w-3xl"}>
                <p
                  className="hm-reveal mb-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em]"
                  style={{ color: ACCENT }}
                >
                  <span className="h-px w-8 bg-current opacity-60" />
                  {s.kicker}
                </p>
                <h2
                  id={`${s.id}-h`}
                  className="hm-reveal text-legible text-3xl font-bold leading-[1.1] text-ink sm:text-4xl"
                  style={{ transitionDelay: "50ms" }}
                >
                  {s.headline}
                </h2>
                <p
                  className="hm-reveal text-legible mt-5 max-w-xl text-base leading-relaxed text-ink-dim sm:text-lg"
                  style={{ transitionDelay: "90ms" }}
                >
                  {s.subline}
                </p>
                <Points section={s} />
                {s.cta && (
                  <div
                    className="hm-reveal mt-8 flex flex-wrap gap-3"
                    style={{ transitionDelay: "140ms" }}
                  >
                    {s.cta.map((c) => (
                      <ButtonLink
                        key={c.label}
                        href={c.href}
                        variant={c.variant}
                      >
                        {c.label}
                      </ButtonLink>
                    ))}
                  </div>
                )}
              </div>
              {hasMedia && (
                <div className="flex lg:w-1/2 lg:justify-center">
                  {mediaNode}
                </div>
              )}
            </div>
          </section>
        );
      })}

      <style jsx>{`
        div :global(.hm-reveal) {
          opacity: 0;
          transform: translateY(28px);
          transition: opacity 0.7s cubic-bezier(0.22, 1, 0.36, 1),
            transform 0.7s cubic-bezier(0.22, 1, 0.36, 1);
        }
        div :global(.hm-reveal.is-in) {
          opacity: 1;
          transform: none;
        }
        @media (prefers-reduced-motion: reduce) {
          div :global(.hm-reveal) {
            opacity: 1;
            transform: none;
            transition: none;
          }
        }
      `}</style>
    </div>
  );
}
