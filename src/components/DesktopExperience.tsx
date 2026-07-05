"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { SECTIONS } from "@/content/sections";
import { STAGE } from "@/config/stage";
import SectionPanel from "./SectionPanel";
import DashboardOverlay from "./DashboardOverlay";
import QuietSections from "./QuietSections";
import SceneLoader from "./SceneLoader";
import BuildingArt from "./BuildingArt";
import ModuleNavigation from "./ModuleNavigation";
import TransitionVeil from "./TransitionVeil";

/** R3F canvas — client only, no SSR. Preserved; mounted only when STAGE==="r3f". */
const BuildingScene = dynamic(() => import("./three/BuildingScene"), {
  ssr: false,
});

/** Previous photoreal still stage — preserved (STAGE==="image"). */
const ImageStage = dynamic(() => import("./ImageStage"), { ssr: false });

/** Cinematic launch stage (scrubbed hero orbit + station clips) — default. */
const CinematicStage = dynamic(() => import("./CinematicStage"), {
  ssr: false,
});

/** Feature-detect a usable WebGL context. */
function hasWebGL(): boolean {
  try {
    const c = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (c.getContext("webgl") || c.getContext("experimental-webgl"))
    );
  } catch {
    return false;
  }
}

/**
 * Desktop / capable-viewport experience.
 *
 * One pinned (position: fixed) cinematic stage fills the viewport. Over it,
 * the station panels scroll: hero (scrubbed orbit) → system reveal → the
 * four module fly-throughs → exploded assembly → platform. The journey then
 * hands over to the QUIET sections (why / targets / onboarding / faq) on an
 * opaque ground, and closes with the atmosphere CTA station.
 */
export default function DesktopExperience() {
  const [ready, setReady] = useState(false);
  const [webgl] = useState<boolean | null>(() =>
    typeof window === "undefined" ? null : hasWebGL()
  );
  const rootRef = useRef<HTMLDivElement>(null);

  // Perceived-loader cap: reveal after max ~2.5s even if the stage is still
  // warming up behind the content.
  useEffect(() => {
    if (ready) return;
    const t = setTimeout(() => setReady(true), 2500);
    return () => clearTimeout(t);
  }, [ready]);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("is-visible");
        });
      },
      { threshold: 0.35 }
    );
    const els = rootRef.current?.querySelectorAll(".reveal");
    els?.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const stations = SECTIONS.filter((s) => s.id !== "cta");
  const ctaSection = SECTIONS.find((s) => s.id === "cta")!;

  return (
    <div ref={rootRef} className="relative">
      {/* Pinned cinematic stage */}
      <div className="fixed inset-0 z-0 h-dvh w-full overflow-hidden">
        {STAGE === "cinema" && (
          <CinematicStage onReady={() => setReady(true)} />
        )}
        {STAGE === "image" && <ImageStage onReady={() => setReady(true)} />}
        {STAGE === "r3f" && webgl === true && (
          <BuildingScene onReady={() => setReady(true)} />
        )}
        {STAGE === "r3f" && webgl === false && (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              background:
                "radial-gradient(120% 90% at 50% 30%, #17181c 0%, #0e0f12 65%, #0a0b0d 100%)",
            }}
          >
            <BuildingArt className="h-[80vh] w-auto opacity-90" />
          </div>
        )}
        {/* Light DOM vignette on top of the stage's own grade. */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(135% 105% at 50% 45%, transparent 62%, rgba(6,7,9,0.35) 100%)",
          }}
        />
        {/* Darken pulse during big station transitions. */}
        <TransitionVeil />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-navy-900/80 to-transparent" />
      </div>

      <SceneLoader hidden={ready} />

      {/* Chapter indicator + phase rail (desktop only) */}
      <ModuleNavigation />

      {/* Scrolling copy panels over the pinned stage, the quiet zone, finale */}
      <div className="relative z-10">
        {stations.map((s) => (
          <SectionPanel key={s.id} section={s}>
            {s.id === "dashboard" ? <DashboardOverlay /> : undefined}
          </SectionPanel>
        ))}

        <QuietSections />

        <SectionPanel section={ctaSection} />
      </div>

      <style jsx global>{`
        .reveal .reveal-inner {
          opacity: 0;
          transform: translateY(28px);
          transition: opacity 0.8s var(--ease-calm),
            transform 0.8s var(--ease-calm);
        }
        .reveal.is-visible .reveal-inner {
          opacity: 1;
          transform: none;
        }
        @media (prefers-reduced-motion: reduce) {
          .reveal .reveal-inner {
            opacity: 1;
            transform: none;
            transition: none;
          }
        }
      `}</style>
    </div>
  );
}
