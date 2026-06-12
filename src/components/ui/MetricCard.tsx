/**
 * MetricCard — the reusable KPI chip (label · value · optional mini-bar ·
 * optional sub line). Extracted from the ProductPanel KPI chips so the panels
 * and the platform dashboard share one component.
 *
 * `tone` picks the surface: "dark" = glass chip over the dark panel theme,
 * "light" = white chip over light panels / the dashboard app window.
 */
export default function MetricCard({
  label,
  value,
  bar,
  sub,
  accent,
  tone = "dark",
}: {
  label: string;
  value: string;
  /** optional 0..1 mini-bar fill */
  bar?: number;
  /** optional small line under the value (e.g. a trend) */
  sub?: string;
  /** accent hex for the mini-bar */
  accent?: string;
  tone?: "dark" | "light";
}) {
  const light = tone === "light";
  return (
    <div
      className={[
        "rounded-xl border p-2.5",
        light ? "border-slate-200 bg-slate-50/70" : "border-white/10 bg-white/[0.04]",
      ].join(" ")}
    >
      <p
        className={`text-[10px] font-medium uppercase tracking-wide ${
          light ? "text-slate-400" : "text-ink-faint"
        }`}
      >
        {label}
      </p>
      <p
        className={`mt-0.5 text-base font-bold tabular-nums ${
          light ? "text-navy-900" : "text-ink"
        }`}
      >
        {value}
      </p>
      {sub && (
        <p className={`text-[10px] ${light ? "text-slate-400" : "text-ink-faint"}`}>
          {sub}
        </p>
      )}
      {typeof bar === "number" && (
        <div
          className={`mt-1.5 h-1 w-full overflow-hidden rounded-full ${
            light ? "bg-slate-200" : "bg-white/10"
          }`}
        >
          <span
            className="block h-full rounded-full"
            style={{
              width: `${Math.round(Math.max(0, Math.min(1, bar)) * 100)}%`,
              background: accent ?? "var(--color-brand-teal)",
            }}
          />
        </div>
      )}
    </div>
  );
}
