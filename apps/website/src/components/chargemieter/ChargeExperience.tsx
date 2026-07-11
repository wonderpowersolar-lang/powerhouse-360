"use client";

import { useEffect, useState } from "react";
import ChargeDesktop from "./ChargeDesktop";
import ChargeMobile from "./ChargeMobile";
import { cmSetReduced } from "@/lib/chargeProgress";

/**
 * Entscheidet das ChargeMieter-Erlebnis: die volle cinematische Journey nur
 * auf breiten Viewports mit feinem Pointer und erlaubter Bewegung — sonst
 * die leichten gestapelten Szenen. Hydration-sicher: bis zur Entscheidung
 * rendert (auch SSR) das Mobile-Layout.
 */
export default function ChargeExperience() {
  const [mode, setMode] = useState<"mobile" | "desktop" | null>(null);

  useEffect(() => {
    const decide = () => {
      const wide = window.matchMedia("(min-width: 1024px)").matches;
      const fine = window.matchMedia("(pointer: fine)").matches;
      const reduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
      cmSetReduced(reduced);
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

  if (mode === null || mode === "mobile") return <ChargeMobile />;
  return <ChargeDesktop />;
}
