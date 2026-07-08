"use client";

import { useEffect, useRef } from "react";
import { HM_ADMIN_WIDGETS, HM_BILL_CLEAR, HM_DATA_UNITS } from "@/content/heatmieter";
import { hmCineHoldWeight, hmCineFrameLoop } from "@/lib/heatCine";

/**
 * HeatMieter — Sachthemen-Overlays (Cine).
 *
 * Schwebende Glas-UI über der Bühne, getaktet vom umgebenden HeatPanel via
 * `data-on` (Copy sichtbar) und `data-beat` (0·1·2 aus dem Hold-Gewicht).
 * CSS-Transitions erledigen die Reveals; nur Timeline & Spar-Viz lesen das
 * Hold-Gewicht pro Frame. Port von ChargeOverlays.tsx (cm- → hm-).
 */

const HEAT = "var(--color-mod-heat)";
const GREEN = "var(--color-brand-green)";

/** Glas-Karte — Grundfläche aller schwebenden UI-Elemente. */
function Glass({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-2xl border border-white/10 bg-[rgba(14,16,20,0.55)] shadow-[0_18px_50px_-20px_rgba(0,0,0,0.8)] backdrop-blur-md ${className}`}
    >
      {children}
    </div>
  );
}

function StatusDot({ color }: { color: string }) {
  return (
    <span
      aria-hidden
      className="inline-block h-1.5 w-1.5 shrink-0 rounded-full"
      style={{ background: color, boxShadow: `0 0 8px ${color}` }}
    />
  );
}

/* ═══════════════ Punkte-Karte (Sachthemen ohne Spezial-Overlay) ═══════════════ */

export function PointsCard({
  points,
  caption,
}: {
  points: string[];
  caption?: string;
}) {
  return (
    <Glass className="w-full max-w-sm p-5">
      <div className="space-y-3">
        {points.map((p, k) => (
          <div
            key={p}
            className="hm-rise flex items-start gap-3"
            style={{ transitionDelay: `${120 + k * 80}ms` }}
          >
            <span
              className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
              style={{ background: HEAT, boxShadow: `0 0 8px ${HEAT}` }}
            />
            <span className="text-[15px] leading-snug text-ink-dim">{p}</span>
          </div>
        ))}
      </div>
      {caption && (
        <p
          className="hm-rise mt-4 border-t border-white/8 pt-3 text-[11px] leading-relaxed text-ink-faint"
          style={{ transitionDelay: `${180 + points.length * 80}ms` }}
        >
          {caption}
        </p>
      )}
    </Glass>
  );
}

/* ═══════════════ Erfassung: Anlagen-Live-Panel ═══════════════ */

const LIVE_ROWS = [
  { label: "Wärmepumpe", value: "aktiv", state: "ok" as const },
  { label: "Vorlauf", value: "38 °C", state: "info" as const },
  { label: "Rücklauf", value: "31 °C", state: "info" as const },
  { label: "Warmwasser", value: "bereit", state: "ok" as const },
];

export function LiveDataPanel() {
  return (
    <div className="w-full max-w-sm space-y-4">
      <Glass className="hm-rise overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/8 px-5 pb-3 pt-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-faint">
            Anlage · Live
          </p>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-ink-dim">
            <span
              className="hm-live-pulse inline-flex h-2 w-2 rounded-full"
              style={{ background: GREEN, boxShadow: `0 0 10px ${GREEN}` }}
            />
            Fernablesbar
          </span>
        </div>
        <div className="space-y-1.5 px-5 py-4">
          {LIVE_ROWS.map((r, k) => (
            <div
              key={r.label}
              className="hm-rise flex items-center justify-between rounded-lg px-2.5 py-2"
              style={{ transitionDelay: `${120 + k * 60}ms` }}
            >
              <span className="inline-flex items-center gap-2.5 text-sm text-ink-dim">
                <StatusDot color={r.state === "ok" ? GREEN : HEAT} />
                {r.label}
              </span>
              <span className="font-mono text-sm font-semibold tabular-nums text-ink">
                {r.value}
              </span>
            </div>
          ))}
        </div>
      </Glass>
      {/* Monatswerte je Wohnung — echoes the story datalayer */}
      <div
        className="hm-rise flex flex-wrap gap-2"
        style={{ transitionDelay: "320ms" }}
      >
        {HM_DATA_UNITS.map((u) => (
          <span
            key={u.label}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5"
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: u.state === "ok" ? GREEN : HEAT }}
            />
            <span className="font-mono text-[11px] tracking-wide text-ink-dim">
              {u.label}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════ Einsparen: Muster-/Ausreißer-Viz ═══════════════ */

export function SavingsViz({ sceneIndex }: { sceneIndex: number }) {
  const barsRef = useRef<(SVGRectElement | null)[]>([]);
  const flagRef = useRef<SVGGElement>(null);
  const stateRef = useRef<SVGTextElement>(null);

  useEffect(() => {
    // Ausgangs-Höhen je Einheit; Einheit 3 (Index 2) ist der Ausreißer.
    const BASE = [40, 46, 92, 44, 50, 42];
    const CALM = [40, 46, 60, 44, 50, 42];
    const tick = () => {
      const w = hmCineHoldWeight(sceneIndex);
      barsRef.current.forEach((b, k) => {
        if (!b) return;
        const h = BASE[k] + (CALM[k] - BASE[k]) * w;
        b.setAttribute("height", h.toFixed(1));
        b.setAttribute("y", (120 - h).toFixed(1));
        const hot = k === 2;
        b.setAttribute(
          "fill",
          hot ? "rgba(228,106,63,0.9)" : "rgba(240,244,252,0.32)"
        );
      });
      if (flagRef.current)
        flagRef.current.style.opacity = w > 0.4 ? "1" : "0";
      if (stateRef.current) {
        stateRef.current.textContent =
          w > 0.55 ? "Einsparpotenzial erkannt" : "Muster wird sichtbar";
        stateRef.current.setAttribute("fill", "rgba(228,106,63,0.9)");
      }
    };
    return hmCineFrameLoop(tick);
  }, [sceneIndex]);

  return (
    <Glass className="hm-rise w-full max-w-md p-5">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-faint">
          Verbrauch je Einheit
        </p>
        <span className="text-[11px] font-semibold text-ink-dim">
          Heizperiode
        </span>
      </div>
      <svg viewBox="0 0 380 140" className="w-full" aria-hidden>
        <line
          x1="14"
          y1="60"
          x2="366"
          y2="60"
          stroke="rgba(240,244,252,0.18)"
          strokeWidth="1.2"
          strokeDasharray="5 5"
        />
        {Array.from({ length: 6 }, (_, k) => (
          <g key={k}>
            <rect
              ref={(el) => {
                barsRef.current[k] = el;
              }}
              x={30 + k * 58}
              y="40"
              width="26"
              height="80"
              rx="3"
              fill="rgba(240,244,252,0.32)"
            />
            <text
              x={43 + k * 58}
              y="134"
              textAnchor="middle"
              className="hm-viz-label"
              fill="rgba(244,240,232,0.4)"
            >
              WE {k + 1}
            </text>
          </g>
        ))}
        <g ref={flagRef} style={{ opacity: 0, transition: "opacity 0.5s" }}>
          <circle cx="159" cy="48" r="8" fill="none" stroke={"rgba(228,106,63,0.9)"} strokeWidth="1.5" />
          <path d="M159 44 v4 M159 51 v0.5" stroke="rgba(228,106,63,0.9)" strokeWidth="1.6" strokeLinecap="round" />
        </g>
        <text ref={stateRef} x="14" y="20" className="hm-viz-state" />
      </svg>
    </Glass>
  );
}

/* ═══════════════ Abrechnung: Beleg-Karte (groß) ═══════════════ */

export function BelegCard() {
  return (
    <Glass className="w-full max-w-md overflow-hidden">
      <div className="flex items-baseline justify-between gap-3 border-b border-white/8 px-6 pb-4 pt-5">
        <p className="text-sm font-semibold text-ink">{HM_BILL_CLEAR.title}</p>
        <p className="font-mono text-[11px] text-ink-faint">
          {HM_BILL_CLEAR.subtitle}
        </p>
      </div>
      <div className="space-y-3 px-6 py-5">
        {HM_BILL_CLEAR.rows.map((r, k) => (
          <div
            key={r.label}
            className="hm-rise flex items-baseline justify-between gap-4 border-b border-white/5 pb-3 last:border-b-0 last:pb-0"
            style={{ transitionDelay: `${120 + k * 70}ms` }}
          >
            <span className="text-sm text-ink-dim">{r.label}</span>
            <span className="text-right text-sm font-semibold text-ink">
              {r.value}
            </span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between border-t border-white/8 px-6 py-4">
        <span className="inline-flex items-center gap-2 text-xs text-ink-dim">
          <StatusDot color={HEAT} />
          Grundlage für die Betriebskostenabrechnung
        </span>
        <span
          className="hm-beat2 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]"
          style={{
            borderColor: "rgba(228,106,63,0.4)",
            background: "rgba(228,106,63,0.14)",
            color: HEAT,
          }}
        >
          {HM_BILL_CLEAR.badge}
        </span>
      </div>
    </Glass>
  );
}

/* ═══════════════ Ablauf: nummerierter Projektpfad ═══════════════ */

export function AblaufTimeline({
  steps,
  sceneIndex,
}: {
  steps: string[];
  sceneIndex: number;
}) {
  const fillRef = useRef<HTMLDivElement>(null);
  const markRef = useRef<HTMLDivElement>(null);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const tick = () => {
      const w = hmCineHoldWeight(sceneIndex);
      const t = Math.min(1, w * 1.06);
      if (fillRef.current) fillRef.current.style.width = `${(t * 100).toFixed(2)}%`;
      if (markRef.current) {
        markRef.current.style.left = `${(t * 100).toFixed(2)}%`;
        markRef.current.style.opacity = t > 0.005 ? "1" : "0";
      }
      stepRefs.current.forEach((el, k) => {
        if (!el) return;
        const on = t >= (k + 0.35) / steps.length;
        if ((el.dataset.done === "1") !== on) el.dataset.done = on ? "1" : "0";
      });
    };
    return hmCineFrameLoop(tick);
  }, [sceneIndex, steps.length]);

  return (
    <div className="w-full max-w-5xl pt-20">
      <div className="relative mx-2 h-px bg-white/12">
        <div
          ref={fillRef}
          className="absolute left-0 top-0 h-px"
          style={{
            width: "0%",
            background: `linear-gradient(90deg, #2e5696, ${HEAT})`,
            boxShadow: "0 0 12px rgba(228,106,63,0.5)",
          }}
        />
        <div
          ref={markRef}
          aria-hidden
          className="absolute -top-[6px] z-10 -ml-1.5 h-3 w-3 rounded-full transition-opacity duration-300"
          style={{
            left: "0%",
            opacity: 0,
            background: HEAT,
            boxShadow: `0 0 12px ${HEAT}`,
          }}
        />
        <div className="absolute inset-x-0 top-0 flex justify-between">
          {steps.map((s, k) => (
            <div
              key={s}
              ref={(el) => {
                stepRefs.current[k] = el;
              }}
              data-done="0"
              className="hm-step group relative"
              style={{ width: 0 }}
            >
              <span className="hm-step-dot absolute -left-[5px] -top-[5px] block h-2.5 w-2.5 rounded-full border bg-navy-900" />
              <div
                className={`absolute left-1/2 w-28 -translate-x-1/2 sm:w-32 ${
                  k % 2 === 0 ? "top-5" : "bottom-5"
                }`}
              >
                <p className="hm-step-num text-center text-[10px] font-bold tracking-[0.18em]">
                  {String(k + 1).padStart(2, "0")}
                </p>
                <p className="hm-step-label mt-1 text-center text-[11px] leading-snug">
                  {s}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="h-24" />
    </div>
  );
}

/* ═══════════════ System: Dashboard ═══════════════ */

const DASH_EXTRA: { label: string; value: string; bar?: number }[] = [
  { label: "Einheiten erfasst", value: "14", bar: 1 },
  { label: "Fernablesung", value: "Aktiv" },
  { label: "Monatswerte", value: "Vollständig", bar: 1 },
  { label: "CO₂-Aufteilung", value: "Abgebildet" },
  { label: "Offene Rückfragen", value: "0" },
  { label: "Abrechnung", value: "Vorbereitet" },
];

export function SystemDashboard() {
  return (
    <Glass className="w-full max-w-3xl p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-white/8 pb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-faint">
            HeatMieter · Betriebsansicht
          </p>
          <p className="mt-1 text-sm font-semibold text-ink">
            Mehrfamilienhaus · 14 Einheiten · fernablesbar
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold text-ink-dim">
          <StatusDot color={GREEN} />
          Betrieb stabil
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {DASH_EXTRA.map((w, k) => (
          <div
            key={w.label}
            className="hm-rise rounded-xl border border-white/8 bg-white/[0.03] p-3.5"
            style={{ transitionDelay: `${120 + k * 65}ms` }}
          >
            <p className="text-[10px] uppercase tracking-[0.14em] text-ink-faint">
              {w.label}
            </p>
            <p className="mt-1.5 text-lg font-semibold leading-none text-ink">
              {w.value}
            </p>
            {typeof w.bar === "number" && (
              <div className="mt-2.5 h-1 w-full rounded bg-white/8">
                <div
                  className="hm-bar-fill h-full rounded"
                  style={
                    {
                      "--bar": `${Math.round(w.bar * 100)}%`,
                      background: `linear-gradient(90deg, ${HEAT}, #f2b98a)`,
                      transitionDelay: `${300 + k * 65}ms`,
                    } as React.CSSProperties
                  }
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </Glass>
  );
}

/* ═══════════════ Admin-Widgets (kompakt, für schmale Szenen) ═══════════════ */

export function AdminWidgets() {
  const dot = (state?: string) =>
    state === "warn" ? "#e8b23c" : state === "info" ? HEAT : GREEN;
  return (
    <Glass className="w-full max-w-sm p-5">
      <div className="mb-4 flex items-center justify-between border-b border-white/8 pb-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-faint">
          Objekt · Verwaltung
        </p>
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-ink-dim">
          <StatusDot color={GREEN} /> Live
        </span>
      </div>
      <div className="space-y-1.5">
        {HM_ADMIN_WIDGETS.map((w, k) => (
          <div
            key={w.label}
            className="hm-rise flex items-center justify-between rounded-lg px-2.5 py-2"
            style={{ transitionDelay: `${100 + k * 60}ms` }}
          >
            <span className="inline-flex items-center gap-2.5 text-sm text-ink-dim">
              <StatusDot color={dot(w.state)} />
              {w.label}
            </span>
            <span className="text-sm font-semibold text-ink">{w.value}</span>
          </div>
        ))}
      </div>
    </Glass>
  );
}

/* ═══════════════ gemeinsame Overlay-Styles ═══════════════ */

export function OverlayStyles() {
  return (
    <style jsx global>{`
      .hm-rise {
        opacity: 0;
        transform: translateY(24px);
        transition: opacity 0.7s var(--ease-calm),
          transform 0.7s var(--ease-calm);
      }
      [data-on="1"] .hm-rise {
        opacity: 1;
        transform: none;
      }

      .hm-beat2 {
        opacity: 0;
        transform: translateY(24px);
        transition: opacity 0.7s var(--ease-calm),
          transform 0.7s var(--ease-calm);
      }
      [data-on="1"][data-beat="2"] .hm-beat2 {
        opacity: 1;
        transform: none;
      }

      .hm-step-dot {
        border-color: rgba(244, 240, 232, 0.25);
        transition: border-color 0.4s var(--ease-calm),
          background 0.4s var(--ease-calm), box-shadow 0.4s var(--ease-calm);
      }
      .hm-step[data-done="1"] .hm-step-dot {
        border-color: var(--color-mod-heat);
        background: rgba(228, 106, 63, 0.25);
        box-shadow: 0 0 10px rgba(228, 106, 63, 0.55);
      }
      .hm-step-num {
        color: rgba(244, 240, 232, 0.3);
        transition: color 0.4s var(--ease-calm);
      }
      .hm-step[data-done="1"] .hm-step-num {
        color: var(--color-mod-heat);
      }
      .hm-step-label {
        color: rgba(244, 240, 232, 0.38);
        transition: color 0.4s var(--ease-calm);
      }
      .hm-step[data-done="1"] .hm-step-label {
        color: rgba(244, 240, 232, 0.82);
      }

      .hm-bar-fill {
        width: 0%;
        transition: width 1.1s var(--ease-calm);
      }
      [data-on="1"] .hm-bar-fill {
        width: var(--bar);
      }

      .hm-live-pulse {
        animation: hm-live 2.1s var(--ease-calm) infinite;
      }
      @keyframes hm-live {
        0%,
        100% {
          opacity: 0.5;
        }
        50% {
          opacity: 1;
        }
      }

      .hm-viz-label {
        font-size: 10px;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        font-weight: 600;
      }
      .hm-viz-state {
        font-size: 11px;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        font-weight: 700;
      }

      @media (prefers-reduced-motion: reduce) {
        .hm-rise,
        .hm-beat2 {
          opacity: 1 !important;
          transform: none !important;
          transition: none !important;
        }
        .hm-live-pulse {
          animation: none !important;
        }
      }
    `}</style>
  );
}
