import Image from "next/image";
import { ButtonLink } from "@/components/ui/Button";
import { HM_HERO, HM_IMAGE } from "@/content/heatmieter";

/**
 * HeatHero — Akt 1, klassisch: sofort lesbarer Hero über der Winter-Fassade.
 * Bewusst ohne Scrub (das Kino gehört der Story darunter) — der Hero IST
 * bildlich der erste Frame des ersten Winters.
 */
export default function HeatHero() {
  return (
    <section
      id="start"
      className="relative h-dvh w-full overflow-hidden bg-navy-900"
      aria-labelledby="heat-hero-h"
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

      {/* Lesbarkeits-Scrim */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-navy-900/80 via-navy-900/35 to-navy-900/10" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-navy-900/90 to-transparent" />

      {/* Copy */}
      <div className="absolute inset-0 flex items-center pb-28 pt-24">
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
    </section>
  );
}
