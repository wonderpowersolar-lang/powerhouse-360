"use client";

import { useEffect } from "react";
import { smSetRaw, smSetReduced, smFrameLoop } from "@/lib/smokeProgress";

/**
 * Misst den [data-sm-story]-Runway und speist den rohen Story-Progress
 * [0,1] in den SmokeMieter-Store. Offsets werden gecacht; pro Frame wird
 * nur window.scrollY gelesen (Lenis-kompatibel, kein Layout-Thrash).
 * Progress 1 ist erreicht, wenn das Runway-Ende den Viewport-Boden trifft.
 */
export default function SmokeStoryBridge() {
  useEffect(() => {
    let top = 0;
    let end = 1;

    const measure = () => {
      const el = document.querySelector<HTMLElement>("[data-sm-story]");
      if (!el) return;
      const y = window.scrollY;
      top = y + el.getBoundingClientRect().top;
      end = top + Math.max(1, el.offsetHeight - window.innerHeight);
    };

    const tick = () => {
      if (process.env.NODE_ENV !== "production") {
        const forced = (window as Window & { __smForceRaw?: number })
          .__smForceRaw;
        if (typeof forced === "number") {
          smSetRaw(forced);
          return;
        }
      }
      const y = window.scrollY;
      smSetRaw((y - top) / Math.max(1, end - top));
    };

    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    const syncRM = () => smSetReduced(mq?.matches ?? false);
    syncRM();
    mq?.addEventListener?.("change", syncRM);

    measure();
    const stop = smFrameLoop(tick);
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
