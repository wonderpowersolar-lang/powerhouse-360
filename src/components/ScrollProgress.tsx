"use client";

import { useEffect, useRef } from "react";
import { getProgress } from "@/lib/scrollProgress";

/**
 * ScrollProgress — the subtle vertical phase rail of the journey (NRG
 * pattern). A hairline track with a brand-gradient fill that follows the
 * page progress. Rendered inside ModuleNavigation so rail + station numbers
 * read as ONE quiet instrument on the right edge. Pure DOM, one rAF.
 */
export default function ScrollProgress({ className = "" }: { className?: string }) {
  const fillRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      if (fillRef.current) {
        fillRef.current.style.transform = `scaleY(${getProgress().toFixed(4)})`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      aria-hidden
      className={`pointer-events-none w-px overflow-hidden rounded-full bg-white/10 ${className}`}
    >
      <div
        ref={fillRef}
        className="h-full w-full origin-top bg-gradient-to-b from-brand-green via-brand-teal to-brand-aqua"
        style={{ transform: "scaleY(0)" }}
      />
    </div>
  );
}
