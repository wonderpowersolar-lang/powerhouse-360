import Link from "next/link";
import { ComponentProps } from "react";

/**
 * Brand button. Token-driven, three variants, two tones. Used for all CTAs.
 *
 * Primary ist einfarbig (Teal); der Logo-Verlauf (Blau → Teal → Grün) liegt
 * als Overlay darunter und blendet erst bei Hover/Fokus weich ein —
 * background-image lässt sich nicht animieren, Opacity schon.
 * `gradient` trägt den Logo-Verlauf permanent (für den EINEN Hero-CTA einer
 * View — primary und gradient nicht mischen). `tone="light"` stylt die
 * secondary-Glass-Pille für helle Gründe (App-Welt/theme-light); primary und
 * gradient sind tone-unabhängig.
 */
type Variant = "primary" | "secondary" | "gradient";
type Tone = "dark" | "light";

const base =
  "group inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold tracking-wide transition-all duration-200 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 disabled:pointer-events-none min-h-[44px]";

const variants: Record<Exclude<Variant, "secondary">, string> = {
  primary:
    "relative overflow-hidden bg-gold text-navy-900 hover:-translate-y-0.5 shadow-[0_8px_30px_-8px_rgba(43,182,176,0.55)]",
  gradient:
    "brand-gradient-bg text-navy-900 hover:-translate-y-0.5 shadow-[0_8px_30px_-8px_rgba(43,182,176,0.55)] hover:shadow-[0_10px_36px_-8px_rgba(43,182,176,0.75)]",
};

// dark nutzt ink-Token statt white-Literale: im .theme-light-Scope flippt
// ink auf Marken-Navy, die Glass-Pille bleibt automatisch lesbar (auf dem
// Noir-Ground ist ink ≈ warmweiß — optisch wie zuvor, nur wärmer).
// light ist der scope-UNABHÄNGIGE Override für helle Artboards ohne
// theme-light-Wrapper — feste Hexwerte (Marken-Navy), damit nichts flippt.
const secondaryByTone: Record<Tone, string> = {
  dark: "border border-ink/20 bg-ink/5 text-ink backdrop-blur-sm hover:bg-ink/10 hover:border-ink/35",
  light:
    "border border-[#16243a]/15 bg-[#16243a]/5 text-[#16243a] hover:bg-[#16243a]/10 hover:border-[#16243a]/30",
};

function classesFor(variant: Variant, tone: Tone): string {
  return variant === "secondary" ? secondaryByTone[tone] : variants[variant];
}

/** Der einblendende Marken-Verlauf (nur primary). */
function GradientHover() {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-0 bg-gradient-to-r from-gold-deep via-gold to-gold-soft opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100"
    />
  );
}

export function Button({
  variant = "primary",
  tone = "dark",
  className = "",
  children,
  ...props
}: { variant?: Variant; tone?: Tone } & ComponentProps<"button">) {
  return (
    <button
      className={`${base} ${classesFor(variant, tone)} ${className}`}
      {...props}
    >
      {variant === "primary" && <GradientHover />}
      <span className="relative">{children}</span>
    </button>
  );
}

export function ButtonLink({
  variant = "primary",
  tone = "dark",
  className = "",
  href,
  children,
  ...props
}: { variant?: Variant; tone?: Tone; href: string } & Omit<
  ComponentProps<typeof Link>,
  "href"
>) {
  return (
    <Link
      href={href}
      className={`${base} ${classesFor(variant, tone)} ${className}`}
      {...props}
    >
      {variant === "primary" && <GradientHover />}
      <span className="relative">{children}</span>
    </Link>
  );
}
