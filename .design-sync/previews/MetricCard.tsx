/**
 * MetricCard-Previews — Kompositionen aus dem realen ProductPanel-Einbau
 * (2-spaltiges KPI-Raster, apps/website/src/components/ProductPanel.tsx) mit
 * echten Inhalten aus src/content/chargemieter.ts. Akzent #56c8e8 =
 * Modul-Token --color-mod-charge. tone="dark" liegt auf dem dunklen
 * Panel-Ground, tone="light" auf hellem App-Fenster-Ground.
 */
import { MetricCard } from "@ph360/website";

export function DunklesRaster() {
  return (
    <div className="w-80 rounded-2xl bg-navy-900 p-6">
      <div className="grid grid-cols-2 gap-2.5">
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
  );
}

export function HellesRaster() {
  return (
    <div className="w-80 rounded-2xl bg-white p-6">
      <div className="grid grid-cols-2 gap-2.5">
        <MetricCard label="Lastmanagement" value="Aktiv" tone="light" />
        <MetricCard
          label="Auslastung"
          value="62 %"
          bar={0.62}
          accent="#56c8e8"
          tone="light"
        />
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
