"use client";

import { ReactLenis, useLenis } from "lenis/react";
import { useEffect } from "react";
import { setProgress } from "@/lib/scrollProgress";

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
  useLenis((lenis) => {
    // lenis.progress is 0..1 across the full scrollable height.
    setProgress(lenis.progress ?? 0);
  });

  // Keep the store in sync even before the first Lenis tick (e.g. SSR hydration).
  useEffect(() => {
    const onScroll = () => {
      const max =
        document.documentElement.scrollHeight - window.innerHeight || 1;
      setProgress(window.scrollY / max);
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
        lerp: 0.085,
        duration: 1.25,
        smoothWheel: !reduced,
        wheelMultiplier: 1,
        touchMultiplier: 1.4,
      }}
    >
      <ScrollBridge />
      {children}
    </ReactLenis>
  );
}
