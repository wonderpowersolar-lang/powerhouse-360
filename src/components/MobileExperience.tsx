"use client";

import Image from "next/image";
import { SECTIONS } from "@/content/sections";
import { sceneImage } from "@/config/scenes";
import { useTheme } from "./theme/useTheme";
import { ButtonLink } from "./ui/Button";
import DashboardOverlay from "./DashboardOverlay";
import ProductPanel from "./ProductPanel";
import ResidentsOverlay from "./ResidentsOverlay";

/**
 * Mobile / reduced-motion experience.
 *
 * No heavy scroll-pinned 3D. The SAME photoreal station renders as the desktop
 * image stage (public/stations/*), now as the card visual for each chapter, then
 * the German copy + product card below. Fully photoreal, fast: the hero image is
 * priority-loaded and every card image is lazy (below the fold). The story reads
 * top-to-bottom.
 */
export default function MobileExperience() {
  const theme = useTheme();
  const [hero, ...rest] = SECTIONS;
  const heroImg = hero.image ?? sceneImage(hero.id, theme);

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
        {/* photoreal master building (same hero render as the desktop stage) */}
        <div className="relative mx-auto mb-8 aspect-[4/3] w-full overflow-hidden rounded-3xl border border-white/10">
          <Image
            src={heroImg}
            alt="POWERHOUSE360 Mehrfamilienhaus in der Abenddämmerung"
            fill
            priority
            sizes="(max-width: 768px) 92vw, 480px"
            className="object-cover"
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#090f1a] via-[#090f1a]/40 to-transparent" />
        </div>

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
        {rest.map((s) => {
          const cardImg = s.image ?? sceneImage(s.id, theme);
          // The dashboard card shows the full DOM dashboard (its own hero) over a
          // dimmed tower; every other station leads with its photoreal render.
          const showImg = cardImg && s.id !== "dashboard";
          return (
          <section
            key={s.id}
            id={s.id}
            className="scroll-mt-24 overflow-hidden rounded-3xl border border-white/8 bg-white/[0.03] backdrop-blur-sm"
            aria-labelledby={`m-${s.id}-h`}
          >
            {showImg && (
              <div className="relative aspect-[16/10] w-full overflow-hidden">
                <Image
                  src={cardImg}
                  alt={`${s.kicker} — ${s.headline}`}
                  fill
                  loading="lazy"
                  sizes="(max-width: 768px) 92vw, 480px"
                  className="object-cover"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0d1626] via-[#0d1626]/10 to-transparent" />
                {/* station numeral over the image (Razorpay leitmotif) */}
                {s.panel?.number && (
                  <span
                    aria-hidden
                    className="absolute bottom-2 right-3 select-none text-4xl font-bold tabular-nums text-white/85 drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]"
                  >
                    {s.panel.number}
                  </span>
                )}
              </div>
            )}
            <div className="p-6">
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
            </div>
          </section>
          );
        })}
      </div>
    </div>
  );
}
