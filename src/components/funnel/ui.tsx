"use client";

/**
 * Powerhouse 360 — Funnel-UI-Kit.
 *
 * Alle geteilten Bausteine beider Anfrage-Strecken in einem Modul:
 * FunnelShell (Fullscreen-Layout + Live-Panel), FunnelProgress,
 * OptionCard/OptionGrid, NumberInput, TextField, ConsentCheckbox,
 * LiveInsightPanel, FunnelSummary, NavButtons, SuccessState, FunnelIcon.
 *
 * Dark-mode-first, Token-getrieben (globals.css), Keyboard-nutzbar:
 * Auswahlkarten sind echte Buttons mit aria-pressed, das Live-Panel ist
 * auf Mobile ein sticky aufklappbares <details>.
 */

import Link from "next/link";
import { LogoLockup } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { ACCENT_VAR, type Accent } from "@/content/sections";
import type { Insights } from "@/lib/funnel/types";

/* ────────────────────────────────── Icons ─────────────────────────────── */

export type IconName =
  | "building"
  | "home"
  | "users"
  | "layers"
  | "city"
  | "key"
  | "question"
  | "bolt"
  | "flame"
  | "plug"
  | "shield"
  | "grid"
  | "puzzle"
  | "userPlus"
  | "receipt"
  | "chart"
  | "workflow"
  | "code"
  | "eye"
  | "clock"
  | "calendar"
  | "moon"
  | "sun"
  | "bulb"
  | "search"
  | "doc"
  | "wrench"
  | "hammer"
  | "gear"
  | "alert"
  | "pin"
  | "sparkle"
  | "check";

const ICON_PATHS: Record<IconName, React.ReactNode> = {
  building: (
    <>
      <rect x="5" y="3" width="14" height="18" rx="1.5" />
      <path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2M10 21v-3h4v3" />
    </>
  ),
  home: (
    <>
      <path d="M4 11l8-7 8 7" />
      <path d="M6 9.5V20h12V9.5" />
      <path d="M10 20v-5h4v5" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8.5" r="3" />
      <path d="M3.5 19c.7-3 2.9-4.5 5.5-4.5s4.8 1.5 5.5 4.5" />
      <circle cx="16.5" cy="9.5" r="2.4" />
      <path d="M15.5 14.7c2.3.2 4.2 1.6 4.9 4.3" />
    </>
  ),
  layers: (
    <>
      <path d="M12 3l9 5-9 5-9-5 9-5z" />
      <path d="M3 13l9 5 9-5" />
      <path d="M3 17l9 5 9-5" />
    </>
  ),
  city: (
    <>
      <path d="M3 21V9l5-2v14" />
      <path d="M8 21V5l6 2v14" />
      <path d="M14 21V9l7 2v10" />
      <path d="M3 21h18" />
    </>
  ),
  key: (
    <>
      <circle cx="8" cy="15" r="4" />
      <path d="M11 12l9-9M17 6l3 3M14 9l2.5 2.5" />
    </>
  ),
  question: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.5a2.5 2.5 0 1 1 3.8 2.1c-.9.6-1.3 1-1.3 2" />
      <path d="M12 17h.01" />
    </>
  ),
  bolt: <path d="M13 2L5 13h5l-1 9 8-11h-5l1-9z" />,
  flame: (
    <path d="M12 3c1 3-3 4.5-3 8a3 3 0 0 0 6 0c0-1-.5-2-1-2.6 2.2 1 4 3 4 5.6a6 6 0 0 1-12 0c0-4.5 4.5-6.5 6-11z" />
  ),
  plug: (
    <>
      <path d="M9 3v5M15 3v5" />
      <path d="M6 8h12l-1.5 5a4.5 4.5 0 0 1-9 0L6 8z" />
      <path d="M12 17v4" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
      <path d="M9.5 12l1.8 1.8 3.4-3.6" />
    </>
  ),
  grid: (
    <>
      <rect x="4" y="4" width="7" height="7" rx="1.2" />
      <rect x="13" y="4" width="7" height="7" rx="1.2" />
      <rect x="4" y="13" width="7" height="7" rx="1.2" />
      <rect x="13" y="13" width="7" height="7" rx="1.2" />
    </>
  ),
  puzzle: (
    <path d="M10 4a2 2 0 1 1 4 0h4v4a2 2 0 1 1 0 4v4h-4a2 2 0 1 0-4 0H6v-4a2 2 0 1 0 0-4V4h4z" />
  ),
  userPlus: (
    <>
      <circle cx="10" cy="8.5" r="3.2" />
      <path d="M4 19.5c.8-3.2 3.2-4.8 6-4.8s5.2 1.6 6 4.8" />
      <path d="M18 8v5M15.5 10.5h5" />
    </>
  ),
  receipt: (
    <>
      <path d="M6 3h12v18l-2-1.4L14 21l-2-1.4L10 21l-2-1.4L6 21V3z" />
      <path d="M9 8h6M9 12h6M9 16h4" />
    </>
  ),
  chart: (
    <>
      <path d="M4 20V4" />
      <path d="M4 20h16" />
      <path d="M8 16v-5M12 16V8M16 16v-8" />
    </>
  ),
  workflow: (
    <>
      <rect x="3" y="3" width="6" height="6" rx="1.2" />
      <rect x="15" y="15" width="6" height="6" rx="1.2" />
      <path d="M9 6h6a3 3 0 0 1 3 3v3M6 9v6a3 3 0 0 0 3 3h3" />
    </>
  ),
  code: <path d="M8 6l-6 6 6 6M16 6l6 6-6 6M13 4l-2 16" />,
  eye: (
    <>
      <path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12z" />
      <circle cx="12" cy="12" r="2.8" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="16" rx="1.6" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </>
  ),
  moon: <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" />
    </>
  ),
  bulb: (
    <>
      <path d="M9 18a7 7 0 1 1 6 0c-.6.4-1 1.2-1 2h-4c0-.8-.4-1.6-1-2z" />
      <path d="M10 22h4" />
    </>
  ),
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="M15.5 15.5L21 21" />
    </>
  ),
  doc: (
    <>
      <path d="M7 3h7l4 4v14H7V3z" />
      <path d="M14 3v4h4M10 12h5M10 16h5" />
    </>
  ),
  wrench: (
    <path d="M14.5 6.5a4 4 0 0 0-5.4 4.8L3.5 17a2 2 0 1 0 2.8 2.8l5.7-5.6a4 4 0 0 0 4.8-5.4L14 11.5l-2.3-2.3 2.8-2.7z" />
  ),
  hammer: (
    <>
      <path d="M14 5l5 5-2.5 2.5-5-5L14 5z" />
      <path d="M12.5 8.5L4 17a2 2 0 1 0 3 3l8.5-8.5" />
    </>
  ),
  gear: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.5 5.5l1.8 1.8M16.7 16.7l1.8 1.8M18.5 5.5l-1.8 1.8M7.3 16.7l-1.8 1.8" />
    </>
  ),
  alert: (
    <>
      <path d="M12 4l9.5 16.5h-19L12 4z" />
      <path d="M12 10v4.5M12 17.5h.01" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.6" />
    </>
  ),
  sparkle: (
    <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3zM19 16l.9 2.1L22 19l-2.1.9L19 22l-.9-2.1L16 19l2.1-.9L19 16z" />
  ),
  check: <path d="M4 12.5l5 5L20 6.5" />,
};

export function FunnelIcon({
  name,
  className = "h-5 w-5",
  style,
}: {
  name: IconName;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
      style={style}
    >
      {ICON_PATHS[name]}
    </svg>
  );
}

/* ───────────────────────────── Fortschritt ────────────────────────────── */

export function FunnelProgress({
  step,
  total,
}: {
  step: number;
  total: number;
}) {
  const pct = Math.round(((step + 1) / total) * 100);
  return (
    <div aria-label={`Schritt ${step + 1} von ${total}`}>
      <div className="flex items-baseline justify-between text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-faint">
        <span>
          Schritt {step + 1} von {total}
        </span>
        <span className="tabular-nums">{pct} %</span>
      </div>
      <div className="mt-2 h-px w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full bg-gradient-to-r from-gold-deep via-gold to-gold-soft transition-[width] duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/* ──────────────────────────── Auswahlkarten ───────────────────────────── */

export interface OptionDef {
  id: string;
  label: string;
  desc?: string;
  icon: IconName;
  accent?: Accent;
}

export function OptionCard({
  option,
  selected,
  onToggle,
}: {
  option: OptionDef;
  selected: boolean;
  onToggle: () => void;
}) {
  const accent = option.accent ? ACCENT_VAR[option.accent] : "var(--color-gold)";
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={selected}
      data-opt={option.id}
      className={`group relative flex w-full items-start gap-3.5 rounded-2xl border p-4 text-left transition-all duration-200 sm:p-5 ${
        selected
          ? "border-transparent bg-white/[0.05]"
          : "border-white/10 bg-white/[0.02] hover:border-white/25 hover:bg-white/[0.04]"
      }`}
      style={
        selected
          ? { boxShadow: `inset 0 0 0 1.5px ${accent}` }
          : undefined
      }
    >
      <span
        className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.04] transition-colors"
        style={{ color: selected ? accent : "var(--color-ink-dim)" }}
      >
        <FunnelIcon name={option.icon} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-semibold leading-snug text-ink">
          {option.label}
        </span>
        {option.desc && (
          <span className="mt-1 block text-[13px] leading-snug text-ink-dim">
            {option.desc}
          </span>
        )}
      </span>
      <span
        aria-hidden
        className={`mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full border transition-all ${
          selected ? "border-transparent" : "border-white/20"
        }`}
        style={selected ? { background: accent, color: "#0a0b0d" } : undefined}
      >
        {selected && <FunnelIcon name="check" className="h-3 w-3" />}
      </span>
    </button>
  );
}

export function OptionGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-3 sm:grid-cols-2">{children}</div>;
}

/* ─────────────────────────────── Eingaben ─────────────────────────────── */

export function NumberInput({
  id,
  label,
  value,
  onChange,
  placeholder,
  optional,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  optional?: boolean;
}) {
  return (
    <label htmlFor={id} className="block">
      <span className="text-[13px] font-medium text-ink-dim">
        {label}
        {optional && <span className="text-ink-faint"> · optional</span>}
      </span>
      <input
        id={id}
        type="number"
        min={0}
        inputMode="numeric"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-[15px] text-ink outline-none transition-colors placeholder:text-ink-faint focus:border-gold/60"
      />
    </label>
  );
}

export function TextField({
  id,
  label,
  value,
  onChange,
  type = "text",
  optional,
  autoComplete,
  error,
  textarea,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  optional?: boolean;
  autoComplete?: string;
  error?: string;
  textarea?: boolean;
}) {
  const cls = `mt-1.5 w-full rounded-xl border bg-white/[0.03] px-4 py-3 text-[15px] text-ink outline-none transition-colors placeholder:text-ink-faint focus:border-gold/60 ${
    error ? "border-mod-heat/70" : "border-white/10"
  }`;
  return (
    <label htmlFor={id} className="block">
      <span className="text-[13px] font-medium text-ink-dim">
        {label}
        {optional && <span className="text-ink-faint"> · optional</span>}
      </span>
      {textarea ? (
        <textarea
          id={id}
          value={value}
          rows={3}
          onChange={(e) => onChange(e.target.value)}
          className={cls}
        />
      ) : (
        <input
          id={id}
          type={type}
          value={value}
          autoComplete={autoComplete}
          onChange={(e) => onChange(e.target.value)}
          className={cls}
        />
      )}
      {error && (
        <span className="mt-1 block text-[12px] text-mod-heat">{error}</span>
      )}
    </label>
  );
}

export function ConsentCheckbox({
  id,
  checked,
  onChange,
  error,
  children,
}: {
  id: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  error?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label
      htmlFor={id}
      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-colors ${
        error ? "border-mod-heat/70" : "border-white/10 hover:border-white/25"
      }`}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4.5 w-4.5 shrink-0 accent-[#2bb6b0]"
      />
      <span className="text-[13px] leading-relaxed text-ink-dim">
        {children}
      </span>
    </label>
  );
}

/* ───────────────────────────── Live-Panel ─────────────────────────────── */

const CHIP_TONE_VAR: Record<string, string> = {
  gold: "var(--color-gold)",
  power: "var(--color-mod-power)",
  heat: "var(--color-mod-heat)",
  charge: "var(--color-mod-charge)",
  smoke: "var(--color-mod-smoke)",
};

export function LiveInsightPanel({ insights }: { insights: Insights }) {
  return (
    <div
      data-testid="insight-panel"
      className="rounded-2xl border border-white/10 bg-[#0e0f12]/90 p-5"
    >
      <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">
        <span className="h-px w-6 bg-gold/60" />
        Deine Einschätzung
      </p>

      {insights.chips.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {insights.chips.map((c) => {
            const col = CHIP_TONE_VAR[c.tone];
            return (
              <span
                key={c.label}
                className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold"
                style={{
                  borderColor: `color-mix(in srgb, ${col} 40%, transparent)`,
                  color: col,
                  background: `color-mix(in srgb, ${col} 10%, transparent)`,
                }}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: col }}
                />
                {c.label}
              </span>
            );
          })}
        </div>
      )}

      <div className="mt-4 space-y-4">
        {insights.blocks.map((b) => (
          <div key={b.title}>
            <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
              {b.title}
            </p>
            {b.ordered ? (
              <ol className="mt-1.5 list-decimal space-y-1 pl-5 text-[13px] leading-relaxed text-ink-dim marker:text-gold/70">
                {b.lines.map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ol>
            ) : (
              <div className="mt-1.5 space-y-1.5 text-[13px] leading-relaxed text-ink-dim">
                {b.lines.map((l) => (
                  <p key={l}>{l}</p>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <p className="mt-5 border-t border-white/8 pt-3 text-[11px] leading-relaxed text-ink-faint">
        {insights.disclaimer}
      </p>
    </div>
  );
}

/* ─────────────────────────── Zusammenfassung ──────────────────────────── */

export function FunnelSummary({
  rows,
}: {
  rows: { label: string; value: string }[];
}) {
  const filled = rows.filter((r) => r.value.trim() !== "");
  return (
    <dl className="divide-y divide-white/8 rounded-2xl border border-white/10 bg-white/[0.02]">
      {filled.map((r) => (
        <div
          key={r.label}
          className="grid gap-0.5 px-4 py-3 sm:grid-cols-[180px_1fr] sm:gap-4"
        >
          <dt className="text-[12px] font-semibold uppercase tracking-[0.12em] text-ink-faint">
            {r.label}
          </dt>
          <dd className="text-[13.5px] leading-relaxed text-ink-dim">
            {r.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/* ────────────────────────────── Navigation ────────────────────────────── */

export function NavButtons({
  onBack,
  onNext,
  nextLabel,
  submitting,
  error,
}: {
  onBack?: () => void;
  onNext: () => void;
  nextLabel: string;
  submitting?: boolean;
  error?: string | null;
}) {
  return (
    <div className="mt-8">
      {error && (
        <p
          role="alert"
          className="mb-3 rounded-xl border border-mod-heat/40 bg-mod-heat/10 px-4 py-2.5 text-[13px] text-ink"
        >
          {error}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        {onBack && (
          <Button variant="secondary" onClick={onBack} type="button">
            Zurück
          </Button>
        )}
        <Button
          onClick={onNext}
          type="button"
          disabled={submitting}
          data-testid="funnel-next"
        >
          {submitting ? "Wird gesendet…" : nextLabel}
        </Button>
      </div>
    </div>
  );
}

/* ──────────────────────────── Erfolgs-Screen ──────────────────────────── */

export function SuccessState({ message }: { message: string }) {
  return (
    <div className="mx-auto max-w-xl py-16 text-center" data-testid="funnel-success">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-gold/40 bg-gold/10 text-gold">
        <FunnelIcon name="check" className="h-6 w-6" />
      </span>
      <h2 className="mt-6 text-2xl font-bold leading-snug text-ink sm:text-3xl">
        Danke für deine Anfrage.
      </h2>
      <p className="mt-4 text-[15px] leading-relaxed text-ink-dim">{message}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-gold px-6 py-3 text-sm font-semibold tracking-wide text-navy-900 transition-all hover:bg-gold-soft"
        >
          Zur Startseite
        </Link>
      </div>
    </div>
  );
}

/* ─────────────────────────────── Shell ────────────────────────────────── */

export function FunnelShell({
  title,
  subline,
  step,
  total,
  panel,
  children,
  showProgress = true,
}: {
  title: string;
  subline: string;
  step: number;
  total: number;
  panel: React.ReactNode;
  children: React.ReactNode;
  showProgress?: boolean;
}) {
  return (
    <div className="min-h-dvh bg-navy-900">
      {/* Funnel-Header: reduziert, ohne Ablenkung */}
      <header className="border-b border-white/5">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <Link href="/" aria-label="Powerhouse 360 Startseite" className="shrink-0">
            <LogoLockup className="h-9 w-auto sm:h-10" />
          </Link>
          <Link
            href="/"
            className="text-sm font-medium text-ink-dim transition-colors hover:text-ink"
          >
            Zurück zur Website
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 pb-24 pt-10 sm:px-8 sm:pt-14">
        <div className="max-w-2xl">
          <h1 className="text-2xl font-bold leading-tight tracking-tight text-ink sm:text-3xl">
            {title}
          </h1>
          <p className="mt-2 text-[15px] leading-relaxed text-ink-dim">
            {subline}
          </p>
        </div>

        {showProgress && (
          <div className="mt-8 max-w-2xl">
            <FunnelProgress step={step} total={total} />
          </div>
        )}

        <div className="mt-8 grid items-stretch gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0">{children}</div>

          {/* Desktop: Live-Panel rechts. Der absolute Träger sorgt dafür,
              dass das Panel NIE höher wird als der Funnel-Bereich links —
              die Zeilenhöhe bestimmt allein der Schritt-Inhalt; längere
              Panels scrollen intern (sticky, viewport-gedeckelt). */}
          <aside className="relative hidden lg:block">
            <div className="absolute inset-0">
              <div className="sticky top-8 max-h-[min(calc(100dvh-4rem),100%)] overflow-y-auto overscroll-contain">
                {panel}
              </div>
            </div>
          </aside>
        </div>

        {/* Mobile: sticky aufklappbare Einschätzung */}
        <div className="sticky bottom-3 z-30 mt-8 lg:hidden">
          <details className="group overflow-hidden rounded-2xl border border-white/12 bg-[#0e0f12]/95 backdrop-blur-md">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 text-sm font-semibold text-ink [&::-webkit-details-marker]:hidden">
              Deine Einschätzung anzeigen
              <span
                aria-hidden
                className="grid h-6 w-6 place-items-center rounded-full border border-white/15 text-ink-dim transition-transform group-open:rotate-45"
              >
                +
              </span>
            </summary>
            <div className="max-h-[55dvh] overflow-y-auto border-t border-white/8 p-2">
              {panel}
            </div>
          </details>
        </div>
      </main>
    </div>
  );
}
