import Image from "next/image";
import { ButtonLink } from "@/components/ui/Button";
import { SM_HERO, SM_IMAGE } from "@/content/smokemieter";

/**
 * SmokeHero — Akt 1, klassischer Einstieg: Marke, Value Prop und CTAs sind
 * ohne Scroll-Zwang lesbar. Darunter beginnt der Story-Runway.
 */
export default function SmokeHero() {
  return (
    <section
      id="start"
      className="relative flex min-h-dvh w-full items-center overflow-hidden bg-navy-900"
      aria-labelledby="smoke-hero-h"
    >
      <Image
        src={SM_IMAGE.night}
        alt="Mehrfamilienhaus bei Nacht — ein einzelnes Fenster leuchtet warm"
        fill
        priority
        sizes="100vw"
        unoptimized
        className="object-cover"
        draggable={false}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-navy-900/85 via-navy-900/40 to-navy-900/20" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-navy-900 to-transparent" />

      <div className="relative mx-auto w-full max-w-7xl px-5 pb-40 pt-28 sm:px-8 sm:pb-24">
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
            style={{ fontSize: "clamp(2.75rem, 8vw, 7rem)" }}
          >
            Smoke
            <span className="text-[color:var(--color-mod-smoke)]">Mieter</span>
          </h1>

          <p
            className="text-legible mt-4 text-xl font-semibold sm:text-2xl"
            style={{ color: "var(--color-mod-smoke)" }}
          >
            {SM_HERO.headlineAccent}
          </p>

          <p className="text-legible mt-5 max-w-xl text-base leading-relaxed text-ink-dim sm:text-lg">
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

      {/* Scroll-Cue in die Story */}
      <div
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
    </section>
  );
}
