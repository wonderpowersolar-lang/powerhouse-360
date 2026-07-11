import Image from "next/image";
import { ButtonLink } from "@/components/ui/Button";
import { HM_FINAL, HM_IMAGE } from "@/content/heatmieter";

/**
 * HeatCta — Akt 4: Abschluss über der Tauwetter-Fassade im Morgenlicht.
 */
export default function HeatCta() {
  return (
    <section
      id="kontakt"
      className="relative overflow-hidden bg-navy-900"
      aria-labelledby="heat-cta-h"
    >
      <div className="absolute inset-0">
        <Image
          src={HM_IMAGE.thaw}
          alt=""
          fill
          loading="lazy"
          sizes="100vw"
          unoptimized
          className="object-cover opacity-55"
          draggable={false}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-navy-900 via-navy-900/55 to-navy-900/85" />
      </div>

      <div className="relative mx-auto flex w-full max-w-4xl flex-col items-center px-5 py-28 text-center sm:px-8 md:py-36">
        <p
          className="mb-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em]"
          style={{ color: "var(--color-mod-heat)" }}
        >
          <span className="h-px w-8 bg-current opacity-60" />
          {HM_FINAL.kicker}
          <span className="h-px w-8 bg-current opacity-60" />
        </p>
        <h2
          id="heat-cta-h"
          className="text-legible text-3xl font-bold leading-[1.1] text-ink sm:text-4xl md:text-[2.9rem]"
        >
          {HM_FINAL.headline}
        </h2>
        <p className="text-legible mx-auto mt-5 max-w-2xl text-base leading-relaxed text-ink-dim sm:text-lg">
          {HM_FINAL.subline}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {HM_FINAL.cta.map((c) => (
            <ButtonLink key={c.label} href={c.href} variant={c.variant}>
              {c.label}
            </ButtonLink>
          ))}
        </div>
        <p className="mt-6 text-sm text-ink-faint">{HM_FINAL.support}</p>
      </div>
    </section>
  );
}
