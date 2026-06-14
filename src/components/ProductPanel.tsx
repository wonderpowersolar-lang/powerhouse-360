"use client";

import { useEffect, useRef } from "react";
import type { ProductPanelDef } from "@/content/sections";
import { holdWeight } from "@/lib/scrollProgress";
import { dur, ease } from "@/styles/motionTokens";
import MetricCard from "./ui/MetricCard";
import { useTheme } from "./theme/useTheme";

/**
 * ProductPanel — the numbered floating product card that carries the detail
 * for each station (the 3D scene is the stage; this panel is the script).
 *
 * Data-driven from `ProductPanelDef` (sections.ts): number + tag + title +
 * subtitle + benefit bullets + KPI MetricCards. Premium glass styling, dark
 * over bright exterior scenes / light over dark interiors, with a per-product
 * accent and the big chapter numeral in the card corner (Razorpay pattern).
 *
 * ── BEAT-COUPLED REVEAL (§5) ────────────────────────────────────────────────
 * The camera plateaus on each station (scrollProgress band mapping). We read
 * `holdWeight(index)` every animation frame and run a small SHOW/HIDE state
 * machine instead of scrubbing styles from scroll:
 *
 *   • REVEAL  — only once holdWeight ≥ 0.6 (camera fully at rest): the card
 *               slides in over `dur.reveal` (550ms) with `ease.calm`.
 *   • EXPLAIN — shown, static; only scene micro-loops move.
 *   • EXIT    — when holdWeight falls below 0.35 (hysteresis) the card exits
 *               in `dur.exit` (250ms) while the camera releases.
 *
 * No React re-render per frame — we mutate inline styles on a ref.
 * `reduceCoupling` (mobile/reduced) shows the panel statically (no scroll tie).
 */

const SHOW_AT = 0.6;
const HIDE_AT = 0.45;

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
  const theme = useTheme();
  // In global LIGHT mode every card uses the light glass treatment (off-white,
  // dark text). In DARK mode the per-panel `theme` decides (light cards over the
  // bright interior scenes, dark glass over the night exteriors) — unchanged.
  const light = theme === "light" ? true : panel.theme === "light";

  // Per-frame beat state machine (see header).
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduceCoupling) {
      el.style.opacity = "1";
      el.style.transform = "none";
      return;
    }

    const sx = side === "left" ? -1 : side === "center" ? 0 : 1;
    const hiddenTransform = `translate3d(${18 * sx}px, 30px, 0) scale(0.985)`;
    let shown = false;
    let raf = 0;

    const apply = (show: boolean) => {
      el.style.transition = show
        ? `opacity ${dur.reveal}ms ${ease.calm}, transform ${dur.reveal}ms ${ease.calm}`
        : `opacity ${dur.exit}ms ease-out, transform ${dur.exit}ms ease-out`;
      el.style.opacity = show ? "1" : "0";
      el.style.transform = show ? "translate3d(0,0,0) scale(1)" : hiddenTransform;
      el.style.pointerEvents = show ? "auto" : "none";
    };

    // initial hidden state (no transition flash)
    el.style.transition = "none";
    el.style.opacity = "0";
    el.style.transform = hiddenTransform;
    el.style.pointerEvents = "none";

    const tick = () => {
      const w = holdWeight(index);
      if (!shown && w >= SHOW_AT) {
        shown = true;
        apply(true);
      } else if (shown && w < HIDE_AT) {
        shown = false;
        apply(false);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [index, side, reduceCoupling]);

  return (
    <div
      ref={ref}
      className="product-panel mt-6 w-full max-w-md will-change-[transform,opacity]"
      style={{ opacity: reduceCoupling ? 1 : 0 }}
      aria-label={`${panel.number} ${panel.title} – ${panel.subtitle}`}
    >
      <div
        className={[
          "relative overflow-hidden rounded-3xl border p-5 backdrop-blur-xl",
          light
            ? "border-white/70 bg-white/85 text-[#101c2e] shadow-[0_30px_90px_-30px_rgba(20,32,54,0.4)]"
            : "border-white/12 bg-navy-900/55 text-ink shadow-[0_30px_90px_-30px_rgba(0,0,0,0.8)]",
        ].join(" ")}
      >
        {/* accent edge */}
        <span
          className="absolute left-0 top-0 h-full w-1"
          style={{ background: accent.hex }}
        />

        {/* chapter numeral — quiet, large, corner (Razorpay) */}
        <span
          aria-hidden
          className="pointer-events-none absolute right-4 top-2 select-none text-[44px] font-bold leading-none tabular-nums tracking-tight"
          style={{ color: accent.hex, opacity: light ? 0.18 : 0.22 }}
        >
          {panel.number}
        </span>

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
          className={`pr-14 text-xl font-bold leading-tight ${
            light ? "text-[#101c2e]" : "text-ink"
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

        {/* KPI MetricCards */}
        {panel.kpis && panel.kpis.length > 0 && (
          <div className="mt-5 grid grid-cols-2 gap-2.5">
            {panel.kpis.map((k) => (
              <MetricCard
                key={k.label}
                label={k.label}
                value={k.value}
                bar={k.bar}
                accent={accent.hex}
                tone={light ? "light" : "dark"}
              />
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
