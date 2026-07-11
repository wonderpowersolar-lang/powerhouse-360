"use client";

import { useEffect, useRef } from "react";
import {
  CM_COMPLEXITY_LABELS,
  CM_BENEFITS,
  CM_OWNER_CARDS,
  CM_ADMIN_WIDGETS,
  CM_SESSION_CARD,
  CM_TENANT_BENEFITS,
  CM_LOAD_LABELS,
  CM_BILLING_FIELDS,
  CM_FUNDING_STEPS,
  CM_JOURNEY_STEPS,
  CM_DASHBOARD_WIDGETS,
} from "@/content/chargemieter";
import { cmHoldWeight, cmFrameLoop } from "@/lib/chargeProgress";

/**
 * ChargeMieter — Szenen-Overlays.
 *
 * Schwebende Glas-UI über der Bühne. Alle Overlays werden vom umgebenden
 * ChargePanel über `data-on` (Copy sichtbar) und `data-beat` (0 · 1 · 2,
 * aus dem Hold-Gewicht) getaktet — CSS-Transitions erledigen die Reveals,
 * nur Lastkurve und Projektpfad lesen das Hold-Gewicht pro Frame.
 */

const CYAN = "var(--color-mod-charge)";
const GREEN = "var(--color-brand-green)";
const GOLD = "var(--color-mod-power)";

/** Glas-Karte — die Grundfläche aller schwebenden UI-Elemente. */
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

/* ═══════════════════ 1 · Komplexitäts-Labels (Chaos → Ordnung) ═══════════ */

/** Streu-Transformationen je Chip (Chaos-Zustand). */
const SCATTER = [
  { x: -6, y: -40, r: -7 },
  { x: 42, y: 18, r: 5 },
  { x: -30, y: 62, r: -4 },
  { x: 60, y: -26, r: 8 },
  { x: -52, y: 8, r: 6 },
  { x: 26, y: 78, r: -6 },
  { x: -12, y: 132, r: 4 },
  { x: 54, y: 116, r: -8 },
];

export function ComplexityCloud() {
  return (
    <div className="cm-complexity relative">
      <div className="grid grid-cols-2 gap-3">
        {CM_COMPLEXITY_LABELS.map((label, k) => (
          <div
            key={label}
            className="cm-chaos-chip rounded-xl border border-white/12 bg-[rgba(14,16,20,0.6)] px-4 py-3 text-sm font-medium text-ink-dim backdrop-blur-md"
            style={
              {
                "--sx": `${SCATTER[k].x}px`,
                "--sy": `${SCATTER[k].y}px`,
                "--sr": `${SCATTER[k].r}deg`,
                transitionDelay: `${k * 60}ms`,
              } as React.CSSProperties
            }
          >
            <span className="cm-chaos-dot mr-2 inline-block h-1.5 w-1.5 rounded-full align-middle" />
            {label}
          </div>
        ))}
      </div>
      {/* Ordnungsrahmen erscheint erst im geordneten Zustand */}
      <div className="cm-order-frame pointer-events-none absolute -inset-4 rounded-2xl border" />
      <p className="cm-order-caption mt-4 text-xs font-semibold uppercase tracking-[0.2em]">
        Ein System statt acht Baustellen
      </p>
    </div>
  );
}

/* ═══════════════════ 2 · Leistungsbausteine ═══════════════════ */

export function BenefitChips({ items = CM_BENEFITS }: { items?: string[] }) {
  return (
    <div className="flex max-w-md flex-wrap gap-3">
      {items.map((b, k) => (
        <div
          key={b}
          className="cm-rise inline-flex items-center gap-2.5 rounded-full border border-white/12 bg-[rgba(14,16,20,0.6)] px-4 py-2.5 text-sm font-medium text-ink backdrop-blur-md"
          style={{ transitionDelay: `${120 + k * 70}ms` }}
        >
          <StatusDot color={CYAN} />
          {b}
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════ 3 · Eigentümer: Ausbauphasen ═══════════════════ */

export function OwnerPhases() {
  const phases = [
    { name: "Phase 1", detail: "Tiefgarage · erste Reihe", n: 4 },
    { name: "Phase 2", detail: "Tiefgarage · zweite Reihe", n: 4 },
    { name: "Phase 3", detail: "Außenstellplätze", n: 6 },
  ];
  return (
    <div className="w-full max-w-sm space-y-3">
      {phases.map((p, k) => (
        <Glass
          key={p.name}
          className={`cm-rise cm-phase px-5 py-4 cm-phase-${k}`}
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-ink">{p.name}</p>
            <div className="flex gap-1.5">
              {Array.from({ length: p.n }, (_, i) => (
                <span
                  key={i}
                  className="cm-phase-dot h-1.5 w-4 rounded-full"
                  style={{ transitionDelay: `${i * 90}ms` }}
                />
              ))}
            </div>
          </div>
          <p className="mt-1 text-xs text-ink-faint">{p.detail}</p>
        </Glass>
      ))}
      <div
        className="cm-rise flex flex-wrap items-center gap-2 pt-1"
        style={{ transitionDelay: "500ms" }}
      >
        {CM_OWNER_CARDS.map((c) => (
          <span
            key={c}
            className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-medium text-ink-dim"
          >
            {c}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════ 4 · Verwaltung: Objekt-Board ═══════════════════ */

export function AdminBoard() {
  const dot = (state?: string) =>
    state === "warn" ? GOLD : state === "info" ? CYAN : GREEN;
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
        {CM_ADMIN_WIDGETS.map((w, k) => (
          <div
            key={w.label}
            className="cm-rise flex items-center justify-between rounded-lg px-2.5 py-2 transition-colors hover:bg-white/[0.03]"
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

/* ═══════════════════ 5 · Mieter: Ladekarte ═══════════════════ */

export function SessionCard() {
  return (
    <div className="w-full max-w-sm space-y-4">
      <Glass className="cm-rise overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-4">
          <p className="text-sm font-semibold text-ink">
            {CM_SESSION_CARD.title}
          </p>
          <span
            className="cm-live-pulse inline-flex h-2 w-2 rounded-full"
            style={{ background: GREEN, boxShadow: `0 0 10px ${GREEN}` }}
          />
        </div>
        <div className="space-y-2 px-5 py-4">
          {CM_SESSION_CARD.rows.map((r) => (
            <div key={r.label} className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-[0.14em] text-ink-faint">
                {r.label}
              </span>
              <span className="text-sm font-medium text-ink">{r.value}</span>
            </div>
          ))}
        </div>
        {/* Ladefortschritt */}
        <div className="h-1 w-full bg-white/5">
          <div className="cm-charge-bar h-full w-1/2" />
        </div>
      </Glass>
      <div
        className="cm-rise flex flex-wrap gap-2"
        style={{ transitionDelay: "260ms" }}
      >
        {CM_TENANT_BENEFITS.map((b) => (
          <span
            key={b}
            className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-medium text-ink-dim"
          >
            {b}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════ 6 · Lastmanagement: Balance-Viz ═══════════════════ */

export function LoadBalanceViz({
  sceneIndex = 6,
  staticBalanced = false,
}: {
  sceneIndex?: number;
  staticBalanced?: boolean;
}) {
  const barsRef = useRef<(SVGRectElement | null)[]>([]);
  const curveRef = useRef<SVGPolylineElement>(null);
  const stateRef = useRef<SVGTextElement>(null);

  useEffect(() => {
    const CHAOS = [66, 22, 88, 30, 76, 16];
    const CALM = [46, 42, 50, 44, 48, 42];
    const tick = () => {
      const w = staticBalanced ? 1 : cmHoldWeight(sceneIndex);
      barsRef.current.forEach((b, k) => {
        if (!b) return;
        const h = CHAOS[k] + (CALM[k] - CHAOS[k]) * w;
        b.setAttribute("height", h.toFixed(1));
        b.setAttribute("y", (150 - h).toFixed(1));
        const over = h > 60;
        b.setAttribute(
          "fill",
          over ? "rgba(230,151,60,0.85)" : "rgba(86,200,232,0.85)"
        );
      });
      if (curveRef.current) {
        const pts = Array.from({ length: 13 }, (_, i) => {
          const x = 20 + i * 30;
          const chaos = 40 + Math.sin(i * 2.1) * 26 + (i % 3) * 9;
          const calm = 52 + Math.sin(i * 0.7) * 5;
          const y = 150 - (chaos + (calm - chaos) * w);
          return `${x},${y.toFixed(1)}`;
        }).join(" ");
        curveRef.current.setAttribute("points", pts);
        curveRef.current.setAttribute(
          "stroke",
          w > 0.75 ? "rgba(67,182,73,0.9)" : "rgba(230,185,78,0.8)"
        );
      }
      if (stateRef.current) {
        stateRef.current.textContent =
          w > 0.75 ? "Ausgeglichen · alle Ladepunkte aktiv" : "Lastspitzen erkannt";
        stateRef.current.setAttribute(
          "fill",
          w > 0.75 ? "rgba(67,182,73,0.9)" : "rgba(230,151,60,0.9)"
        );
      }
    };
    if (staticBalanced) {
      tick();
      return;
    }
    return cmFrameLoop(tick);
  }, [sceneIndex, staticBalanced]);

  return (
    <div className="w-full max-w-md">
      <Glass className="cm-rise p-5">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-faint">
            Lastmanagement
          </p>
          <span className="text-[11px] font-semibold text-ink-dim">
            Netzanschluss geschützt
          </span>
        </div>
        <svg viewBox="0 0 420 170" className="w-full" aria-hidden>
          {/* verfügbare Leistung */}
          <line
            x1="16"
            y1="70"
            x2="404"
            y2="70"
            stroke="rgba(230,185,78,0.55)"
            strokeWidth="1.4"
            strokeDasharray="6 5"
          />
          <text x="16" y="60" className="cm-viz-label" fill="rgba(230,185,78,0.8)">
            Verfügbare Leistung
          </text>
          {/* Ladepunkt-Balken */}
          {Array.from({ length: 6 }, (_, k) => (
            <g key={k}>
              <rect
                ref={(el) => {
                  barsRef.current[k] = el;
                }}
                x={40 + k * 62}
                y="90"
                width="18"
                height="60"
                rx="3"
                fill="rgba(86,200,232,0.85)"
              />
              <text
                x={49 + k * 62}
                y="164"
                textAnchor="middle"
                className="cm-viz-label"
                fill="rgba(244,240,232,0.4)"
              >
                LP{k + 1}
              </text>
            </g>
          ))}
          {/* Gebäudelast-Kurve */}
          <polyline
            ref={curveRef}
            points=""
            fill="none"
            strokeWidth="1.8"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <text ref={stateRef} x="16" y="22" className="cm-viz-state" />
        </svg>
      </Glass>
      <div
        className="cm-rise mt-3 flex flex-wrap gap-2"
        style={{ transitionDelay: "240ms" }}
      >
        {CM_LOAD_LABELS.map((l) => (
          <span
            key={l}
            className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-medium text-ink-dim"
          >
            {l}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════ 7 · Abrechnung: Datensatz-Fluss ═══════════════════ */

export function BillingFlow() {
  return (
    <div className="w-full max-w-sm space-y-3">
      {/* Ladevorgang → wird Datensatz */}
      <Glass className="cm-rise px-5 py-3.5">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-2.5 text-sm font-medium text-ink">
            <StatusDot color={CYAN} />
            Ladevorgang beendet
          </span>
          <span className="text-xs text-ink-faint">18,4 kWh</span>
        </div>
      </Glass>

      <div
        className="cm-rise flex justify-center"
        style={{ transitionDelay: "160ms" }}
      >
        <svg width="18" height="22" viewBox="0 0 18 22" aria-hidden>
          <path
            d="M9 1 v16 M3 12 l6 6 6-6"
            stroke="rgba(230,185,78,0.7)"
            strokeWidth="1.6"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* abrechnungsfähiger Datensatz */}
      <Glass className="cm-rise overflow-hidden" >
        <div className="border-b border-white/8 px-5 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-faint">
            Abrechnungsfähiger Datensatz
          </p>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 px-5 py-4">
          {CM_BILLING_FIELDS.map((f, k) => (
            <div
              key={f.label}
              className="cm-rise"
              style={{ transitionDelay: `${240 + k * 55}ms` }}
            >
              <p className="text-[10px] uppercase tracking-[0.15em] text-ink-faint">
                {f.label}
              </p>
              <p className="mt-0.5 text-sm font-medium text-ink">{f.value}</p>
            </div>
          ))}
        </div>
      </Glass>

      {/* Monatsübersicht */}
      <Glass
        className="cm-rise cm-beat2 px-5 py-3.5"
      >
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-2.5 text-sm font-medium text-ink">
            <StatusDot color={GOLD} />
            Monatsübersicht · 42 Ladevorgänge
          </span>
          <span className="text-xs font-semibold" style={{ color: "var(--color-brand-green)" }}>
            Bereit
          </span>
        </div>
      </Glass>
    </div>
  );
}

/* ═══════════════════ 8 · Förderung: Checkliste ═══════════════════ */

export function FundingChecklist() {
  return (
    <Glass className="w-full max-w-sm p-5">
      <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-ink-faint">
        Erste Einordnung
      </p>
      <div className="space-y-2.5">
        {CM_FUNDING_STEPS.map((s, k) => (
          <div
            key={s}
            className="cm-rise flex items-center gap-3"
            style={{ transitionDelay: `${120 + k * 110}ms` }}
          >
            <span
              className="cm-check flex h-5 w-5 items-center justify-center rounded-full border"
              style={{ transitionDelay: `${300 + k * 110}ms` }}
            >
              <svg width="10" height="8" viewBox="0 0 10 8" aria-hidden>
                <path
                  d="M1 4 l2.6 2.6 L9 1"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span className="text-sm text-ink-dim">{s}</span>
          </div>
        ))}
      </div>
      <p
        className="cm-rise mt-4 border-t border-white/8 pt-3 text-[11px] leading-relaxed text-ink-faint"
        style={{ transitionDelay: "720ms" }}
      >
        Förderprogramme sind abhängig von Programm, Objekt und Zeitpunkt — wir
        ordnen ein und bereiten professionell vor.
      </p>
    </Glass>
  );
}

/* ═══════════════════ 9 · Ablauf: Projektpfad ═══════════════════ */

export function JourneyTimeline({ sceneIndex = 9 }: { sceneIndex?: number }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const carRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const tick = () => {
      const w = cmHoldWeight(sceneIndex);
      const t = Math.min(1, w * 1.06);
      if (fillRef.current) fillRef.current.style.width = `${(t * 100).toFixed(2)}%`;
      if (carRef.current) {
        carRef.current.style.left = `${(t * 100).toFixed(2)}%`;
        carRef.current.style.opacity = t > 0.005 ? "1" : "0";
      }
      stepRefs.current.forEach((el, k) => {
        if (!el) return;
        const on = t >= (k + 0.35) / CM_JOURNEY_STEPS.length;
        if ((el.dataset.done === "1") !== on)
          el.dataset.done = on ? "1" : "0";
      });
    };
    return cmFrameLoop(tick);
  }, [sceneIndex]);

  return (
    <div className="w-full max-w-5xl pt-20" ref={trackRef}>
      <div className="relative mx-2 h-px bg-white/12">
        <div
          ref={fillRef}
          className="absolute left-0 top-0 h-px"
          style={{
            width: "0%",
            background: `linear-gradient(90deg, ${CYAN}, var(--color-brand-green))`,
            boxShadow: "0 0 12px rgba(86,200,232,0.5)",
          }}
        />
        {/* Auto-Marker */}
        <div
          ref={carRef}
          aria-hidden
          className="absolute -top-[13px] z-10 -ml-3.5 transition-opacity duration-300"
          style={{ left: "0%", opacity: 0 }}
        >
          <svg width="28" height="14" viewBox="0 0 28 14">
            <path
              d="M2 10 q1-4 5-5 l4-3 q1-1 3-1 h4 q2 0 3 1 l3 3 q4 1 4 5 z"
              fill="#0e1014"
              stroke={CYAN}
              strokeWidth="1.3"
            />
            <circle cx="8" cy="11" r="2.4" fill="#0e1014" stroke={CYAN} strokeWidth="1.2" />
            <circle cx="20" cy="11" r="2.4" fill="#0e1014" stroke={CYAN} strokeWidth="1.2" />
          </svg>
        </div>
        {/* Meilensteine */}
        <div className="absolute inset-x-0 top-0 flex justify-between">
          {CM_JOURNEY_STEPS.map((s, k) => (
            <div
              key={s}
              ref={(el) => {
                stepRefs.current[k] = el;
              }}
              data-done="0"
              className="cm-step group relative"
              style={{ width: 0 }}
            >
              <span className="cm-step-dot absolute -left-[5px] -top-[5px] block h-2.5 w-2.5 rounded-full border bg-navy-900" />
              <div
                className={`absolute left-1/2 w-28 -translate-x-1/2 sm:w-32 ${
                  k % 2 === 0 ? "top-5" : "bottom-5"
                }`}
              >
                <p className="cm-step-num text-center text-[10px] font-bold tracking-[0.18em]">
                  {String(k + 1).padStart(2, "0")}
                </p>
                <p className="cm-step-label mt-1 text-center text-[11px] leading-snug">
                  {s}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Höhe für die alternierenden Labels */}
      <div className="h-24" />
    </div>
  );
}

/** Statische vertikale Ablauf-Liste (Mobile). */
export function JourneyList() {
  return (
    <ol className="space-y-0">
      {CM_JOURNEY_STEPS.map((s, k) => (
        <li key={s} className="relative flex gap-4 pb-5 last:pb-0">
          {k < CM_JOURNEY_STEPS.length - 1 && (
            <span
              aria-hidden
              className="absolute left-[13px] top-7 h-[calc(100%-1.25rem)] w-px bg-white/12"
            />
          )}
          <span
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold"
            style={{
              borderColor: "rgba(86,200,232,0.5)",
              color: "var(--color-mod-charge)",
              background: "rgba(86,200,232,0.08)",
            }}
          >
            {k + 1}
          </span>
          <span className="pt-1 text-sm text-ink-dim">{s}</span>
        </li>
      ))}
    </ol>
  );
}

/* ═══════════════════ 10 · Plattform: Dashboard ═══════════════════ */

export function DashboardPanel() {
  return (
    <Glass className="w-full max-w-3xl p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-white/8 pb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-faint">
            ChargeMieter · Betriebsansicht
          </p>
          <p className="mt-1 text-sm font-semibold text-ink">
            Mehrfamilienhaus · 12 WE · 14 Ladepunkte
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold text-ink-dim">
          <StatusDot color={GREEN} />
          Betrieb stabil
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {CM_DASHBOARD_WIDGETS.map((w, k) => (
          <div
            key={w.label}
            className="cm-rise rounded-xl border border-white/8 bg-white/[0.03] p-3.5"
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
                  className="cm-bar-fill h-full rounded"
                  style={
                    {
                      "--bar": `${Math.round(w.bar * 100)}%`,
                      background: `linear-gradient(90deg, ${CYAN}, var(--color-brand-green))`,
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

/* ═══════════════════ gemeinsame Overlay-Styles ═══════════════════ */

export function OverlayStyles() {
  return (
    <style jsx global>{`
      /* Grund-Reveal: steigt weich ein, sobald die Szene steht */
      .cm-rise {
        opacity: 0;
        transform: translateY(24px);
        transition: opacity 0.7s var(--ease-calm),
          transform 0.7s var(--ease-calm);
      }
      [data-on="1"] .cm-rise {
        opacity: 1;
        transform: none;
      }

      /* Beat 2 — Elemente, die erst spät in der Szene erscheinen */
      .cm-beat2 {
        transition-delay: 0ms !important;
      }
      [data-beat="2"] .cm-beat2 {
        opacity: 1;
        transform: none;
      }
      [data-on="1"] .cm-beat2 {
        opacity: 0;
        transform: translateY(24px);
      }
      [data-on="1"][data-beat="2"] .cm-beat2 {
        opacity: 1;
        transform: none;
      }

      /* Komplexität: Chaos-Streuung → Ordnung im Beat 2 */
      .cm-chaos-chip {
        opacity: 0;
        transform: translate(var(--sx), var(--sy)) rotate(var(--sr)) scale(0.96);
        transition: opacity 0.6s var(--ease-calm),
          transform 1.05s var(--ease-calm), border-color 0.6s var(--ease-calm);
      }
      [data-on="1"] .cm-chaos-chip {
        opacity: 1;
      }
      [data-beat="2"] .cm-chaos-chip {
        transform: none;
        border-color: rgba(86, 200, 232, 0.28);
      }
      .cm-chaos-dot {
        background: rgba(230, 151, 60, 0.9);
        box-shadow: 0 0 8px rgba(230, 151, 60, 0.7);
        transition: background 0.7s var(--ease-calm),
          box-shadow 0.7s var(--ease-calm);
      }
      [data-beat="2"] .cm-chaos-dot {
        background: var(--color-mod-charge);
        box-shadow: 0 0 8px rgba(86, 200, 232, 0.7);
      }
      .cm-order-frame {
        opacity: 0;
        border-color: rgba(86, 200, 232, 0.3);
        transition: opacity 0.9s var(--ease-calm);
      }
      [data-beat="2"] .cm-order-frame {
        opacity: 1;
      }
      .cm-order-caption {
        color: rgba(86, 200, 232, 0);
        transition: color 0.9s var(--ease-calm);
      }
      [data-beat="2"] .cm-order-caption {
        color: rgba(86, 200, 232, 0.85);
      }

      /* Phasen-Dots füllen sequenziell */
      .cm-phase-dot {
        background: rgba(244, 240, 232, 0.12);
        transition: background 0.6s var(--ease-calm),
          box-shadow 0.6s var(--ease-calm);
      }
      [data-beat="1"] .cm-phase-0 .cm-phase-dot,
      [data-beat="2"] .cm-phase-0 .cm-phase-dot {
        background: var(--color-mod-charge);
        box-shadow: 0 0 8px rgba(86, 200, 232, 0.5);
      }
      [data-beat="2"] .cm-phase-1 .cm-phase-dot {
        background: var(--color-mod-charge);
        box-shadow: 0 0 8px rgba(86, 200, 232, 0.5);
      }
      [data-beat="2"] .cm-phase-2 .cm-phase-dot {
        background: var(--color-mod-power);
        box-shadow: 0 0 8px rgba(230, 185, 78, 0.5);
      }

      /* Mieter: Lade-Fortschritt + Live-Puls */
      .cm-charge-bar {
        background: linear-gradient(
          90deg,
          var(--color-mod-charge),
          var(--color-brand-green)
        );
        animation: cm-charge 3.2s var(--ease-calm) infinite alternate;
      }
      @keyframes cm-charge {
        from {
          width: 34%;
        }
        to {
          width: 72%;
        }
      }
      .cm-live-pulse {
        animation: cm-live 2.1s var(--ease-calm) infinite;
      }
      @keyframes cm-live {
        0%,
        100% {
          opacity: 0.5;
        }
        50% {
          opacity: 1;
        }
      }

      /* Förder-Checkliste */
      .cm-check {
        border-color: rgba(244, 240, 232, 0.2);
        color: transparent;
        transition: border-color 0.5s var(--ease-calm),
          color 0.5s var(--ease-calm), background 0.5s var(--ease-calm);
      }
      [data-beat="1"] .cm-check,
      [data-beat="2"] .cm-check {
        border-color: rgba(67, 182, 73, 0.6);
        background: rgba(67, 182, 73, 0.12);
        color: var(--color-brand-green);
      }

      /* Ablauf-Meilensteine */
      .cm-step-dot {
        border-color: rgba(244, 240, 232, 0.25);
        transition: border-color 0.4s var(--ease-calm),
          background 0.4s var(--ease-calm), box-shadow 0.4s var(--ease-calm);
      }
      .cm-step[data-done="1"] .cm-step-dot {
        border-color: var(--color-mod-charge);
        background: rgba(86, 200, 232, 0.25);
        box-shadow: 0 0 10px rgba(86, 200, 232, 0.55);
      }
      .cm-step-num {
        color: rgba(244, 240, 232, 0.3);
        transition: color 0.4s var(--ease-calm);
      }
      .cm-step[data-done="1"] .cm-step-num {
        color: var(--color-mod-charge);
      }
      .cm-step-label {
        color: rgba(244, 240, 232, 0.38);
        transition: color 0.4s var(--ease-calm);
      }
      .cm-step[data-done="1"] .cm-step-label {
        color: rgba(244, 240, 232, 0.82);
      }

      /* Dashboard-Balken */
      .cm-bar-fill {
        width: 0%;
        transition: width 1.1s var(--ease-calm);
      }
      [data-on="1"] .cm-bar-fill {
        width: var(--bar);
      }

      .cm-viz-label {
        font-size: 10px;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        font-weight: 600;
      }
      .cm-viz-state {
        font-size: 11px;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        font-weight: 700;
      }

      @media (prefers-reduced-motion: reduce) {
        .cm-rise,
        .cm-chaos-chip,
        .cm-beat2 {
          opacity: 1 !important;
          transform: none !important;
          transition: none !important;
        }
        .cm-charge-bar,
        .cm-live-pulse {
          animation: none !important;
        }
      }
    `}</style>
  );
}
