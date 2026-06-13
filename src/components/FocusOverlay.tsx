"use client";

import { useEffect } from "react";
import { SECTIONS } from "@/content/sections";
import { useFocusHotspot, clearFocus } from "@/lib/focusStore";
import ProductPanel from "./ProductPanel";

/**
 * FocusOverlay — the focused-module stage UI for the explorer.
 *
 * When a pin (or the module rail) flies the camera into a zone, this mounts:
 *   • a soft directional scrim on the copy side (keeps the panel legible over
 *     the live 3D, dark over bright exteriors / lighter over dark interiors),
 *   • the module's numbered ProductPanel — REUSED, in `reduceCoupling` mode so
 *     it shows statically (the copy is identical to the scroll story; no text
 *     is duplicated, it reads straight from sections.ts),
 *   • the module headline/subline above the panel,
 *   • a "← Zurück zur Übersicht" control (top-left) + an Esc key handler that
 *     fly the camera back out to the overview.
 *
 * It subscribes to the focus store and only renders while a module is focused;
 * the camera fly-in itself is the CameraRig's focusBlend tween, so this overlay
 * just fades its content in over the same beat. Mounting/unmounting is driven by
 * `focusId` (discrete), so there is no per-frame churn here.
 */

export default function FocusOverlay() {
  const hotspot = useFocusHotspot();

  // Esc → back to overview, but only while focused.
  useEffect(() => {
    if (!hotspot) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        clearFocus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hotspot]);

  if (!hotspot) return null;

  const section = SECTIONS[hotspot.sectionIndex];
  const panel = section?.panel;
  if (!section || !panel) return null;

  // Place the panel on the section's natural copy side (so it never covers the
  // focused subject), defaulting to right.
  const side: "left" | "right" =
    section.align === "left" ? "left" : "right";

  const scrim =
    side === "left"
      ? "bg-gradient-to-r from-navy-900/88 via-navy-900/35 to-transparent"
      : "bg-gradient-to-l from-navy-900/88 via-navy-900/35 to-transparent";

  return (
    <div
      className="fixed inset-0 z-40"
      role="dialog"
      aria-modal="true"
      aria-label={`${panel.number} ${panel.title}`}
    >
      {/* directional scrim — fades in with the fly-in */}
      <div
        className={`focus-fade pointer-events-none absolute inset-0 ${scrim}`}
      />

      {/* Back control — elegant, top-left */}
      <div className="focus-fade pointer-events-auto absolute left-5 top-5 sm:left-8 sm:top-7">
        <button
          type="button"
          onClick={clearFocus}
          data-focus-back
          className="group inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-navy-900/65 py-2 pl-3 pr-4 text-sm font-semibold text-ink backdrop-blur-md transition-all duration-300 hover:border-brand-teal/60 hover:bg-navy-900/85"
        >
          <span
            aria-hidden
            className="grid h-5 w-5 place-items-center rounded-full bg-white/8 transition-colors duration-300 group-hover:bg-brand-teal/25"
          >
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden>
              <path
                d="M7.2 2.5 3.5 6l3.7 3.5"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          Zurück zur Übersicht
        </button>
      </div>

      {/* Module copy + ProductPanel on the copy side */}
      <div
        className={`pointer-events-none absolute inset-0 flex items-center px-5 sm:px-8 ${
          side === "left" ? "justify-start" : "justify-end"
        }`}
      >
        <div className="focus-rise pointer-events-auto w-full max-w-md">
          {/* kicker + headline (mirrors the scroll station, materialised here) */}
          <p className="mb-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-brand-teal">
            <span className="h-px w-8 bg-brand-teal/60" />
            {section.kicker}
          </p>
          <h2 className="text-legible text-3xl font-bold leading-[1.1] text-ink sm:text-4xl">
            {section.headline}
          </h2>

          {/* the reused, statically-shown product card */}
          <ProductPanel
            panel={panel}
            index={hotspot.sectionIndex}
            side={side}
            reduceCoupling
          />
        </div>
      </div>

      {/* a11y: a hidden hint that Esc closes the focused view */}
      <p className="sr-only">Drücke Escape, um zur Gebäudeübersicht zurückzukehren.</p>

      <style jsx>{`
        .focus-fade {
          animation: focus-fade-in 0.6s var(--ease-calm) both;
          animation-delay: 0.35s;
        }
        .focus-rise {
          animation: focus-rise-in 0.6s var(--ease-calm) both;
          animation-delay: 0.55s;
        }
        @keyframes focus-fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes focus-rise-in {
          from {
            opacity: 0;
            transform: translateY(22px);
          }
          to {
            opacity: 1;
            transform: none;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .focus-fade,
          .focus-rise {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
