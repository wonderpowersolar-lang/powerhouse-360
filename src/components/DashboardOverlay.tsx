"use client";

import { DASHBOARD_KPIS, DASHBOARD_MODULES } from "@/content/sections";

/**
 * Section 7 overlay: the building reads as a digital twin while a clean,
 * glassy dashboard layer appears — module chips + KPI cards. Token-driven,
 * accessible, responsive grid.
 */
export default function DashboardOverlay() {
  return (
    <div className="mt-9 w-full max-w-3xl">
      {/* module chips */}
      <div className="mb-6 flex flex-wrap justify-center gap-2.5">
        {DASHBOARD_MODULES.map((m) => (
          <span
            key={m}
            className="rounded-full border border-brand-teal/30 bg-brand-teal/10 px-4 py-1.5 text-xs font-semibold tracking-wide text-brand-aqua backdrop-blur-sm"
          >
            {m}
          </span>
        ))}
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {DASHBOARD_KPIS.map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-left backdrop-blur-md transition-colors hover:border-brand-teal/40"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">
              {kpi.label}
            </p>
            <p className="mt-2 text-2xl font-bold text-ink tabular-nums">
              {kpi.value}
            </p>
            <p className="mt-1 text-xs text-brand-aqua">{kpi.trend}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
