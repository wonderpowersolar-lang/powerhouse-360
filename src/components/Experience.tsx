"use client";

import { useEffect, useState } from "react";
import DesktopExperience from "./DesktopExperience";
import MobileExperience from "./MobileExperience";
import { setReduced } from "@/lib/scrollProgress";

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
      const ok = wide && fine && !reduced;
      setReduced(!ok);
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
