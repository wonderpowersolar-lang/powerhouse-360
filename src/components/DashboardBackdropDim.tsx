"use client";

import { useEffect, useRef } from "react";
import { SECTIONS } from "@/content/sections";
import { copyWeight } from "@/lib/scrollProgress";
import { getFocusBlend } from "@/lib/focusStore";

/**
 * DashboardBackdropDim — dims the photoreal stage during the platform (dashboard)
 * station so the DOM EnerSmart dashboard window reads as the HERO of that station
 * (§3/§4: the dashboard sits over a *dimmed* 09-final-connected backdrop, UI text
 * stays crisp DOM). A fixed scrim whose opacity follows the dashboard band's
 * copyWeight, so the tower image is full-strength on the bands either side and
 * dips to a dark wash exactly while the dashboard is shown. Image stage only.
 *
 * One rAF loop, opacity-only; renders an empty fixed layer.
 */
export default function DashboardBackdropDim() {
  const ref = useRef<HTMLDivElement>(null);
  const dashIndex =
    SECTIONS.find((s) => s.id === "dashboard")?.index ?? -1;

  useEffect(() => {
    if (dashIndex < 0) return;
    let raf = 0;
    const tick = () => {
      const el = ref.current;
      if (el) {
        // up to 0.62 dark while the dashboard is centred; never while focused.
        const w = copyWeight(dashIndex) * (1 - getFocusBlend());
        const op = (w * 0.62).toFixed(3);
        el.style.opacity = op;
        el.style.visibility = w < 0.02 ? "hidden" : "visible";
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [dashIndex]);

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[5] bg-navy-900"
      style={{ opacity: 0, visibility: "hidden" }}
    />
  );
}
