import Link from "next/link";
import { ComponentProps } from "react";

/**
 * Brand button. Token-driven, two variants. Used for all CTAs.
 * `as="a"` renders a Next Link (anchor scrolling); otherwise a <button>.
 */
type Variant = "primary" | "secondary";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold tracking-wide transition-all duration-200 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 disabled:pointer-events-none min-h-[44px]";

const variants: Record<Variant, string> = {
  primary:
    "bg-brand-teal text-navy-900 hover:bg-brand-aqua hover:-translate-y-0.5 shadow-[0_8px_30px_-8px_rgba(43,182,176,0.6)]",
  secondary:
    "border border-white/20 bg-white/5 text-ink backdrop-blur-sm hover:bg-white/10 hover:border-white/35",
};

export function Button({
  variant = "primary",
  className = "",
  ...props
}: { variant?: Variant } & ComponentProps<"button">) {
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props} />
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
      {children}
    </Link>
  );
}
