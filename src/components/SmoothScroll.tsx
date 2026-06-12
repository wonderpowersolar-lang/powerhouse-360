"use client";

import { ReactLenis, useLenis } from "lenis/react";
import { useEffect } from "react";
import { getReduced, setProgress, setSectionRaw } from "@/lib/scrollProgress";

/**
 * Compute the DOM-anchored raw section float from the actual `[data-section]`
 * elements: find the section whose band the viewport TOP currently sits in, and
 * return `index + (scrollY - top) / height`. Robust to unequal section heights,
 * Nav and Footer offsets — unlike a flat `progress * (N-1)` map.
 */
function computeSectionRaw(): number | null {
  const els = Array.from(
    document.querySelectorAll<HTMLElement>("[data-section]")
  );
  if (!els.length) return null;
  const y = window.scrollY;
  // sort by document position
  const tops = els
    .map((el) => ({
      index: Number(el.getAttribute("data-section")) || 0,
      top: y + el.getBoundingClientRect().top,
      height: el.offsetHeight || window.innerHeight,
    }))
    .sort((a, b) => a.top - b.top);

  // before the first section
  if (y <= tops[0].top) return tops[0].index;
  for (let k = 0; k < tops.length; k++) {
    const s = tops[k];
    if (y >= s.top && y < s.top + s.height) {
      return s.index + Math.min(0.9999, (y - s.top) / s.height);
    }
  }
  return tops[tops.length - 1].index;
}

/**
 * Single Lenis smooth-scroll root for the whole app.
 *
 * Responsibilities:
 *  - Provide inertial smooth scrolling (desktop).
 *  - Feed the global scrollProgress store on every scroll tick, so the
 *    R3F scene can read scroll position imperatively (no React re-render).
 *
 * There is exactly ONE rAF loop here (Lenis'). The R3F Canvas runs its own
 * internal loop and only *reads* the shared progress value.
 */
function ScrollBridge() {
  const lenisInstance = useLenis();

  // Desktop anchor clicks land MID-HOLD of the target station (camera settled,
  // panel revealed) instead of the band start (which is mid-approach).
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement | null)?.closest?.('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute("href")?.slice(1);
      const el = id ? document.getElementById(id) : null;
      if (!el || getReduced()) return; // mobile/static keeps native behaviour
      e.preventDefault();
      const max =
        document.documentElement.scrollHeight - window.innerHeight || 0;
      const y = Math.min(
        max,
        window.scrollY + el.getBoundingClientRect().top + el.offsetHeight * 0.45
      );
      if (lenisInstance) lenisInstance.scrollTo(y, { duration: 1.8 });
      else window.scrollTo({ top: y, behavior: "smooth" });
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [lenisInstance]);

  useLenis((lenis) => {
    // lenis.progress is 0..1 across the full scrollable height (kept for the
    // mobile/static path + as a fallback), but the camera follows the
    // DOM-anchored section float so unequal heights never desync the story.
    setProgress(lenis.progress ?? 0);
    const raw = computeSectionRaw();
    if (raw != null) setSectionRaw(raw);
  });

  // Keep the store in sync even before the first Lenis tick (e.g. SSR hydration).
  useEffect(() => {
    const onScroll = () => {
      const max =
        document.documentElement.scrollHeight - window.innerHeight || 1;
      setProgress(window.scrollY / max);
      const raw = computeSectionRaw();
      if (raw != null) setSectionRaw(raw);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return null;
}

export default function SmoothScroll({
  children,
}: {
  children: React.ReactNode;
}) {
  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  return (
    <ReactLenis
      root
      options={{
        // §5: lerp 0.05–0.06, NO snapping — calm inertia so the camera glides
        // between the plateaued station keyframes instead of darting.
        lerp: 0.055,
        smoothWheel: !reduced,
        wheelMultiplier: 0.9,
        touchMultiplier: 1.3,
      }}
    >
      <ScrollBridge />
      {children}
    </ReactLenis>
  );
}
