"use client";

import { useEffect, useRef } from "react";
import { ButtonLink } from "@/components/ui/Button";
import {
  hmCineCopyWeight,
  hmCineHoldWeight,
  hmCineFrameLoop,
} from "@/lib/heatCine";
import { HM_CTA_SUPPORT, type HmScene } from "@/content/heatmieter";
import {
  PointsCard,
  LiveDataPanel,
  SavingsViz,
  BelegCard,
  AblaufTimeline,
  SystemDashboard,
} from "./HeatCineOverlays";

/**
 * Eine Szene der HeatMieter-Cine-Journey (Port von ChargePanel).
 *
 * Das <section>-Element ist reine Scroll-Runway (Bandhöhe). Story-Szenen (1–4)
 * rendern nur das Band + sr-only-Copy — ihre Bühne zeichnet der Story-Layer.
 * Sachthemen/Hero/CTA legen Copy + Overlay in ein FIXED Layer, dessen Deckkraft
 * pro Frame aus `hmCineCopyWeight(index)` kommt; `data-beat` (aus dem Hold-
 * Gewicht) taktet die zweistufigen Reveals.
 */
export default function HeatPanel({ scene }: { scene: HmScene }) {
  const layerRef = useRef<HTMLDivElement>(null);
  const isHero = scene.index === 0;
  const isCta = scene.id === "cta";
  const isStory = scene.overlay === "story";
  const accent = "var(--color-mod-heat)";

  useEffect(() => {
    if (isCta || isStory) return;
    let on = false;
    let beat = -1;
    const tick = () => {
      const el = layerRef.current;
      if (!el) return;
      const w = hmCineCopyWeight(scene.index);
      el.style.opacity = w.toFixed(3);
      el.style.visibility = w < 0.015 ? "hidden" : "visible";
      const nowOn = w > 0.42;
      if (nowOn !== on) {
        on = nowOn;
        el.dataset.on = nowOn ? "1" : "0";
      }
      const h = hmCineHoldWeight(scene.index);
      const nowBeat = h > 0.82 ? 2 : h > 0.28 ? 1 : 0;
      if (nowBeat !== beat) {
        beat = nowBeat;
        el.dataset.beat = String(nowBeat);
      }
    };
    return hmCineFrameLoop(tick);
  }, [scene.index, isCta, isStory]);

  /* Story-Szenen: nur Band + sr-only-Copy (Bühne = Story-Layer). */
  if (isStory) {
    return (
      <section
        id={scene.id}
        data-hm-scene={scene.index}
        className="relative w-full"
        style={{ minHeight: `${scene.heightVh}vh` }}
        aria-labelledby={`${scene.id}-h`}
      >
        <div className="sr-only">
          <h2 id={`${scene.id}-h`}>{scene.headline}</h2>
          <p>{scene.subline}</p>
        </div>
      </section>
    );
  }

  const overlayNode = (() => {
    switch (scene.overlay) {
      case "livedata":
        return <LiveDataPanel />;
      case "einsparen":
        return <SavingsViz sceneIndex={scene.index} />;
      case "beleg":
        return <BelegCard />;
      case "timeline":
        return <AblaufTimeline steps={scene.points ?? []} sceneIndex={scene.index} />;
      case "system":
        return <SystemDashboard />;
      case "none":
        return scene.points ? <PointsCard points={scene.points} /> : null;
      default:
        return null;
    }
  })();

  // Punkte als kompakte Bullets im Copy-Block (nur wo das Overlay sie nicht trägt).
  const copyPoints =
    scene.points &&
    (scene.overlay === "livedata" ||
      scene.overlay === "einsparen" ||
      scene.overlay === "beleg")
      ? scene.points
      : null;

  const isCenter = scene.align === "center";
  const copyLeft = scene.align === "left";

  const scrim = isCenter
    ? "bg-gradient-to-t from-navy-900/85 via-navy-900/25 to-navy-900/35"
    : copyLeft
    ? "bg-gradient-to-r from-navy-900/85 via-navy-900/30 to-transparent"
    : "bg-gradient-to-l from-navy-900/85 via-navy-900/30 to-transparent";

  return (
    <section
      id={scene.id}
      data-hm-scene={scene.index}
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
                className={`hm-rise relative mb-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] ${
                  isCenter ? "justify-center" : ""
                }`}
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
                className="text-legible hm-rise font-bold leading-[0.98] tracking-tight text-ink"
                style={{
                  fontSize: "clamp(3rem, 7vw, 6.5rem)",
                  transitionDelay: "80ms",
                }}
              >
                Heat<span className="text-[color:var(--color-mod-heat)]">Mieter</span>
              </h1>
            ) : (
              <h2
                id={`${scene.id}-h`}
                className="text-legible hm-rise font-bold leading-[1.08] text-ink text-3xl sm:text-4xl lg:text-[2.9rem]"
                style={{ transitionDelay: "100ms" }}
              >
                {scene.headline}
              </h2>
            )}

            {scene.headlineAccent && (
              <p
                className={`text-legible hm-rise mt-4 font-semibold ${
                  isHero ? "text-xl sm:text-2xl" : "text-2xl leading-[1.1] sm:text-3xl"
                }`}
                style={{ color: accent, transitionDelay: "200ms" }}
              >
                {scene.headlineAccent}
              </p>
            )}

            {scene.subline && (
              <p
                className={`text-legible hm-rise mt-5 text-base leading-relaxed text-ink-dim sm:text-lg ${
                  isCenter ? "mx-auto max-w-2xl" : "md:max-w-lg"
                }`}
                style={{ transitionDelay: "280ms" }}
              >
                {scene.subline}
              </p>
            )}

            {copyPoints && (
              <ul className="mt-6 space-y-3">
                {copyPoints.map((p, i) => (
                  <li
                    key={p}
                    className="hm-rise flex items-baseline gap-3"
                    style={{ transitionDelay: `${340 + i * 70}ms` }}
                  >
                    <span
                      aria-hidden
                      className="h-1.5 w-1.5 shrink-0 translate-y-[-2px] rounded-full"
                      style={{ background: accent }}
                    />
                    <span className="text-legible text-base text-ink-dim sm:text-[17px]">
                      {p}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {scene.cta && (
              <div
                className={`hm-rise mt-8 flex flex-wrap gap-3 ${
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
                className="hm-rise mt-6 text-sm text-ink-faint"
                style={{ transitionDelay: "440ms" }}
              >
                {HM_CTA_SUPPORT}
              </p>
            )}
          </div>

          {/* ── Szenen-Overlay ── */}
          {overlayNode && (
            <div
              className={`pointer-events-auto relative ${
                isCenter ? "flex w-full justify-center" : "hidden grow lg:flex"
              } ${
                isCenter
                  ? ""
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
            <span className="max-w-[280px] text-center text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-dim sm:max-w-none">
              Zwei Winter, zwei Abrechnungen — scrollen Sie.
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
