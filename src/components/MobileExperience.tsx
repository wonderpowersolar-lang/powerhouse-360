"use client";

import Image from "next/image";
import { SECTIONS, ACCENT_VAR } from "@/content/sections";
import { STATION_IMAGE } from "@/config/stage";
import { ButtonLink } from "./ui/Button";
import QuietSections from "./QuietSections";

/**
 * Mobile / reduced-motion experience — a deliberately designed vertical
 * story, not a compressed desktop. The SAME noir Higgsfield renders lead
 * each chapter as a card visual, followed by the staccato copy. The quiet
 * sections and the final CTA close the page. The hero image is
 * priority-loaded; every card image below the fold is lazy.
 */
export default function MobileExperience() {
  const hero = SECTIONS[0];
  const journey = SECTIONS.filter((s) => s.id !== "hero" && s.id !== "cta");
  const cta = SECTIONS.find((s) => s.id === "cta")!;
  const heroImg = hero.image ?? STATION_IMAGE[hero.id];
  const ctaImg = cta.image ?? STATION_IMAGE[cta.id];

  return (
    <div className="relative mx-auto max-w-2xl bg-navy-900">
      {/* ── hero ── */}
      <section
        id={hero.id}
        className="relative overflow-hidden px-5 pb-14 pt-24"
        aria-labelledby="m-hero-h"
      >
        <div
          className="absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(120% 70% at 50% 0%, #131416 0%, #0a0b0d 70%)",
          }}
        />
        <div className="relative mx-auto mb-8 aspect-[16/11] w-full overflow-hidden rounded-3xl border border-white/10">
          <Image
            src={heroImg}
            alt="Powerhouse 360 — Mehrfamilienhaus auf schwarzem Sockel im Studio-Licht"
            fill
            priority
            sizes="(max-width: 768px) 92vw, 480px"
            unoptimized
            className="object-cover"
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-navy-900 via-navy-900/40 to-transparent" />
        </div>

        <h1
          id="m-hero-h"
          className="text-legible text-[2.6rem] font-bold leading-[1.02] tracking-tight text-ink"
        >
          {hero.headline.endsWith("360") ? (
            <>
              {hero.headline.slice(0, -3)}
              <span className="brand-gradient-text">360</span>
            </>
          ) : (
            hero.headline
          )}
        </h1>
        {hero.headlineAccent && (
          <p className="mt-3 text-lg font-medium text-gold-soft">
            {hero.headlineAccent}
          </p>
        )}
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

      {/* ── journey chapter cards ── */}
      <div className="space-y-4 px-5 pb-16">
        {journey.map((s) => {
          const cardImg = s.image ?? STATION_IMAGE[s.id];
          const accent = ACCENT_VAR[s.accent ?? "gold"];
          return (
            <section
              key={s.id}
              id={s.id}
              className="scroll-mt-24 overflow-hidden rounded-3xl border border-white/8 bg-white/[0.03]"
              aria-labelledby={`m-${s.id}-h`}
            >
              {cardImg && (
                <div className="relative aspect-[16/10] w-full overflow-hidden">
                  <Image
                    src={cardImg}
                    alt={`${s.kicker} — ${s.headline}`}
                    fill
                    loading="lazy"
                    sizes="(max-width: 768px) 92vw, 480px"
                    unoptimized
                    className="object-cover"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-navy-900 via-navy-900/10 to-transparent" />
                </div>
              )}
              <div className="p-6">
                <p
                  className="mb-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em]"
                  style={{ color: accent }}
                >
                  <span
                    className="h-px w-6"
                    style={{ background: accent, opacity: 0.6 }}
                  />
                  {s.kicker}
                </p>

                {s.lines ? (
                  <>
                    <h2
                      id={`m-${s.id}-h`}
                      className="text-2xl font-bold leading-snug text-ink"
                    >
                      {s.lines[0]}
                    </h2>
                    {s.lines.slice(1).map((ln) => (
                      <p
                        key={ln}
                        className="text-2xl font-bold leading-snug text-ink"
                      >
                        {ln}
                      </p>
                    ))}
                  </>
                ) : (
                  <>
                    <h2
                      id={`m-${s.id}-h`}
                      className="text-2xl font-bold leading-tight text-ink"
                    >
                      {s.headline.endsWith("360") ? (
                        <>
                          {s.headline.slice(0, -3)}
                          <span className="brand-gradient-text">360</span>
                        </>
                      ) : (
                        s.headline
                      )}
                    </h2>
                    {s.headlineAccent && (
                      <p className="mt-2 text-xl font-bold leading-tight text-gold">
                        {s.headlineAccent}
                      </p>
                    )}
                  </>
                )}

                {s.subline && (
                  <p className="mt-3 text-[15px] leading-relaxed text-ink-dim">
                    {s.subline}
                  </p>
                )}

                {s.cta && (
                  <div className="mt-5 flex flex-col gap-3">
                    {s.cta.map((c) => {
                      const ext = c.href.startsWith("http");
                      return (
                        <ButtonLink
                          key={c.label}
                          href={c.href}
                          variant={c.variant}
                          className="w-full"
                          target={ext ? "_blank" : undefined}
                          rel={ext ? "noopener noreferrer" : undefined}
                        >
                          {c.label}
                        </ButtonLink>
                      );
                    })}
                  </div>
                )}

              </div>
            </section>
          );
        })}
      </div>

      {/* ── quiet sections (§9–§12) ── */}
      <QuietSections />

      {/* ── final CTA ── */}
      <section
        id={cta.id}
        className="relative overflow-hidden"
        aria-labelledby="m-cta-h"
      >
        <div id="kontakt" aria-hidden className="absolute -top-20 left-0" />
        <div className="absolute inset-0">
          <Image
            src={ctaImg}
            alt=""
            fill
            loading="lazy"
            sizes="100vw"
            unoptimized
            className="object-cover"
            aria-hidden
          />
          <div className="absolute inset-0 bg-gradient-to-t from-navy-900 via-navy-900/55 to-navy-900/25" />
        </div>
        <div className="relative px-5 py-24">
          <h2
            id="m-cta-h"
            className="text-legible max-w-md text-3xl font-bold leading-[1.08] text-ink"
          >
            {cta.headline}
          </h2>
          <p className="text-legible mt-4 max-w-md text-[15px] leading-relaxed text-ink-dim">
            {cta.subline}
          </p>
          <div className="mt-7 flex flex-col gap-3">
            {cta.cta?.map((c) => (
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
        </div>
      </section>
    </div>
  );
}
