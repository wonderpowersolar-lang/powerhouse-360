"use client";

import { PLATFORM_CARDS, ACCENT_VAR } from "@/content/sections";

/**
 * Station "Die Plattform" — the operating-system window.
 *
 * A dark, quiet OS surface with the eight platform cards (Energie, Wärme,
 * Ladepunkte, Rauchwarnmelder, Bewohner, Abrechnung, Onboarding,
 * Betriebsstatus). Believable abstract states only — no fake customer data,
 * no fake logos, no meaningless dummy metrics.
 */
export default function DashboardOverlay() {
  return (
    <div className="pointer-events-auto mx-auto w-full max-w-4xl text-left">
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0e0f12]/90 shadow-[0_40px_120px_-30px_rgba(0,0,0,0.9)] backdrop-blur-md">
        {/* window chrome */}
        <div className="flex items-center gap-3 border-b border-white/8 px-5 py-3">
          <div className="flex gap-1.5" aria-hidden>
            <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
          </div>
          <span className="ml-1 text-sm font-semibold tracking-wide text-ink">
            POWERHOUSE<span className="text-gold"> 360</span>
            <span className="mx-2 text-ink-faint">·</span>
            <span className="font-medium text-ink-dim">Plattform</span>
          </span>
          <span className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-gold/25 bg-gold/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-gold">
            <span className="h-1.5 w-1.5 rounded-full bg-gold" />
            Live
          </span>
        </div>

        {/* the eight platform cards */}
        <div className="grid grid-cols-2 gap-2.5 p-4 sm:p-5 lg:grid-cols-4">
          {PLATFORM_CARDS.map((c) => {
            const col = ACCENT_VAR[c.accent];
            return (
              <div
                key={c.label}
                className="group relative overflow-hidden rounded-xl border border-white/8 bg-white/[0.03] p-3.5 transition-colors duration-300 hover:border-white/16"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
                  {c.label}
                </p>
                <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-ink">
                  <span
                    aria-hidden
                    className="h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ background: col, boxShadow: `0 0 8px ${col}` }}
                  />
                  {c.state}
                </p>
                <p className="mt-1 text-xs leading-snug text-ink-dim">
                  {c.detail}
                </p>
                <span
                  aria-hidden
                  className="absolute inset-x-0 bottom-0 h-px opacity-40"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${col}, transparent)`,
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
