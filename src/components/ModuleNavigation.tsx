"use client";

import { useEffect, useState } from "react";
import { useLenis } from "lenis/react";
import { SECTIONS, STATION_LABELS } from "@/content/sections";
import { getSectionFloat } from "@/lib/scrollProgress";
import ScrollProgress from "./ScrollProgress";

/**
 * ModuleNavigation — the slim chapter indicator on the right edge (Radian's
 * expandable chapter menu, reduced to its calm essence). One row per station
 * (00–08): tick + number, the active station carries its label and the brand
 * accent. Click smooth-scrolls into the station's HOLD (mid-band), so the
 * camera lands settled and the panel is revealed. Desktop only — the mobile
 * story stacks naturally.
 *
 * The ScrollProgress phase rail runs behind the ticks so numbers + journey
 * progress read as one instrument.
 */
export default function ModuleNavigation() {
  const [active, setActive] = useState(0);
  const lenis = useLenis();

  // Track the active station from the scroll core (state update only on change).
  useEffect(() => {
    let raf = 0;
    let current = -1;
    const tick = () => {
      const i = Math.round(getSectionFloat());
      if (i !== current) {
        current = i;
        setActive(i);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const goTo = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    // land mid-HOLD: camera at rest, panel revealed
    const y = window.scrollY + el.getBoundingClientRect().top + el.offsetHeight * 0.55;
    const target = Math.min(
      y,
      document.documentElement.scrollHeight - window.innerHeight
    );
    if (lenis) lenis.scrollTo(target, { duration: 1.8 });
    else window.scrollTo({ top: target, behavior: "smooth" });
  };

  return (
    <nav
      aria-label="Kapitel"
      className="fixed right-5 top-1/2 z-30 hidden -translate-y-1/2 lg:block"
    >
      <div className="relative flex flex-col items-end gap-2">
        <ScrollProgress className="absolute -right-2.5 inset-y-1" />
        {SECTIONS.map((s) => {
          const isActive = s.index === active;
          const num = String(s.index).padStart(2, "0");
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => goTo(s.id)}
              aria-label={`Station ${num} – ${STATION_LABELS[s.id] ?? s.id}`}
              aria-current={isActive ? "true" : undefined}
              className="group flex items-center gap-2.5 py-0.5"
            >
              <span
                className={`whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.18em] transition-all duration-300 ${
                  isActive
                    ? "translate-x-0 text-ink opacity-90"
                    : "translate-x-1 text-ink-faint opacity-0 group-hover:translate-x-0 group-hover:opacity-70 group-focus-visible:translate-x-0 group-focus-visible:opacity-70"
                }`}
              >
                {STATION_LABELS[s.id] ?? s.id}
              </span>
              <span
                className={`text-[11px] font-semibold tabular-nums transition-colors duration-300 ${
                  isActive ? "text-brand-teal" : "text-ink-faint group-hover:text-ink-dim"
                }`}
              >
                {num}
              </span>
              <span
                className={`block h-px transition-all duration-300 ${
                  isActive ? "w-5 bg-brand-teal" : "w-2.5 bg-white/25 group-hover:bg-white/45"
                }`}
              />
            </button>
          );
        })}
      </div>
    </nav>
  );
}
