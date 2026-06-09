"use client";

import { SECTIONS } from "@/content/sections";
import { ButtonLink } from "./ui/Button";
import BuildingArt from "./BuildingArt";
import DashboardOverlay from "./DashboardOverlay";
import ProductPanel from "./ProductPanel";
import ResidentsOverlay from "./ResidentsOverlay";

/**
 * Mobile / reduced-motion experience.
 *
 * No heavy scroll-pinned 3D. A lightweight static SVG hero render of the
 * building, then the 8 chapters as normal stacked content cards with the full
 * German copy. The story still reads top-to-bottom and the page stays fast.
 */
export default function MobileExperience() {
  const [hero, ...rest] = SECTIONS;

  return (
    <div className="relative">
      {/* Static hero */}
      <section
        id={hero.id}
        className="relative overflow-hidden px-5 pb-12 pt-24"
        aria-labelledby="m-hero-h"
      >
        <div
          className="absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(120% 70% at 50% 0%, #16243f 0%, #0d1626 65%, #090f1a 100%)",
          }}
        />
        <BuildingArt className="mx-auto mb-8 h-72 w-auto" />

        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-brand-teal">
          {hero.kicker}
        </p>
        <h1
          id="m-hero-h"
          className="text-legible text-3xl font-bold leading-[1.1] text-ink"
        >
          {hero.headline}
        </h1>
        <p className="mt-4 text-base leading-relaxed text-ink-dim">
          {hero.subline}
        </p>
        <div className="mt-7 flex flex-col gap-3">
          {hero.cta?.map((c) => (
            <ButtonLink
              key={c.label}
              href={c.href}
              variant={c.variant}
              className="w-full"
            >
              {c.label}
            </ButtonLink>
          ))}
        </div>
      </section>

      {/* Stacked chapter cards */}
      <div className="space-y-4 px-5 pb-16">
        {rest.map((s) => (
          <section
            key={s.id}
            id={s.id}
            className="scroll-mt-24 rounded-3xl border border-white/8 bg-white/[0.03] p-6 backdrop-blur-sm"
            aria-labelledby={`m-${s.id}-h`}
          >
            <p className="mb-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-brand-teal">
              <span className="h-px w-6 bg-brand-teal/60" />
              {s.kicker}
            </p>
            <h2
              id={`m-${s.id}-h`}
              className="text-2xl font-bold leading-tight text-ink"
            >
              {s.headline}
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-ink-dim">
              {s.subline}
            </p>

            {/* simplified, static product card (no scroll coupling on mobile) */}
            {s.panel && (
              <ProductPanel
                panel={s.panel}
                index={s.index}
                side="left"
                reduceCoupling
              />
            )}

            {s.id === "residents" && (
              <div className="mt-5">
                <ResidentsOverlay />
              </div>
            )}

            {s.id === "dashboard" && (
              <div className="mt-5 [&_*]:text-left">
                <DashboardOverlay />
              </div>
            )}

            {s.cta && (
              <div className="mt-6 flex flex-col gap-3">
                {s.cta.map((c) => (
                  <ButtonLink
                    key={c.label}
                    href={c.href}
                    variant={c.variant}
                    className="w-full"
                  >
                    {c.label}
                  </ButtonLink>
                ))}
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
