"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { SECTIONS } from "@/content/sections";
import SectionPanel from "./SectionPanel";
import DashboardOverlay from "./DashboardOverlay";
import ResidentsOverlay from "./ResidentsOverlay";
import SceneLoader from "./SceneLoader";
import BuildingArt from "./BuildingArt";

/** R3F canvas — client only, no SSR. */
const BuildingScene = dynamic(() => import("./three/BuildingScene"), {
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
 * A single pinned (position: fixed) 3D canvas fills the viewport. Over it,
 * eight full-height section panels scroll. The shared scrollProgress store
 * (fed by Lenis) drives the camera inside the canvas, so the building
 * "unfolds" its story as the user scrolls. An IntersectionObserver toggles a
 * reveal class on each panel for calm fade-in of the copy.
 */
export default function DesktopExperience() {
  const [ready, setReady] = useState(false);
  const [webgl, setWebgl] = useState<boolean | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  // Decide WebGL support before mounting the canvas.
  useEffect(() => {
    const ok = hasWebGL();
    setWebgl(ok);
    if (!ok) setReady(true); // no canvas → reveal content immediately
  }, []);

  // Safety net: never trap the user on the loader. If the scene hasn't
  // signalled ready within 6s (lost WebGL context, slow device), reveal anyway.
  useEffect(() => {
    if (ready) return;
    const t = setTimeout(() => setReady(true), 6000);
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

  return (
    <div ref={rootRef} className="relative">
      {/* Pinned 3D stage (or static fallback if WebGL is unavailable) */}
      <div className="fixed inset-0 z-0 h-dvh w-full overflow-hidden">
        {webgl === true && <BuildingScene onReady={() => setReady(true)} />}
        {webgl === false && (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              background:
                "radial-gradient(120% 90% at 50% 30%, #16243f 0%, #0d1626 65%, #090f1a 100%)",
            }}
          >
            <BuildingArt className="h-[80vh] w-auto opacity-90" />
          </div>
        )}
        {/* Vignette and top fade keep headlines legible. */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(130% 100% at 50% 45%, transparent 55%, rgba(9,15,26,0.55) 100%)",
          }}
        />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-navy-900/80 to-transparent" />
      </div>

      <SceneLoader hidden={ready} />

      {/* Scrolling copy panels over the pinned scene */}
      <div className="relative z-10">
        {SECTIONS.map((s) => (
          <SectionPanel key={s.id} section={s}>
            {s.id === "dashboard" && <DashboardOverlay />}
            {s.id === "residents" && <ResidentsOverlay />}
          </SectionPanel>
        ))}
      </div>

      <style jsx global>{`
        .reveal .reveal-inner {
          opacity: 0;
          transform: translateY(28px);
          transition: opacity 0.8s var(--ease-calm), transform 0.8s var(--ease-calm);
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
