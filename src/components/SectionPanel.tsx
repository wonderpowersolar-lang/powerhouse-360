"use client";

import { useEffect, useRef } from "react";
import { ButtonLink } from "./ui/Button";
import ProductPanel from "./ProductPanel";
import { copyWeight } from "@/lib/scrollProgress";
import { getFocusBlend } from "@/lib/focusStore";
import { sectionHeightVh } from "@/styles/motionTokens";
import type { SectionDef } from "@/content/sections";

/**
 * One station of the scroll story.
 *
 * The <section> element itself is pure SCROLL RUNWAY (its height defines the
 * station's band; heights from motionTokens: 190vh default, 220vh for hero /
 * heatmieter / dashboard). The visible stage copy lives in a FIXED overlay
 * whose opacity is driven per-frame from `copyWeight(index)` — NOT sticky:
 * sticky positioning can only pin for (H−100vh)/H of a band, which would
 * break the Explain beat (§5). With the fixed layer the copy is perfectly
 * static through Hold/Reveal/Explain and dissolves exactly when the camera
 * releases. Only the final CTA section keeps `sticky` so the footer can push
 * it out naturally at the end of the page.
 *
 * A per-station gradient scrim keeps headlines legible over the bright parts
 * of the scene. Each product station carries its big semi-transparent chapter
 * numeral ("03 /") behind the copy (Razorpay leitmotif); the hero shows the
 * NRG-style scroll prompt.
 */
export default function SectionPanel({
  section,
  children,
}: {
  section: SectionDef;
  children?: React.ReactNode;
}) {
  const layerRef = useRef<HTMLDivElement>(null);
  const isDashboard = section.id === "dashboard";
  const isCta = section.id === "cta";
  const numeral = section.panel?.number;

  // Per-frame copy visibility (fixed layers only — the CTA rides with flow).
  useEffect(() => {
    if (isCta) return;
    let raf = 0;
    const tick = () => {
      const el = layerRef.current;
      if (el) {
        // Fade the scroll-story copy out as the explorer flies a module in, so
        // the focused-module overlay reads cleanly (no hero copy bleeding
        // through), then fade it back as the camera returns to the overview.
        const w = copyWeight(section.index) * (1 - getFocusBlend());
        el.style.opacity = w.toFixed(3);
        el.style.visibility = w < 0.015 ? "hidden" : "visible";
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

  // Directional scrim so text side is darker than scene side.
  const scrim =
    section.align === "right"
      ? "bg-gradient-to-l from-navy-900/85 via-navy-900/30 to-transparent"
      : section.align === "center"
      ? "bg-gradient-to-t from-navy-900/85 via-navy-900/25 to-navy-900/40"
      : "bg-gradient-to-r from-navy-900/85 via-navy-900/30 to-transparent";

  return (
    <section
      id={section.id}
      data-section={section.index}
      className="reveal relative w-full"
      style={{ minHeight: `${sectionHeightVh(section.id)}vh` }}
      aria-labelledby={`${section.id}-h`}
    >
      <div
        ref={layerRef}
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
            className={`reveal-inner pointer-events-auto relative ${
              isDashboard
                ? "w-full max-w-7xl"
                : section.align === "center"
                ? "max-w-3xl"
                : "max-w-xl"
            }`}
          >
            {/* Big chapter numeral leitmotif — quiet background figure,
                absolutely positioned so it never pushes the copy (Razorpay). */}
            {numeral && (
              <span
                aria-hidden
                className={`pointer-events-none absolute select-none font-bold leading-none tracking-tight text-ink ${
                  isDashboard ? "left-1/2 -translate-x-1/2" : "-left-2"
                }`}
                style={{
                  fontSize: "clamp(96px, 9vw, 140px)",
                  opacity: 0.08,
                  top: "-0.92em",
                }}
              >
                {numeral}&thinsp;/
              </span>
            )}

            <p className="relative mb-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-brand-teal">
              <span className="h-px w-8 bg-brand-teal/60" />
              {section.kicker}
            </p>

            <h2
              id={`${section.id}-h`}
              className={`text-legible relative font-bold leading-[1.08] text-ink ${
                isDashboard
                  ? "text-3xl sm:text-4xl md:text-[2.75rem]"
                  : section.panel
                  ? "text-3xl sm:text-4xl lg:text-[2.75rem]"
                  : "text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem]"
              }`}
            >
              {section.headline}
            </h2>

            <p
              className={`text-legible mt-5 text-base leading-relaxed text-ink-dim sm:text-lg ${
                section.align === "center" ? "mx-auto max-w-2xl" : "md:max-w-lg"
              }`}
            >
              {section.subline}
            </p>

            {section.cta && (
              <div
                className={`mt-8 flex flex-wrap gap-3 ${
                  section.align === "center" ? "justify-center" : ""
                }`}
              >
                {section.cta.map((c) => (
                  <ButtonLink key={c.label} href={c.href} variant={c.variant}>
                    {c.label}
                  </ButtonLink>
                ))}
              </div>
            )}

            {isDashboard && section.panel ? (
              /* Platform station — Panel 07 beside the cropped app window. */
              <div className="mt-6 grid w-full items-start gap-6 text-left lg:grid-cols-[400px_minmax(0,1fr)]">
                <ProductPanel
                  panel={section.panel}
                  index={section.index}
                  side="left"
                />
                <div className="relative max-h-[58vh] overflow-hidden rounded-3xl">
                  {children}
                  {/* window crop fade — the platform clearly continues */}
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-navy-900/85 to-transparent" />
                </div>
              </div>
            ) : (
              <>
                {/* Data-driven floating product card (beat-coupled reveal). */}
                {section.panel && (
                  <ProductPanel
                    panel={section.panel}
                    index={section.index}
                    side={section.align}
                  />
                )}
                {children}
              </>
            )}
          </div>
        </div>

        {/* Hero scroll prompt (NRG pattern) */}
        {section.id === "hero" && (
          <div
            aria-hidden
            className="pointer-events-none absolute bottom-7 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2.5"
          >
            <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-dim">
              Scrollen, um das System zu entdecken
            </span>
            <span className="relative block h-9 w-px overflow-hidden bg-white/15">
              <span className="scroll-cue absolute left-0 top-0 h-3.5 w-px bg-brand-teal" />
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
