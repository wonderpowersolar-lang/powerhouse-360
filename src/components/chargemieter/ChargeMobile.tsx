"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { ButtonLink } from "@/components/ui/Button";
import {
  CM_SCENES,
  CM_IMAGE,
  CM_CTA_SUPPORT,
  type CmScene,
} from "@/content/chargemieter";
import {
  ComplexityCloud,
  BenefitChips,
  OwnerPhases,
  AdminBoard,
  SessionCard,
  LoadBalanceViz,
  BillingFlow,
  FundingChecklist,
  JourneyList,
  DashboardPanel,
  OverlayStyles,
} from "./ChargeOverlays";

/**
 * Mobile /chargemieter: die Journey als starke, gestapelte Szenen mit
 * reduzierter Bewegung. Stills statt Scrub, statische Overlays (alles
 * sichtbar, sanftes Aufblenden per IntersectionObserver), gleiche Copy,
 * gleiche CTAs.
 */

/** Szenen-Bild fürs Mobile-Stacking (nur wo ein Motiv wirklich trägt). */
const MOBILE_MEDIA: Record<string, string | undefined> = {
  hero: CM_IMAGE.hero,
  loesung: CM_IMAGE.row,
  mieter: CM_IMAGE.plug,
  lastmanagement: CM_IMAGE.garage,
  cta: CM_IMAGE.cta,
};

function MobileOverlay({ scene }: { scene: CmScene }) {
  switch (scene.overlay) {
    case "complexity":
      return <ComplexityCloud />;
    case "benefits":
      return <BenefitChips />;
    case "phases":
      return <OwnerPhases />;
    case "adminboard":
      return <AdminBoard />;
    case "session":
      return <SessionCard />;
    case "loadbalance":
      return <LoadBalanceViz staticBalanced />;
    case "billing":
      return <BillingFlow />;
    case "funding":
      return <FundingChecklist />;
    case "journey":
      return <JourneyList />;
    case "dashboard":
      return <DashboardPanel />;
    default:
      return null;
  }
}

export default function ChargeMobile() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("is-visible");
        });
      },
      { threshold: 0.2 }
    );
    const els = rootRef.current?.querySelectorAll(".m-reveal");
    els?.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const hero = CM_SCENES[0];
  const rest = CM_SCENES.slice(1);

  return (
    <div ref={rootRef} className="relative bg-navy-900">
      {/* ── Hero ── */}
      <section
        id={hero.id}
        className="relative flex min-h-[100dvh] flex-col justify-end overflow-hidden"
        aria-labelledby="hero-h"
      >
        <Image
          src={CM_IMAGE.hero}
          alt="Elektroauto an einer Wallbox vor einem Mehrfamilienhaus bei Nacht"
          fill
          priority
          sizes="100vw"
          unoptimized
          className="object-cover"
          style={{ objectPosition: "62% 72%" }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(10,11,13,0.55) 0%, rgba(10,11,13,0.15) 40%, rgba(10,11,13,0.88) 88%)",
          }}
        />
        <div className="relative px-5 pb-14 pt-32">
          <p
            className="mb-3 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em]"
            style={{ color: "var(--color-mod-charge)" }}
          >
            <span
              className="h-px w-7"
              style={{ background: "var(--color-mod-charge)", opacity: 0.6 }}
            />
            {hero.kicker}
          </p>
          <h1
            id="hero-h"
            className="text-legible text-5xl font-bold leading-[1.0] tracking-tight text-ink"
          >
            Charge
            <span className="text-[color:var(--color-mod-charge)]">Mieter</span>
          </h1>
          <p
            className="text-legible mt-4 text-lg font-semibold leading-snug"
            style={{ color: "var(--color-mod-charge)" }}
          >
            {hero.headlineAccent}
          </p>
          <p className="text-legible mt-4 text-base leading-relaxed text-ink-dim">
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
        </div>
      </section>

      {/* ── Szenen ── */}
      {rest.map((scene) => {
        const media = MOBILE_MEDIA[scene.id];
        const isCta = scene.id === "cta";
        return (
          <section
            key={scene.id}
            id={scene.id}
            className={`relative overflow-hidden ${
              isCta ? "" : "border-t border-white/5"
            }`}
            aria-labelledby={`${scene.id}-h`}
          >
            {isCta && media && (
              <>
                <Image
                  src={media}
                  alt=""
                  fill
                  sizes="100vw"
                  unoptimized
                  loading="lazy"
                  className="object-cover"
                  aria-hidden
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(10,11,13,0.9) 0%, rgba(10,11,13,0.55) 45%, rgba(10,11,13,0.92) 100%)",
                  }}
                />
              </>
            )}

            <div
              className={`relative px-5 ${
                isCta ? "py-24 text-center" : "py-16"
              }`}
            >
              <div className="m-reveal">
                <div className="m-reveal-inner">
                  <p
                    className={`mb-3 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] ${
                      isCta ? "justify-center" : ""
                    }`}
                    style={{ color: "var(--color-mod-charge)" }}
                  >
                    <span
                      className="h-px w-7"
                      style={{
                        background: "var(--color-mod-charge)",
                        opacity: 0.6,
                      }}
                    />
                    {scene.kicker}
                  </p>
                  <h2
                    id={`${scene.id}-h`}
                    className="text-legible text-[1.7rem] font-bold leading-[1.12] text-ink"
                  >
                    {scene.headline}
                  </h2>
                  {scene.headlineAccent && (
                    <p
                      className="text-legible mt-2 text-xl font-semibold leading-snug"
                      style={{ color: "var(--color-mod-charge)" }}
                    >
                      {scene.headlineAccent}
                    </p>
                  )}
                  <p className="mt-4 text-[15px] leading-relaxed text-ink-dim">
                    {scene.subline}
                  </p>
                </div>
              </div>

              {/* Szenen-Bild */}
              {media && !isCta && (
                <div className="m-reveal mt-7">
                  <div className="m-reveal-inner relative aspect-[16/10] overflow-hidden rounded-2xl border border-white/8">
                    <Image
                      src={media}
                      alt=""
                      fill
                      sizes="100vw"
                      unoptimized
                      loading="lazy"
                      className="object-cover"
                      aria-hidden
                    />
                  </div>
                </div>
              )}

              {/* statisches Overlay */}
              {scene.overlay !== "none" && (
                <div className="m-reveal mt-7">
                  <div
                    className="m-reveal-inner flex justify-center"
                    data-on="1"
                    data-beat="2"
                  >
                    <MobileOverlay scene={scene} />
                  </div>
                </div>
              )}

              {/* CTAs */}
              {scene.cta && (
                <div className="m-reveal mt-8">
                  <div className="m-reveal-inner flex flex-col gap-3">
                    {scene.cta.map((c) => (
                      <ButtonLink
                        key={c.label}
                        href={c.href}
                        variant={c.variant}
                        className="w-full"
                      >
                        {c.label}
                      </ButtonLink>
                    ))}
                    {isCta && (
                      <p className="mt-3 text-sm text-ink-faint">
                        {CM_CTA_SUPPORT}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>
        );
      })}

      <OverlayStyles />
      <style jsx global>{`
        .m-reveal .m-reveal-inner {
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.7s var(--ease-calm),
            transform 0.7s var(--ease-calm);
        }
        .m-reveal.is-visible .m-reveal-inner {
          opacity: 1;
          transform: none;
        }
        @media (prefers-reduced-motion: reduce) {
          .m-reveal .m-reveal-inner {
            opacity: 1;
            transform: none;
            transition: none;
          }
        }
      `}</style>
    </div>
  );
}
