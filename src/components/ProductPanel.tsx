"use client";

import { useEffect, useRef } from "react";
import type { ProductPanelDef } from "@/content/sections";
import { holdWeight } from "@/lib/scrollProgress";

/**
 * ProductPanel — the floating product card that carries the detail for each
 * station (the 3D scene is the stage; this panel is the script).
 *
 * Data-driven from `ProductPanelDef` (sections.ts): tag + title + subtitle +
 * benefit bullets + small KPI chips with mini-bars. Premium glass styling, dark
 * over bright exterior scenes / light over dark interiors, with a per-product
 * accent.
 *
 * ── SCROLL-COUPLED REVEAL ───────────────────────────────────────────────────
 * The camera plateaus on each station (scrollProgress hold zones). We read
 * `holdWeight(index)` every animation frame and ease the panel's opacity +
 * translate + bullet stagger from it, so the panel only slides in once the
 * scene has SETTLED, and eases back out as the user scrolls toward the next
 * station. No React re-render per frame — we mutate inline styles on a ref.
 *
 * `reduceCoupling` (mobile/reduced) shows the panel statically (no scroll tie).
 */

const ACCENT: Record<ProductPanelDef["accent"], { hex: string; soft: string }> = {
  teal: { hex: "#2bb6b0", soft: "rgba(43,182,176,0.18)" },
  green: { hex: "#43b649", soft: "rgba(67,182,73,0.18)" },
  aqua: { hex: "#80cec1", soft: "rgba(128,206,193,0.20)" },
  amber: { hex: "#ec7b13", soft: "rgba(236,123,19,0.16)" },
};

export default function ProductPanel({
  panel,
  index,
  side = "right",
  reduceCoupling = false,
}: {
  panel: ProductPanelDef;
  index: number;
  side?: "left" | "right" | "center";
  reduceCoupling?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const accent = ACCENT[panel.accent];
  const light = panel.theme === "light";

  // Per-frame scroll coupling: ease the whole panel from the station hold weight.
  useEffect(() => {
    if (reduceCoupling) {
      if (ref.current) {
        ref.current.style.opacity = "1";
        ref.current.style.transform = "none";
      }
      return;
    }
    let raf = 0;
    const tick = () => {
      const el = ref.current;
      if (el) {
        const w = holdWeight(index); // 0..1, 1 while resting on this station
        // ease: opacity ramps a touch ahead of motion for a calm settle
        const o = Math.min(1, w * 1.15);
        const ty = (1 - w) * 26; // slide up as it settles
        const sx = side === "left" ? -1 : side === "center" ? 0 : 1;
        const tx = (1 - w) * 14 * sx;
        el.style.opacity = o.toFixed(3);
        el.style.transform = `translate3d(${tx.toFixed(1)}px, ${ty.toFixed(
          1
        )}px, 0)`;
        el.style.pointerEvents = w > 0.6 ? "auto" : "none";
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [index, side, reduceCoupling]);

  return (
    <div
      ref={ref}
      className="product-panel mt-8 w-full max-w-md will-change-[transform,opacity]"
      style={{ opacity: reduceCoupling ? 1 : 0 }}
      aria-label={`${panel.title} – ${panel.subtitle}`}
    >
      <div
        className={[
          "relative overflow-hidden rounded-2xl border p-5 backdrop-blur-xl",
          light
            ? "border-white/70 bg-white/85 text-navy-900 shadow-[0_30px_90px_-30px_rgba(5,12,26,0.7)]"
            : "border-white/12 bg-navy-900/55 text-ink shadow-[0_30px_90px_-30px_rgba(0,0,0,0.8)]",
        ].join(" ")}
      >
        {/* accent edge */}
        <span
          className="absolute left-0 top-0 h-full w-1"
          style={{ background: accent.hex }}
        />

        {/* tag */}
        <p
          className="mb-1.5 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em]"
          style={{ color: accent.hex }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: accent.hex }}
          />
          {panel.tag}
        </p>

        {/* title + subtitle */}
        <h3
          className={`text-xl font-bold leading-tight ${
            light ? "text-navy-900" : "text-ink"
          }`}
        >
          {panel.title}
        </h3>
        <p
          className={`mt-1 text-sm leading-snug ${
            light ? "text-slate-500" : "text-ink-dim"
          }`}
        >
          {panel.subtitle}
        </p>

        {/* benefit bullets */}
        <ul className="mt-4 space-y-2">
          {panel.bullets.map((b) => (
            <li key={b} className="flex items-start gap-2.5 text-sm">
              <span
                className="mt-1.5 grid h-4 w-4 shrink-0 place-items-center rounded-full"
                style={{ background: accent.soft }}
              >
                <Check color={accent.hex} />
              </span>
              <span className={light ? "text-slate-700" : "text-ink-dim"}>
                {b}
              </span>
            </li>
          ))}
        </ul>

        {/* KPI chips with mini-bars */}
        {panel.kpis && panel.kpis.length > 0 && (
          <div className="mt-5 grid grid-cols-2 gap-2.5">
            {panel.kpis.map((k) => (
              <div
                key={k.label}
                className={[
                  "rounded-xl border p-2.5",
                  light
                    ? "border-slate-200 bg-white/70"
                    : "border-white/10 bg-white/[0.04]",
                ].join(" ")}
              >
                <p
                  className={`text-[10px] font-medium uppercase tracking-wide ${
                    light ? "text-slate-400" : "text-ink-faint"
                  }`}
                >
                  {k.label}
                </p>
                <p
                  className={`mt-0.5 text-base font-bold tabular-nums ${
                    light ? "text-navy-900" : "text-ink"
                  }`}
                >
                  {k.value}
                </p>
                {typeof k.bar === "number" && (
                  <div
                    className={`mt-1.5 h-1 w-full overflow-hidden rounded-full ${
                      light ? "bg-slate-200" : "bg-white/10"
                    }`}
                  >
                    <span
                      className="block h-full rounded-full"
                      style={{
                        width: `${Math.round(
                          Math.max(0, Math.min(1, k.bar)) * 100
                        )}%`,
                        background: accent.hex,
                      }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Check({ color }: { color: string }) {
  return (
    <svg width="9" height="9" viewBox="0 0 12 12" fill="none" aria-hidden>
      <path
        d="M2.5 6.2 5 8.7l4.5-5"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
