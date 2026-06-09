"use client";

import EnergyFlowOverlay from "./EnergyFlowOverlay";
import { PRODUCT_WORLDS, DASHBOARD_KPIS } from "@/content/sections";

/**
 * Section 7 — "Ein System. Vier Produktwelten. Ein Gebäude."
 *
 * A polished, light "app window" floating over the dark digital-twin scene. It
 * reads as a real PropTech platform: window chrome + POWERHOUSE360 branding, a
 * row of FOUR product-world modules (Powermieter / Heatmieter / Chargemieter /
 * Smokemieter), the live energy-flow building hero, a column of platform KPI
 * tiles + an Abrechnungsfortschritt donut, and an Abrechnungsübersicht table.
 *
 * Token-driven, responsive, keyboard-accessible. The window is the only
 * interactive surface; the rest of the panel passes scroll through.
 */

const KPIS = [
  { label: "Nächste Abrechnung", value: "15. Juni 2024", accent: "#2bb6b0" },
  { label: "Offene Rückfragen", value: "7", accent: "#ef8b3a" },
  { label: "Dokumentierte Verbräuche", value: "98 %", accent: "#43b649" },
  { label: "Rechnungen diesen Monat", value: "8", accent: "#5b9bd5" },
];

const ROWS = [
  { obj: "Haus A · WE 1–8", verbrauch: "12.840", pv: "7.420", netz: "4.180", zeitraum: "Mai 2024", status: "Abgeschlossen", tone: "ok" },
  { obj: "Haus A · WE 9–16", verbrauch: "10.210", pv: "6.980", netz: "3.560", zeitraum: "Mai 2024", status: "In Prüfung", tone: "warn" },
  { obj: "Haus B · WE 1–12", verbrauch: "18.330", pv: "9.640", netz: "6.020", zeitraum: "Mai 2024", status: "In Bearbeitung", tone: "info" },
  { obj: "Gewerbe EG", verbrauch: "5.470", pv: "2.110", netz: "2.890", zeitraum: "Mai 2024", status: "Erfasst", tone: "muted" },
];

const STATUS_TONE: Record<string, string> = {
  ok: "bg-emerald-100 text-emerald-700",
  warn: "bg-amber-100 text-amber-700",
  info: "bg-sky-100 text-sky-700",
  muted: "bg-slate-100 text-slate-600",
};

const DONUT = [
  { label: "Abgeschlossen", value: 65, color: "#43b649" },
  { label: "In Prüfung", value: 15, color: "#2bb6b0" },
  { label: "In Bearbeitung", value: 12, color: "#5b9bd5" },
  { label: "Erfasst", value: 8, color: "#cbd5e1" },
];

export default function DashboardOverlay() {
  return (
    <div className="pointer-events-auto mx-auto mt-9 w-full max-w-6xl text-left">
      {/* ── App window ── */}
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-white shadow-[0_40px_120px_-30px_rgba(5,12,26,0.85)] ring-1 ring-black/5">
        {/* window chrome */}
        <div className="flex items-center gap-3 border-b border-slate-200 bg-slate-50 px-5 py-3">
          <div className="flex gap-1.5">
            <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
            <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
            <span className="h-3 w-3 rounded-full bg-[#28c840]" />
          </div>
          <div className="ml-2 flex items-center gap-2">
            <span className="grid h-6 w-6 place-items-center rounded-md bg-brand-teal/15">
              <BrandMark />
            </span>
            <span className="text-sm font-bold text-navy-900">
              POWERHOUSE<span className="text-brand-teal">360</span>
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-sm font-semibold text-slate-500">PowerPilot</span>
          </div>
          <div className="ml-auto flex items-center gap-2 text-xs font-medium text-slate-400">
            <span className="hidden items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-600 sm:inline-flex">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Live
            </span>
            <span className="hidden md:inline">Hausverwaltung</span>
          </div>
        </div>

        {/* ── FOUR PRODUCT WORLDS module row ── */}
        <div className="grid grid-cols-2 gap-3 border-b border-slate-200 bg-slate-50/60 p-5 sm:p-6 lg:grid-cols-4">
          {PRODUCT_WORLDS.map((m) => (
            <div
              key={m.name}
              className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-3.5 shadow-[0_8px_24px_-16px_rgba(15,30,60,0.25)]"
            >
              <span
                className="absolute left-0 top-0 h-full w-1"
                style={{ background: m.accent }}
              />
              <div className="flex items-center gap-2">
                <span
                  className="grid h-7 w-7 place-items-center rounded-lg"
                  style={{ background: `${m.accent}1f` }}
                >
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: m.accent }} />
                </span>
                <div className="leading-tight">
                  <p className="text-sm font-bold text-navy-900">{m.name}</p>
                  <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: m.accent }}>
                    {m.domain}
                  </p>
                </div>
              </div>
              <p className="mt-2.5 text-xs leading-snug text-slate-500">{m.desc}</p>
              <span className="mt-2.5 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> aktiv
              </span>
            </div>
          ))}
        </div>

        {/* ── platform KPI strip ── */}
        <div className="grid grid-cols-2 gap-2.5 border-b border-slate-200 px-5 py-4 sm:px-6 md:grid-cols-5">
          {DASHBOARD_KPIS.map((k) => (
            <div key={k.label} className="rounded-xl border border-slate-200 bg-slate-50/70 p-2.5">
              <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">{k.label}</p>
              <p className="mt-0.5 text-base font-bold tabular-nums text-navy-900">{k.value}</p>
              <p className="text-[10px] text-slate-400">{k.trend}</p>
            </div>
          ))}
        </div>

        {/* body */}
        <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[1.4fr_1fr]">
          {/* left: energy-flow hero */}
          <section className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5">
            <EnergyFlowOverlay light />
          </section>

          {/* right: KPIs + donut */}
          <section className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              {KPIS.map((k) => (
                <div key={k.label} className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-[0_8px_24px_-16px_rgba(15,30,60,0.25)]">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{k.label}</p>
                  <p className="mt-1.5 text-lg font-bold tabular-nums text-navy-900">{k.value}</p>
                  <span className="mt-2 block h-1 w-8 rounded-full" style={{ background: k.accent }} />
                </div>
              ))}
            </div>

            {/* donut */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_8px_24px_-16px_rgba(15,30,60,0.25)]">
              <p className="text-sm font-bold text-navy-900">Abrechnungsfortschritt</p>
              <div className="mt-3 flex items-center gap-5">
                <Donut segments={DONUT} center="65 %" />
                <ul className="flex-1 space-y-1.5">
                  {DONUT.map((d) => (
                    <li key={d.label} className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="h-2.5 w-2.5 rounded-sm" style={{ background: d.color }} />
                      <span className="flex-1">{d.label}</span>
                      <span className="font-semibold tabular-nums text-navy-900">{d.value} %</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        </div>

        {/* table */}
        <div className="px-5 pb-6 sm:px-6">
          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-sm font-bold text-navy-900">Abrechnungsübersicht</p>
              <span className="text-xs font-medium text-slate-400">Mai 2024</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wide text-slate-400">
                    <th className="px-4 py-2.5 font-semibold">Objekt</th>
                    <th className="px-4 py-2.5 text-right font-semibold">Verbrauch kWh</th>
                    <th className="hidden px-4 py-2.5 text-right font-semibold sm:table-cell">PV-Erzeugung kWh</th>
                    <th className="hidden px-4 py-2.5 text-right font-semibold md:table-cell">Netzbezug kWh</th>
                    <th className="px-4 py-2.5 font-semibold">Status</th>
                    <th className="px-4 py-2.5 text-right font-semibold">Aktion</th>
                  </tr>
                </thead>
                <tbody>
                  {ROWS.map((r) => (
                    <tr key={r.obj} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70">
                      <td className="px-4 py-3 font-medium text-navy-900">{r.obj}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-600">{r.verbrauch}</td>
                      <td className="hidden px-4 py-3 text-right tabular-nums text-emerald-600 sm:table-cell">{r.pv}</td>
                      <td className="hidden px-4 py-3 text-right tabular-nums text-slate-600 md:table-cell">{r.netz}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${STATUS_TONE[r.tone]}`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button className="text-xs font-semibold text-brand-teal hover:text-brand-teal-soft hover:underline">
                          Öffnen
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* caption */}
      <p className="mt-4 text-center text-xs text-ink-faint">
        Ein System. Vier Produktwelten. Ein Gebäude. POWERHOUSE360 verbindet Betrieb,
        Abrechnung und Gebäudedaten auf einer Plattform.
      </p>
    </div>
  );
}

/** Conic-gradient donut with a centred label. */
function Donut({ segments, center }: { segments: { value: number; color: string }[]; center: string }) {
  let acc = 0;
  const stops = segments
    .map((s) => {
      const from = acc;
      acc += s.value;
      return `${s.color} ${from}% ${acc}%`;
    })
    .join(", ");
  return (
    <div
      className="relative grid h-24 w-24 shrink-0 place-items-center rounded-full"
      style={{ background: `conic-gradient(${stops})` }}
      role="img"
      aria-label={`Abrechnungsfortschritt ${center}`}
    >
      <div className="grid h-16 w-16 place-items-center rounded-full bg-white">
        <span className="text-base font-bold tabular-nums text-navy-900">{center}</span>
      </div>
    </div>
  );
}

/** Small stacked-chevron POWERHOUSE mark for the window chrome. */
function BrandMark() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M12 3 L20 8 L12 13 L4 8 Z" fill="#2bb6b0" />
      <path d="M12 9 L20 14 L12 19 L4 14 Z" fill="#43b649" opacity="0.85" />
    </svg>
  );
}
