"use client";

import { useEffect, useMemo, useRef } from "react";
import { SECTIONS } from "@/content/sections";
import { getSectionFloat } from "@/lib/scrollProgress";

/**
 * TransitionVeil — a soft darken pulse over the 3D stage during BIG camera
 * jumps (§5: "bei Innen→Außen-Wechseln kurzer Dunkel-Übergang über Vignette
 * statt Teleport").
 *
 * The veil opacity follows the travel phase between two station keyframes:
 * zero while the camera rests on a plateau, peaking mid-travel, scaled by how
 * "big" that particular jump is (keyframe distance + whether the camera
 * crosses the building envelope). Pure DOM, one rAF, no React re-renders.
 */

/** Chapters whose camera sits INSIDE the building / garage / stairwell. */
const INTERIOR = new Set([
  "powermieter",
  "heatmieter",
  "chargemieter",
  "smokemieter",
]);

export default function TransitionVeil() {
  const ref = useRef<HTMLDivElement>(null);

  // Per-boundary jump magnitude 0..1 (i → i+1).
  const magnitudes = useMemo(() => {
    return SECTIONS.slice(0, -1).map((a, i) => {
      const b = SECTIONS[i + 1];
      const dx = a.camPos[0] - b.camPos[0];
      const dy = a.camPos[1] - b.camPos[1];
      const dz = a.camPos[2] - b.camPos[2];
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      const crossesEnvelope = INTERIOR.has(a.id) !== INTERIOR.has(b.id);
      const m = Math.min(1, dist / 30) * 0.25 + (crossesEnvelope ? 0.35 : 0);
      return Math.min(0.55, m);
    });
  }, []);

  useEffect(() => {
    let raf = 0;
    let value = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const s = getSectionFloat();
      const i = Math.max(0, Math.min(magnitudes.length - 1, Math.floor(s)));
      const f = s - i; // 0 on a plateau, 0..1 across a travel window
      const target = Math.sin(Math.PI * Math.min(1, Math.max(0, f))) * magnitudes[i];
      // critically-damped-ish follow so the pulse breathes instead of flickers
      const k = 1 - Math.pow(0.002, dt);
      value += (target - value) * k;
      if (ref.current) ref.current.style.opacity = value.toFixed(3);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [magnitudes]);

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute inset-0"
      style={{
        opacity: 0,
        background:
          "radial-gradient(120% 100% at 50% 50%, rgba(7,12,22,0.72) 0%, rgba(7,12,22,0.92) 100%)",
      }}
    />
  );
}
