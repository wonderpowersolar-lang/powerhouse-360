"use client";

import { useEffect, useState } from "react";
import { LogoLockup } from "./ui/Logo";
import { ButtonLink } from "./ui/Button";
import ThemeToggle from "./theme/ThemeToggle";
import { NAV_LINKS } from "@/content/sections";

/**
 * Sticky top navigation: logo lockup, chapter anchor links, primary CTA,
 * and a scroll-progress hairline. Collapses to a menu button on mobile.
 */
export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const max =
        document.documentElement.scrollHeight - window.innerHeight || 1;
      setScrolled(window.scrollY > 24);
      setProgress(Math.min(1, window.scrollY / max));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        scrolled
          ? "bg-navy-900/80 backdrop-blur-md border-b border-white/5"
          : "bg-transparent"
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-5 py-3.5 sm:px-8">
        <a href="#hero" aria-label="POWERHOUSE 360 Startseite" className="shrink-0">
          <LogoLockup priority className="h-7 w-auto sm:h-8" />
        </a>

        <div className="hidden items-center gap-7 lg:flex">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-ink-dim transition-colors hover:text-ink"
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <div className="hidden lg:block">
            <ButtonLink href="#cta" variant="primary">
              Projekt prüfen lassen
            </ButtonLink>
          </div>
        </div>

        {/* Mobile menu button */}
        <button
          className="flex h-11 w-11 items-center justify-center rounded-lg text-ink lg:hidden"
          aria-label={open ? "Menü schließen" : "Menü öffnen"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="relative block h-4 w-6">
            <span
              className={`absolute left-0 h-0.5 w-6 bg-current transition-all ${
                open ? "top-1.5 rotate-45" : "top-0"
              }`}
            />
            <span
              className={`absolute left-0 top-1.5 h-0.5 w-6 bg-current transition-opacity ${
                open ? "opacity-0" : "opacity-100"
              }`}
            />
            <span
              className={`absolute left-0 h-0.5 w-6 bg-current transition-all ${
                open ? "top-1.5 -rotate-45" : "top-3"
              }`}
            />
          </span>
        </button>
      </nav>

      {/* scroll progress hairline */}
      <div className="h-px w-full bg-white/5">
        <div
          className="h-full bg-gradient-to-r from-brand-green via-brand-teal to-brand-aqua transition-[width] duration-150"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      {/* Mobile menu sheet */}
      {open && (
        <div className="border-t border-white/5 bg-navy-900/95 backdrop-blur-md lg:hidden">
          <div className="flex flex-col gap-1 px-5 py-4">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-3 text-base font-medium text-ink-dim hover:bg-white/5 hover:text-ink"
              >
                {l.label}
              </a>
            ))}
            <ButtonLink
              href="#cta"
              variant="primary"
              className="mt-2 w-full"
              onClick={() => setOpen(false)}
            >
              Projekt prüfen lassen
            </ButtonLink>
          </div>
        </div>
      )}
    </header>
  );
}
