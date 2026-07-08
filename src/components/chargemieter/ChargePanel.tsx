"use client";

import { useEffect, useRef } from "react";
import { ButtonLink } from "@/components/ui/Button";
import { cmCopyWeight, cmHoldWeight, cmFrameLoop } from "@/lib/chargeProgress";
import { CM_CTA_SUPPORT, type CmScene } from "@/content/chargemieter";
import {
  ComplexityCloud,
  BenefitChips,
  OwnerPhases,
  AdminBoard,
  SessionCard,
  LoadBalanceViz,
  BillingFlow,
  FundingChecklist,
  JourneyTimeline,
  DashboardPanel,
} from "./ChargeOverlays";

/**
 * Eine Szene der ChargeMieter-Journey.
 *
 * Das <section>-Element ist reine Scroll-Runway (Bandhöhe); die sichtbare
 * Copy + das Szenen-Overlay leben in einem FIXED Overlay, dessen Deckkraft
 * pro Frame aus `cmCopyWeight(index)` kommt. Zusätzlich taktet `data-beat`
 * (aus dem Hold-Gewicht) die zweistufigen Szenen-Animationen: 0 = Anfahrt,
 * 1 = Szene steht, 2 = tiefer Hold (Ordnung, Monatsübersicht, Phase 3 …).
 */
export default function ChargePanel({ scene }: { scene: CmScene }) {
  const layerRef = useRef<HTMLDivElement>(null);
  const isHero = scene.index === 0;
  const isCta = scene.id === "cta";
  const accent = "var(--color-mod-charge)";

  useEffect(() => {
    if (isCta) return;
    let on = false;
    let beat = -1;
    const tick = () => {
      const el = layerRef.current;
      if (el) {
        const w = cmCopyWeight(scene.index);
        el.style.opacity = w.toFixed(3);
        el.style.visibility = w < 0.015 ? "hidden" : "visible";
        const nowOn = w > 0.42;
        if (nowOn !== on) {
          on = nowOn;
          el.dataset.on = nowOn ? "1" : "0";
        }
        const h = cmHoldWeight(scene.index);
        const nowBeat = h > 0.82 ? 2 : h > 0.28 ? 1 : 0;
        if (nowBeat !== beat) {
          beat = nowBeat;
          el.dataset.beat = String(nowBeat);
        }
      }
    };
    return cmFrameLoop(tick);
  }, [scene.index, isCta]);

  const overlayNode = (() => {
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
        return <LoadBalanceViz sceneIndex={scene.index} />;
      case "billing":
        return <BillingFlow />;
      case "funding":
        return <FundingChecklist />;
      case "journey":
        return <JourneyTimeline sceneIndex={scene.index} />;
      case "dashboard":
        return <DashboardPanel />;
      default:
        return null;
    }
  })();

  const isCenter = scene.align === "center";
  const copyLeft = scene.align === "left";

  // Richtungs-Scrim: Textseite dunkler als Szenenseite.
  const scrim = isCenter
    ? "bg-gradient-to-t from-navy-900/85 via-navy-900/25 to-navy-900/35"
    : copyLeft
    ? "bg-gradient-to-r from-navy-900/85 via-navy-900/30 to-transparent"
    : "bg-gradient-to-l from-navy-900/85 via-navy-900/30 to-transparent";

  return (
    <section
      id={scene.id}
      data-cm-scene={scene.index}
      className="relative w-full"
      style={{ minHeight: `${scene.heightVh}vh` }}
      aria-labelledby={`${scene.id}-h`}
    >
      {isCta && (
        <div id="kontakt" aria-hidden className="absolute -top-24 left-0" />
      )}
      <div
        ref={layerRef}
        data-on={isHero || isCta ? "1" : "0"}
        data-beat={isHero || isCta ? "2" : "0"}
        className={`${
          isCta ? "sticky" : "pointer-events-none fixed inset-x-0"
        } top-0 flex h-dvh w-full flex-col justify-center ${
          isHero ? "" : "pt-[4.75rem]"
        }`}
        style={
          isCta
            ? undefined
            : {
                opacity: isHero ? 1 : 0,
                visibility: isHero ? "visible" : "hidden",
              }
        }
      >
        <div className={`pointer-events-none absolute inset-0 ${scrim}`} />

        <div
          className={`relative mx-auto flex w-full max-w-7xl px-5 sm:px-8 ${
            isCenter
              ? "flex-col items-center gap-10 text-center"
              : `items-center gap-12 ${
                  copyLeft ? "justify-between" : "flex-row-reverse justify-between"
                }`
          }`}
        >
          {/* ── Copy-Block ── */}
          <div
            className={`pointer-events-auto relative ${
              isCenter ? "max-w-3xl" : "max-w-xl shrink-0 lg:w-[44%]"
            }`}
          >
            {scene.kicker && (
              <p
                className="cm-rise relative mb-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em]"
                style={{ color: accent, transitionDelay: "40ms" }}
              >
                <span
                  className="h-px w-8"
                  style={{ background: accent, opacity: 0.6 }}
                />
                {scene.kicker}
              </p>
            )}

            {isHero ? (
              <h1
                id={`${scene.id}-h`}
                className="text-legible cm-rise font-bold leading-[0.98] tracking-tight text-ink"
                style={{
                  fontSize: "clamp(3.4rem, 8vw, 7rem)",
                  transitionDelay: "80ms",
                }}
              >
                Charge<span className="text-[color:var(--color-mod-charge)]">Mieter</span>
              </h1>
            ) : (
              <h2
                id={`${scene.id}-h`}
                className={`text-legible cm-rise font-bold text-ink ${
                  isCenter
                    ? "leading-[1.08] text-3xl sm:text-4xl md:text-[2.9rem]"
                    : "leading-[1.08] text-3xl sm:text-4xl lg:text-[2.9rem]"
                }`}
                style={{ transitionDelay: "100ms" }}
              >
                {scene.headline}
              </h2>
            )}

            {scene.headlineAccent && (
              <p
                className={`text-legible cm-rise mt-4 font-semibold ${
                  isHero
                    ? "text-xl sm:text-2xl"
                    : "text-2xl leading-[1.1] sm:text-3xl"
                }`}
                style={{ color: accent, transitionDelay: "200ms" }}
              >
                {scene.headlineAccent}
              </p>
            )}

            {scene.subline && (
              <p
                className={`text-legible cm-rise mt-5 text-base leading-relaxed text-ink-dim sm:text-lg ${
                  isCenter ? "mx-auto max-w-2xl" : "md:max-w-lg"
                }`}
                style={{ transitionDelay: "280ms" }}
              >
                {scene.subline}
              </p>
            )}

            {scene.cta && (
              <div
                className={`cm-rise mt-8 flex flex-wrap gap-3 ${
                  isCenter ? "justify-center" : ""
                }`}
                style={{ transitionDelay: "360ms" }}
              >
                {scene.cta.map((c) => (
                  <ButtonLink key={c.label} href={c.href} variant={c.variant}>
                    {c.label}
                  </ButtonLink>
                ))}
              </div>
            )}

            {isCta && (
              <p
                className="cm-rise mt-6 text-sm text-ink-faint"
                style={{ transitionDelay: "440ms" }}
              >
                {CM_CTA_SUPPORT}
              </p>
            )}
          </div>

          {/* ── Szenen-Overlay ── */}
          {overlayNode && (
            <div
              className={`pointer-events-auto relative ${
                isCenter ? "w-full" : "hidden grow lg:flex"
              } ${
                isCenter
                  ? "flex justify-center"
                  : copyLeft
                  ? "justify-end"
                  : "justify-start"
              }`}
            >
              {overlayNode}
            </div>
          )}
        </div>

        {/* Hero-Scroll-Cue */}
        {isHero && (
          <div
            aria-hidden
            className="pointer-events-none absolute bottom-7 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2.5"
          >
            <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-dim">
              Vom Auto zur Wallbox
            </span>
            <span className="relative block h-9 w-px overflow-hidden bg-white/15">
              <span
                className="scroll-cue absolute left-0 top-0 h-3.5 w-px"
                style={{ background: accent }}
              />
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
