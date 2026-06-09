"use client";

import { useRef } from "react";
import { ButtonLink } from "./ui/Button";
import ProductPanel from "./ProductPanel";
import type { SectionDef } from "@/content/sections";

/**
 * A single full-height scroll panel sitting OVER the pinned 3D scene.
 * Text fades/translates in via IntersectionObserver-driven CSS classes
 * (handled in DesktopExperience). Layout side is driven by `section.align`.
 *
 * A per-panel gradient scrim keeps headlines legible over the bright parts
 * of the scene (e.g. lit windows, glowing PV).
 */
export default function SectionPanel({
  section,
  children,
}: {
  section: SectionDef;
  children?: React.ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);

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
      ref={ref}
      data-section={section.index}
      className="reveal relative w-full"
      style={{ minHeight: "165vh" }}
      aria-labelledby={`${section.id}-h`}
    >
      {/* Sticky inner viewport so the copy + product card stay centred and in
          view through the whole tall section — this is what makes each station
          HOLD: the camera plateaus (scrollProgress) while this panel rests on
          screen for the extra scroll distance. */}
      <div className={`sticky top-0 flex h-dvh w-full ${alignClasses}`}>
        {/* directional scrim */}
        <div className={`pointer-events-none absolute inset-0 ${scrim}`} />

        <div className={`relative mx-auto flex w-full max-w-7xl px-5 sm:px-8 ${alignClasses}`}>
          <div
          className={`reveal-inner max-w-xl ${
            section.align === "center"
              ? section.id === "dashboard"
                ? "max-w-6xl"
                : "max-w-3xl"
              : ""
          }`}
        >
          <p className="mb-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-brand-teal">
            <span className="h-px w-8 bg-brand-teal/60" />
            {section.kicker}
          </p>

          <h2
            id={`${section.id}-h`}
            className="text-legible text-3xl font-bold leading-[1.08] text-ink sm:text-4xl md:text-5xl lg:text-[3.25rem]"
          >
            {section.headline}
          </h2>

          <p className="text-legible mt-5 text-base leading-relaxed text-ink-dim sm:text-lg md:max-w-lg">
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

          {/* Data-driven floating product card (scroll-coupled reveal). */}
          {section.panel && (
            <ProductPanel
              panel={section.panel}
              index={section.index}
              side={section.align}
            />
          )}

          {children}
          </div>
        </div>
      </div>
    </section>
  );
}
