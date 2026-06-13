"use client";

import { useEffect, useState } from "react";
import DesktopExperience from "./DesktopExperience";
import MobileExperience from "./MobileExperience";
import { setReduced } from "@/lib/scrollProgress";
import { STAGE } from "@/config/stage";

/**
 * Decides which experience to render.
 *
 * Desktop (full pinned 3D scroll story) is used only on wide viewports with a
 * fine pointer and motion allowed. Otherwise — small screens, coarse pointer,
 * or prefers-reduced-motion — we render the lightweight stacked mobile
 * experience. The choice is made after mount to stay hydration-safe; until
 * then we render the mobile (cheap, universally safe) layout.
 */
export default function Experience() {
  const [mode, setMode] = useState<"mobile" | "desktop" | null>(null);

  useEffect(() => {
    const decide = () => {
      const wide = window.matchMedia("(min-width: 1024px)").matches;
      const fine = window.matchMedia("(pointer: fine)").matches;
      const reduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
      // The lightweight photoreal image stage runs even under
      // prefers-reduced-motion (its AUTONOMOUS motion — breathing drift, grain,
      // hero auto push-in — is damped inside ImageStage, while the scroll-coupled
      // crossfade journey stays on). Only the heavy real-time R3F stage is
      // skipped for reduced-motion users.
      const ok = wide && fine && (STAGE === "image" || !reduced);
      // Keep the store's reduced flag truthful for a11y-sensitive behaviours.
      setReduced(reduced);
      setMode(ok ? "desktop" : "mobile");
    };
    decide();
    const mq = window.matchMedia("(min-width: 1024px)");
    mq.addEventListener?.("change", decide);
    window.addEventListener("resize", decide);
    return () => {
      mq.removeEventListener?.("change", decide);
      window.removeEventListener("resize", decide);
    };
  }, []);

  // Pre-decision: render the safe mobile layout (also the SSR output).
  if (mode === null || mode === "mobile") return <MobileExperience />;
  return <DesktopExperience />;
}
