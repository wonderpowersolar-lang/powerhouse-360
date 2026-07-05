"use client";

import { useEffect, useRef } from "react";
import { ButtonLink } from "./ui/Button";
import { copyWeight } from "@/lib/scrollProgress";
import { sectionHeightVh } from "@/styles/motionTokens";
import { ACCENT_VAR, type SectionDef } from "@/content/sections";

/**
 * One station of the scroll journey.
 *
 * The <section> element itself is pure SCROLL RUNWAY (its height defines the
 * station's band). The visible copy lives in a FIXED overlay whose opacity is
 * driven per-frame from `copyWeight(index)` — perfectly static through the
 * hold, dissolving exactly when the stage travels. Staccato module lines
 * reveal in sequence once the station has settled (data-on threshold).
 * Only the final CTA section keeps `sticky` so the footer can push it out
 * naturally at the end of the page.
 */
export default function SectionPanel({
  section,
  children,
}: {
  section: SectionDef;
  children?: React.ReactNode;
}) {
  const layerRef = useRef<HTMLDivElement>(null);
  const isHero = section.index === 0;
  const isCta = section.id === "cta";
  const accent = ACCENT_VAR[section.accent ?? "gold"];
  /** ghost numeral for numbered module stations ("01 / Powermieter") */
  const numeral = /^\d\d\s\//.test(section.kicker)
    ? section.kicker.slice(0, 2)
    : undefined;

  // Per-frame copy visibility + the staggered line-reveal switch.
  useEffect(() => {
    if (isCta) return;
    let raf = 0;
    let on = false;
    const tick = () => {
      const el = layerRef.current;
      if (el) {
        const w = copyWeight(section.index);
        el.style.opacity = w.toFixed(3);
        el.style.visibility = w < 0.015 ? "hidden" : "visible";
        const nowOn = w > 0.42;
        if (nowOn !== on) {
          on = nowOn;
          el.dataset.on = nowOn ? "1" : "0";
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [section.index, isCta]);

  const alignClasses =
    section.align === "right"
      ? "items-center justify-end text-left"
      : section.align === "center"
      ? "items-center justify-center text-center"
      : "items-center justify-start text-left";

  // Directional scrim so the text side is darker than the scene side.
  const scrim =
    section.align === "right"
      ? "bg-gradient-to-l from-navy-900/85 via-navy-900/25 to-transparent"
      : section.align === "center"
      ? "bg-gradient-to-t from-navy-900/85 via-navy-900/20 to-navy-900/35"
      : "bg-gradient-to-r from-navy-900/85 via-navy-900/25 to-transparent";

  /** staccato display lines (modules) or the classic headline */
  const lines = section.lines;

  return (
    <section
      id={section.id}
      data-section={section.index}
      className="relative w-full"
      style={{ minHeight: `${sectionHeightVh(section.id)}vh` }}
      aria-labelledby={`${section.id}-h`}
    >
      {isCta && (
        <div id="kontakt" aria-hidden className="absolute -top-24 left-0" />
      )}
      <div
        ref={layerRef}
        data-on={section.index === 0 || isCta ? "1" : "0"}
        className={`${
          isCta ? "sticky" : "pointer-events-none fixed inset-x-0"
        } top-0 flex h-dvh w-full ${alignClasses}`}
        style={
          isCta
            ? undefined
            : {
                opacity: section.index === 0 ? 1 : 0,
                visibility: section.index === 0 ? "visible" : "hidden",
              }
        }
      >
        {/* directional scrim */}
        <div className={`pointer-events-none absolute inset-0 ${scrim}`} />

        <div
          className={`relative mx-auto flex w-full max-w-7xl px-5 sm:px-8 ${alignClasses}`}
        >
          <div
            className={`pointer-events-auto relative ${
              section.id === "dashboard"
                ? "w-full max-w-5xl"
                : section.align === "center"
                ? "max-w-3xl"
                : "max-w-xl"
            }`}
          >
            {/* ghost chapter numeral (module leitmotif) */}
            {numeral && (
              <span
                aria-hidden
                className="pointer-events-none absolute -left-2 select-none font-bold leading-none tracking-tight"
                style={{
                  fontSize: "clamp(110px, 10vw, 160px)",
                  opacity: 0.09,
                  top: "-0.95em",
                  color: accent,
                }}
              >
                {numeral}
              </span>
            )}

            {/* kicker */}
            {section.kicker && !isHero && (
              <p
                className="stagger relative mb-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em]"
                style={{ color: accent, transitionDelay: "40ms" }}
              >
                <span
                  className="h-px w-8"
                  style={{ background: accent, opacity: 0.6 }}
                />
                {section.kicker}
              </p>
            )}

            {/* headline block */}
            {isHero ? (
              <>
                <h1
                  id={`${section.id}-h`}
                  className="text-legible stagger font-bold leading-[0.98] tracking-tight text-ink"
                  style={{
                    fontSize: "clamp(3.2rem, 7.5vw, 6.5rem)",
                    transitionDelay: "80ms",
                  }}
                >
                  {section.headline.endsWith("360") ? (
                    <>
                      {section.headline.slice(0, -3)}
                      <span className="brand-gradient-text">360</span>
                    </>
                  ) : (
                    section.headline
                  )}
                </h1>
                {section.headlineAccent && (
                  <p
                    className="text-legible stagger mt-4 text-xl font-medium sm:text-2xl"
                    style={{ color: "var(--color-gold-soft)", transitionDelay: "180ms" }}
                  >
                    {section.headlineAccent}
                  </p>
                )}
              </>
            ) : lines && lines.length > 0 ? (
              <div aria-hidden={false}>
                <h2
                  id={`${section.id}-h`}
                  className="text-legible stagger font-bold leading-[1.12] text-ink"
                  style={{
                    fontSize: "clamp(1.9rem, 3.4vw, 3rem)",
                    transitionDelay: "100ms",
                  }}
                >
                  {lines[0]}
                </h2>
                {lines.slice(1).map((ln, k) => (
                  <p
                    key={ln}
                    className="text-legible stagger font-bold leading-[1.12] text-ink"
                    style={{
                      fontSize: "clamp(1.9rem, 3.4vw, 3rem)",
                      transitionDelay: `${180 + k * 90}ms`,
                    }}
                  >
                    {ln}
                  </p>
                ))}
              </div>
            ) : (
              <>
                <h2
                  id={`${section.id}-h`}
                  className={`text-legible stagger font-bold leading-[1.08] text-ink ${
                    section.align === "center"
                      ? "text-3xl sm:text-4xl md:text-[2.9rem]"
                      : "text-3xl sm:text-4xl lg:text-[3.1rem]"
                  }`}
                  style={{ transitionDelay: "100ms" }}
                >
                  {section.headline}
                </h2>
                {section.headlineAccent && (
                  <p
                    className={`text-legible stagger mt-3 font-bold leading-[1.1] ${
                      section.align === "center"
                        ? "text-2xl sm:text-3xl md:text-[2.2rem]"
                        : "text-2xl sm:text-3xl"
                    }`}
                    style={{
                      color: "var(--color-gold)",
                      transitionDelay: "200ms",
                    }}
                  >
                    {section.headlineAccent}
                  </p>
                )}
              </>
            )}

            {/* subline */}
            <p
              className={`text-legible stagger mt-5 text-base leading-relaxed text-ink-dim sm:text-lg ${
                section.align === "center" ? "mx-auto max-w-2xl" : "md:max-w-lg"
              }`}
              style={{ transitionDelay: lines ? `${220 + (lines.length - 1) * 90}ms` : "260ms" }}
            >
              {section.subline}
            </p>

            {/* CTAs */}
            {section.cta && (
              <div
                className={`stagger mt-8 flex flex-wrap gap-3 ${
                  section.align === "center" ? "justify-center" : ""
                }`}
                style={{ transitionDelay: "340ms" }}
              >
                {section.cta.map((c) => {
                  const ext = c.href.startsWith("http");
                  return (
                    <ButtonLink
                      key={c.label}
                      href={c.href}
                      variant={c.variant}
                      target={ext ? "_blank" : undefined}
                      rel={ext ? "noopener noreferrer" : undefined}
                    >
                      {c.label}
                    </ButtonLink>
                  );
                })}
              </div>
            )}

            {children && (
              <div className="stagger mt-8" style={{ transitionDelay: "300ms" }}>
                {children}
              </div>
            )}
          </div>
        </div>

        {/* Hero scroll prompt */}
        {isHero && (
          <div
            aria-hidden
            className="pointer-events-none absolute bottom-7 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2.5"
          >
            <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-dim">
              Entdecke das Powerhouse
            </span>
            <span className="relative block h-9 w-px overflow-hidden bg-white/15">
              <span className="scroll-cue absolute left-0 top-0 h-3.5 w-px bg-gold" />
            </span>
          </div>
        )}
      </div>

      {/* staggered line reveals — driven by the layer's data-on switch */}
      <style jsx>{`
        section :global(.stagger) {
          opacity: 0;
          transform: translateY(22px);
          transition: opacity 0.7s var(--ease-calm),
            transform 0.7s var(--ease-calm);
        }
        section :global([data-on="1"] .stagger) {
          opacity: 1;
          transform: none;
        }
        @media (prefers-reduced-motion: reduce) {
          section :global(.stagger) {
            opacity: 1;
            transform: none;
            transition: none;
          }
        }
      `}</style>
    </section>
  );
}
