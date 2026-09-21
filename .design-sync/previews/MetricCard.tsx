/**
 * MetricCard-Previews — Duo-Muster: dasselbe reale KPI-Raster (ProductPanel,
 * Inhalte aus src/content/chargemieter.ts) in beiden Modi, EIN Dokument:
 * links tone="dark" auf Noir, rechts tone="light" in der theme-light-Welt.
 * Akzent #56c8e8 = --color-mod-charge.
 */
import { MetricCard } from "@ph360/website";

function ModeLabel({ children }: { children: string }) {
  return (
    <p className="text-xs font-medium uppercase tracking-widest text-ink-faint">
      {children}
    </p>
  );
}

export function ModiDuo() {
  return (
    <div className="flex items-stretch gap-3">
      <div className="w-80 rounded-2xl bg-navy-900 p-6">
        <ModeLabel>Dark</ModeLabel>
        <div className="mt-4 grid grid-cols-2 gap-2.5">
          <MetricCard label="Ladepunkte gesamt" value="14" tone="dark" />
          <MetricCard label="Aktive Ladevorgänge" value="5" tone="dark" />
          <MetricCard
            label="Auslastung"
            value="62 %"
            bar={0.62}
            accent="#56c8e8"
            tone="dark"
          />
          <MetricCard
            label="Nutzerzuordnung"
            value="14 / 14"
            bar={1}
            accent="#56c8e8"
            tone="dark"
          />
        </div>
      </div>
      <div className="theme-light w-80 rounded-2xl border border-navy-900/15 bg-navy-900 p-6">
        <ModeLabel>Light</ModeLabel>
        <div className="mt-4 grid grid-cols-2 gap-2.5">
          <MetricCard label="Ladepunkte gesamt" value="14" tone="light" />
          <MetricCard label="Aktive Ladevorgänge" value="5" tone="light" />
          <MetricCard
            label="Auslastung"
            value="62 %"
            bar={0.62}
            accent="#56c8e8"
            tone="light"
          />
          <MetricCard
            label="Nutzerzuordnung"
            value="14 / 14"
            bar={1}
            accent="#56c8e8"
            tone="light"
          />
        </div>
      </div>
    </div>
  );
}

export function MitTrendzeile() {
  return (
    <div className="w-64 rounded-2xl bg-navy-900 p-6">
      <MetricCard
        label="PV-Ertrag heute"
        value="48,2 kWh"
        sub="+12 % ggü. Vortag"
        bar={0.74}
        accent="var(--color-mod-power)"
        tone="dark"
      />
    </div>
  );
}
