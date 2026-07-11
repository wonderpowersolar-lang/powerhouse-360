"use client";

import { useEffect } from "react";
import { cmSetRaw, cmSetReduced, cmFrameLoop } from "@/lib/chargeProgress";

/**
 * Misst die `[data-cm-scene]`-Abschnitte und speist den rohen Scene-Float in
 * den ChargeMieter-Store. Offsets werden einmalig (und bei Resize/Layout-
 * Shifts) gecacht; pro Frame wird nur window.scrollY gelesen — läuft damit
 * unter Lenis (natives Scrollen) ohne Layout-Thrash.
 */
export default function ChargeScrollBridge() {
  useEffect(() => {
    let bands: { index: number; top: number; end: number }[] = [];

    const measure = () => {
      const els = Array.from(
        document.querySelectorAll<HTMLElement>("[data-cm-scene]")
      );
      if (!els.length) {
        bands = [];
        return;
      }
      const y = window.scrollY;
      const list = els
        .map((el) => ({
          index: Number(el.getAttribute("data-cm-scene")) || 0,
          top: y + el.getBoundingClientRect().top,
          height: el.offsetHeight || window.innerHeight,
        }))
        .sort((a, b) => a.top - b.top);
      bands = list.map((s, k) => ({
        index: s.index,
        top: s.top,
        end: k < list.length - 1 ? list[k + 1].top : s.top + s.height,
      }));
    };

    const tick = () => {
      // Dev-Werkzeug: Szenen-Zustand ohne echtes Scrollen erzwingen
      // (Screenshot-Verifikation); im Prod-Build wegkompiliert.
      if (process.env.NODE_ENV !== "production") {
        const forced = (window as Window & { __cmForceRaw?: number })
          .__cmForceRaw;
        if (typeof forced === "number") {
          cmSetRaw(forced);
          return;
        }
      }
      if (bands.length) {
        const y = window.scrollY;
        let raw = bands[bands.length - 1].index;
        if (y <= bands[0].top) raw = bands[0].index;
        else {
          for (const b of bands) {
            if (y >= b.top && y < b.end) {
              raw =
                b.index +
                Math.min(0.9999, (y - b.top) / Math.max(1, b.end - b.top));
              break;
            }
          }
        }
        cmSetRaw(raw);
      }
    };

    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    const syncRM = () => cmSetReduced(mq?.matches ?? false);
    syncRM();
    mq?.addEventListener?.("change", syncRM);

    measure();
    const stop = cmFrameLoop(tick);
    window.addEventListener("resize", measure);
    // Späte Layout-Shifts (Fonts, Bilder) abfangen.
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
