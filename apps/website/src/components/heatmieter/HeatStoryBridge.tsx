"use client";

import { useEffect } from "react";
import { hmSetRaw, hmSetReduced, hmFrameLoop } from "@/lib/heatProgress";

/**
 * Misst den [data-hm-story]-Runway und speist den rohen Story-Progress
 * [0,1] in den HeatMieter-Store. Offsets werden gecacht; pro Frame wird
 * nur window.scrollY gelesen (Lenis-kompatibel, kein Layout-Thrash).
 * Progress 1 ist erreicht, wenn das Runway-Ende den Viewport-Boden trifft.
 */
export default function HeatStoryBridge() {
  useEffect(() => {
    let top = 0;
    let end = 1;

    const measure = () => {
      const el = document.querySelector<HTMLElement>("[data-hm-story]");
      if (!el) return;
      const y = window.scrollY;
      top = y + el.getBoundingClientRect().top;
      end = top + Math.max(1, el.offsetHeight - window.innerHeight);
    };

    const tick = () => {
      if (process.env.NODE_ENV !== "production") {
        const forced = (window as Window & { __hmForceRaw?: number })
          .__hmForceRaw;
        if (typeof forced === "number") {
          hmSetRaw(forced);
          return;
        }
      }
      const y = window.scrollY;
      hmSetRaw((y - top) / Math.max(1, end - top));
    };

    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    const syncRM = () => hmSetReduced(mq?.matches ?? false);
    syncRM();
    mq?.addEventListener?.("change", syncRM);

    measure();
    const stop = hmFrameLoop(tick);
    window.addEventListener("resize", measure);
    const ro = new ResizeObserver(measure);
    ro.observe(document.body);
    return () => {
      stop();
      window.removeEventListener("resize", measure);
      mq?.removeEventListener?.("change", syncRM);
      ro.disconnect();
    };
  }, []);

  return null;
}
