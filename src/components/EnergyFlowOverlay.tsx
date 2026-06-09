"use client";

import { useState } from "react";

/**
 * Energy-flow building hero (REF-E "EnerSmart" template, rebranded POWERHOUSE360).
 *
 * A realistic building glyph in the centre with four connected energy cards:
 *   • PV vom Dach   (amber, top)        — 18,6 kW / 58 %
 *   • Netzstrom     (blue,  left)       — 4,2 kW  / 26 %
 *   • Gebäude       (teal,  right)      — 12,8 kW / 40 %
 *   • Wärmepumpe    (orange, lower-r)   — 2,4 kW  / 12 %
 * joined by glowing animated flow lines. A Vermieter/Mieter toggle reframes the
 * figures (whole building vs. single apartment).
 *
 * Designed to live inside the light "app window" of the PowerPilot dashboard, so
 * it defaults to a light surface; pass `light={false}` for the dark variant.
 */

type View = "vermieter" | "mieter";

interface FlowNode {
  id: string;
  pos: "top" | "left" | "right" | "lower";
  title: string;
  value: string;
  unit: string;
  share: string;
  hint: string;
  accent: string;
  icon: React.ReactNode;
}

const DATA: Record<View, FlowNode[]> = {
  vermieter: [
    { id: "pv", pos: "top", title: "PV vom Dach", value: "18,6", unit: "kW", share: "58 %", hint: "Erzeugung", accent: "#ec7b13", icon: <SunIcon /> },
    { id: "grid", pos: "left", title: "Netzstrom", value: "4,2", unit: "kW", share: "26 %", hint: "Bezug", accent: "#5b9bd5", icon: <GridIcon /> },
    { id: "building", pos: "right", title: "Gebäude", value: "12,8", unit: "kW", share: "40 %", hint: "Eigenverbrauch", accent: "#2bb6b0", icon: <BuildingIcon /> },
    { id: "heatpump", pos: "lower", title: "Wärmepumpe", value: "2,4", unit: "kW", share: "12 %", hint: "Wärme", accent: "#ef8b3a", icon: <HeatIcon /> },
  ],
  mieter: [
    { id: "pv", pos: "top", title: "PV vom Dach", value: "4,6", unit: "kW", share: "61 %", hint: "Mein Anteil", accent: "#ec7b13", icon: <SunIcon /> },
    { id: "grid", pos: "left", title: "Netzstrom", value: "2,1", unit: "kW", share: "28 %", hint: "Bezug", accent: "#5b9bd5", icon: <GridIcon /> },
    { id: "building", pos: "right", title: "Wohnung", value: "2,6", unit: "kW", share: "39 %", hint: "Mein Verbrauch", accent: "#43b649", icon: <HomeIcon /> },
    { id: "heatpump", pos: "lower", title: "Wärmepumpe", value: "1,3", unit: "kW", share: "14 %", hint: "Wärme", accent: "#ef8b3a", icon: <HeatIcon /> },
  ],
};

export default function EnergyFlowOverlay({
  light = true,
  showToggle = true,
}: {
  light?: boolean;
  showToggle?: boolean;
}) {
  const [view, setView] = useState<View>("vermieter");
  const nodes = DATA[view];

  return (
    <div className="relative w-full">
      {showToggle && (
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className={`text-sm font-bold ${light ? "text-navy-900" : "text-ink"}`}>
              Energiefluss
            </p>
            <p className={`text-xs ${light ? "text-slate-blue-500" : "text-ink-faint"}`}>
              Echtzeit-Bilanz
            </p>
          </div>
          <div
            role="tablist"
            aria-label="Energie-Ansicht"
            className={`pointer-events-auto inline-flex rounded-full p-1 ${
              light ? "bg-slate-100" : "border border-white/12 bg-white/[0.05]"
            }`}
          >
            {(["vermieter", "mieter"] as View[]).map((v) => (
              <button
                key={v}
                role="tab"
                aria-selected={view === v}
                onClick={() => setView(v)}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold tracking-wide transition-colors ${
                  view === v
                    ? "bg-brand-green text-white shadow-sm"
                    : light
                    ? "text-slate-blue-500 hover:text-navy-900"
                    : "text-ink-dim hover:text-ink"
                }`}
              >
                {v === "vermieter" ? "Vermieter" : "Mieter"}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* hero grid: 3×3 with the building glyph in the centre */}
      <div className="relative">
        <FlowLines />
        <div className="relative grid grid-cols-3 grid-rows-[auto_auto_auto] gap-3">
          {/* row 1: PV (top, centre) */}
          <div className="col-start-2 row-start-1">
            <FlowCard node={nodes.find((n) => n.pos === "top")!} light={light} />
          </div>
          {/* row 2: grid (left) · building glyph (centre) · gebäude (right) */}
          <div className="col-start-1 row-start-2 self-center">
            <FlowCard node={nodes.find((n) => n.pos === "left")!} light={light} />
          </div>
          <div className="col-start-2 row-start-2 flex items-center justify-center">
            <BuildingGlyph light={light} />
          </div>
          <div className="col-start-3 row-start-2 self-center">
            <FlowCard node={nodes.find((n) => n.pos === "right")!} light={light} />
          </div>
          {/* row 3: Wärmepumpe (lower-right) */}
          <div className="col-start-3 row-start-3">
            <FlowCard node={nodes.find((n) => n.pos === "lower")!} light={light} />
          </div>
        </div>
      </div>
    </div>
  );
}

function FlowCard({ node, light }: { node: FlowNode; light: boolean }) {
  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border p-3.5 transition-all ${
        light
          ? "border-slate-200 bg-white text-navy-900 shadow-[0_8px_24px_-12px_rgba(15,30,60,0.18)]"
          : "border-white/10 bg-white/[0.04] text-ink"
      }`}
    >
      <span aria-hidden className="absolute inset-x-0 top-0 h-1" style={{ background: node.accent }} />
      <div className="flex items-center justify-between gap-2">
        <span
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg"
          style={{ background: `${node.accent}1f`, color: node.accent }}
        >
          {node.icon}
        </span>
        <span
          className="rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums"
          style={{ background: `${node.accent}1f`, color: node.accent }}
        >
          {node.share}
        </span>
      </div>
      <p className={`mt-2 text-xs font-semibold ${light ? "text-slate-blue-500" : "text-ink-dim"}`}>
        {node.title}
      </p>
      <p className="mt-0.5 flex items-baseline gap-1 tabular-nums">
        <span className="text-xl font-bold" style={{ color: light ? "#16243f" : node.accent }}>
          {node.value}
        </span>
        <span className={`text-xs font-semibold ${light ? "text-slate-blue-400" : "text-ink-dim"}`}>
          {node.unit}
        </span>
      </p>
      <p className={`text-[11px] ${light ? "text-slate-blue-400" : "text-ink-faint"}`}>{node.hint}</p>
    </div>
  );
}

/** A small isometric building glyph at the centre of the flow hero. */
function BuildingGlyph({ light }: { light: boolean }) {
  return (
    <div
      className={`relative grid h-28 w-28 place-items-center rounded-2xl ${
        light ? "bg-gradient-to-br from-emerald-50 to-sky-50" : "bg-white/[0.04]"
      }`}
    >
      <svg width="76" height="76" viewBox="0 0 80 80" fill="none">
        {/* PV roof */}
        <path d="M22 26 L40 16 L58 26 L40 36 Z" fill="#ec7b13" opacity="0.9" />
        <path d="M28 25 L40 19 M34 28 L46 22 M40 31 L52 25" stroke="#fff" strokeWidth="1" opacity="0.6" />
        {/* body */}
        <path d="M22 26 L22 58 L40 66 L40 36 Z" fill={light ? "#1b2a4a" : "#2bb6b0"} opacity="0.92" />
        <path d="M58 26 L58 58 L40 66 L40 36 Z" fill={light ? "#16243f" : "#1b2a4a"} opacity="0.95" />
        {/* windows */}
        {[0, 1, 2].map((r) =>
          [0, 1].map((c) => (
            <rect key={`l${r}${c}`} x={26 + c * 6} y={32 + r * 9} width="3.5" height="5" fill="#80cec1" opacity="0.85" />
          ))
        )}
        {[0, 1, 2].map((r) =>
          [0, 1].map((c) => (
            <rect key={`r${r}${c}`} x={45 + c * 6} y={32 + r * 9} width="3.5" height="5" fill="#43b649" opacity="0.7" />
          ))
        )}
      </svg>
    </div>
  );
}

/** Decorative animated flow lines connecting the four cards through the centre. */
function FlowLines() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 400 280"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-0 h-full w-full opacity-60"
    >
      <defs>
        <marker id="chev2" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
          <path d="M1,1 L4,3 L1,5" fill="none" stroke="currentColor" strokeWidth="1.3" />
        </marker>
      </defs>
      {/* PV(top) → centre */}
      <path d="M200,46 L200,118" fill="none" stroke="#ec7b13" strokeWidth="2.2" strokeDasharray="5 7" markerEnd="url(#chev2)" style={{ color: "#ec7b13" }} className="ph-flow" />
      {/* grid(left) → centre */}
      <path d="M92,140 L168,140" fill="none" stroke="#5b9bd5" strokeWidth="2.2" strokeDasharray="5 7" markerEnd="url(#chev2)" style={{ color: "#5b9bd5" }} className="ph-flow ph-flow-2" />
      {/* centre → gebäude(right) */}
      <path d="M232,140 L308,140" fill="none" stroke="#2bb6b0" strokeWidth="2.2" strokeDasharray="5 7" markerEnd="url(#chev2)" style={{ color: "#2bb6b0" }} className="ph-flow ph-flow-3" />
      {/* centre → wärmepumpe(lower right) */}
      <path d="M200,162 L200,210 L308,210" fill="none" stroke="#ef8b3a" strokeWidth="2.2" strokeDasharray="5 7" markerEnd="url(#chev2)" style={{ color: "#ef8b3a" }} className="ph-flow ph-flow-4" />
      <style jsx>{`
        .ph-flow { animation: ph-dash 1.6s linear infinite; }
        .ph-flow-2 { animation-duration: 1.9s; }
        .ph-flow-3 { animation-duration: 2.2s; }
        .ph-flow-4 { animation-duration: 1.7s; }
        @keyframes ph-dash { to { stroke-dashoffset: -24; } }
        @media (prefers-reduced-motion: reduce) { .ph-flow { animation: none; } }
      `}</style>
    </svg>
  );
}

/* ── Inline icons (stroke = currentColor) ─────────────────────────────────── */
function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4" />
    </svg>
  );
}
function BuildingIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="6" y="3" width="12" height="18" rx="1" />
      <path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2" />
    </svg>
  );
}
function HomeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11l9-8 9 8" />
      <path d="M5 10v10h14V10" />
      <path d="M10 20v-6h4v6" />
    </svg>
  );
}
function HeatIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <circle cx="9" cy="12" r="3" />
      <path d="M16 9v6" />
    </svg>
  );
}
function GridIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 2l-1 6h8l-1-6M8 8l-2 14M16 8l2 14M6 22h12" />
      <path d="M8 12h8M7 16h10" />
    </svg>
  );
}
