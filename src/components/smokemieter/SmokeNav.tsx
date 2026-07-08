"use client";

import { useEffect, useState } from "react";
import { ButtonLink } from "@/components/ui/Button";
import SmokeMark from "./SmokeMark";
import { SM_CTA } from "@/content/smokemieter";

const LINKS = [
  { label: "Die Nacht", href: "#story" },
  { label: "Pflicht", href: "#pflicht" },
  { label: "Ferninspektion", href: "#ferninspektion" },
  { label: "Ablauf", href: "#ablauf" },
  { label: "System", href: "#plattform" },
];

/**
 * Schlanke SmokeMieter-Navigation: Marke + Rückweg zur Powerhouse-360-
 * Startseite, Kapitel-Anker, Bestandscheck-CTA. Amber-Progress-Hairline —
 * die Seite gehört dem Smoke-Modul.
 */
export default function SmokeNav() {
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
          ? "border-b border-white/5 bg-navy-900/85 backdrop-blur-md"
          : "bg-transparent"
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-5 py-3.5 sm:px-8">
        <div className="flex min-w-0 items-center gap-3">
          {/* SmokeMieter-Logo (Bildmarke + Wortmarke) — Rückweg zu
              Powerhouse 360 liegt im Mobilmenü und im Footer. */}
          <a href="#start" className="flex min-w-0 items-center gap-3">
            <span className="shrink-0">
              <SmokeMark size={38} />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-lg font-bold leading-none tracking-tight text-ink">
                Smoke
                <span className="text-[color:var(--color-mod-smoke)]">
                  Mieter
                </span>
              </span>
              <span className="mt-0.5 hidden text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-faint sm:block">
                Rauchwarnmelder im Mehrfamilienhaus
              </span>
            </span>
          </a>
        </div>

        <div className="hidden items-center gap-7 lg:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-ink-dim transition-colors hover:text-ink"
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="hidden lg:block">
          <ButtonLink href={SM_CTA.bestandscheck.href} variant="primary">
            Bestandscheck
          </ButtonLink>
        </div>

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

      {/* Scroll-Progress — amber */}
      <div className="h-px w-full bg-white/5">
        <div
          className="h-full transition-[width] duration-150"
          style={{
            width: `${progress * 100}%`,
            background:
              "linear-gradient(90deg, #c22a18, var(--color-mod-smoke), #f2c98a)",
          }}
        />
      </div>

      {open && (
        <div className="border-t border-white/5 bg-navy-900/95 backdrop-blur-md lg:hidden">
          <div className="flex flex-col gap-1 px-5 py-4">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-3 text-base font-medium text-ink-dim hover:bg-white/5 hover:text-ink"
              >
                {l.label}
              </a>
            ))}
            <a
              href="https://powerhouse360.de"
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-3 text-base font-medium text-ink-faint hover:bg-white/5 hover:text-ink"
            >
              ← Powerhouse 360
            </a>
            <ButtonLink
              href={SM_CTA.bestandscheck.href}
              variant="primary"
              className="mt-2 w-full"
              onClick={() => setOpen(false)}
            >
              {SM_CTA.bestandscheck.label}
            </ButtonLink>
          </div>
        </div>
      )}
    </header>
  );
}
