"use client";

import { useEffect, useState } from "react";
import HeatDesktop from "./HeatDesktop";
import HeatMobile from "./HeatMobile";
import { hmCineSetReduced } from "@/lib/heatCine";

/**
 * Entscheidet das HeatMieter-Erlebnis: die volle cinematische Journey (fixierte
 * Bühne + Szenen-Panels, ChargeMieter-Niveau) nur auf breiten Viewports mit
 * feinem Pointer und erlaubter Bewegung — sonst die leichte gestapelte Journey
 * (HeatMobile). Hydration-sicher: bis zur Entscheidung rendert (auch SSR) das
 * Mobile-Layout. Port von ChargeExperience.
 */
export default function HeatExperience() {
  const [mode, setMode] = useState<"mobile" | "desktop" | null>(null);

  useEffect(() => {
    const decide = () => {
      const wide = window.matchMedia("(min-width: 1024px)").matches;
      const fine = window.matchMedia("(pointer: fine)").matches;
      const reduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
      hmCineSetReduced(reduced);
      setMode(wide && fine && !reduced ? "desktop" : "mobile");
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

  if (mode === null || mode === "mobile") return <HeatMobile />;
  return <HeatDesktop />;
}
