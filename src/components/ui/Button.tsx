import Link from "next/link";
import { ComponentProps } from "react";

/**
 * Brand button. Token-driven, two variants. Used for all CTAs.
 *
 * Primary ist einfarbig (Teal); der Logo-Verlauf (Blau → Teal → Grün) liegt
 * als Overlay darunter und blendet erst bei Hover/Fokus weich ein —
 * background-image lässt sich nicht animieren, Opacity schon.
 */
type Variant = "primary" | "secondary";

const base =
  "group inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold tracking-wide transition-all duration-200 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 disabled:pointer-events-none min-h-[44px]";

const variants: Record<Variant, string> = {
  primary:
    "relative overflow-hidden bg-gold text-navy-900 hover:-translate-y-0.5 shadow-[0_8px_30px_-8px_rgba(43,182,176,0.55)]",
  secondary:
    "border border-white/20 bg-white/5 text-ink backdrop-blur-sm hover:bg-white/10 hover:border-white/35",
};

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
  className = "",
  children,
  ...props
}: { variant?: Variant } & ComponentProps<"button">) {
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {variant === "primary" && <GradientHover />}
      <span className="relative">{children}</span>
    </button>
  );
}

export function ButtonLink({
  variant = "primary",
  className = "",
  href,
  children,
  ...props
}: { variant?: Variant; href: string } & Omit<
  ComponentProps<typeof Link>,
  "href"
>) {
  return (
    <Link
      href={href}
      className={`${base} ${variants[variant]} ${className}`}
      {...props}
    >
      {variant === "primary" && <GradientHover />}
      <span className="relative">{children}</span>
    </Link>
  );
}
