"use client";

import { useEffect, useState } from "react";
import { ButtonLink } from "@/components/ui/Button";
import { HM_CTA } from "@/content/heatmieter";

const LINKS = [
  { label: "Zwei Winter", href: "#story" },
  { label: "Pflicht", href: "#pflicht" },
  { label: "Erfassung", href: "#erfassung" },
  { label: "Ablauf", href: "#ablauf" },
  { label: "System", href: "#plattform" },
];

/** Bildmarke: aufsteigende Wärmelinien im Heat-Akzent. */
function HeatMark({ size = 38 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 38 38"
      fill="none"
      aria-hidden
    >
      <rect
        x="1"
        y="1"
        width="36"
        height="36"
        rx="10"
        fill="rgba(228,106,63,0.12)"
        stroke="rgba(228,106,63,0.45)"
      />
      {[13, 19, 25].map((x) => (
        <path
          key={x}
          d={`M${x} 27c2-1.6 2-4 0-5.6s-2-4 0-5.6`}
          stroke="var(--color-mod-heat)"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
      ))}
    </svg>
  );
}

/**
 * Schlanke HeatMieter-Navigation: Marke + Kapitel-Anker + Heizkosten-Check-
 * CTA. Progress-Hairline läuft von Kalt-Blau ins Heat-Orange — die
 * Farbdramaturgie der Story in einer Linie.
 */
export default function HeatNav() {
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
          {/* HeatMieter-Logo — Rückweg zu Powerhouse 360 liegt im
              Mobilmenü und im Footer. */}
          <a href="#start" className="flex min-w-0 items-center gap-3">
            <span className="shrink-0">
              <HeatMark size={38} />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-lg font-bold leading-none tracking-tight text-ink">
                Heat
                <span className="text-[color:var(--color-mod-heat)]">
                  Mieter
                </span>
              </span>
              <span className="mt-0.5 hidden text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-faint sm:block">
                Heizkostenabrechnung im Mehrfamilienhaus
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
          <ButtonLink href={HM_CTA.heizkostencheck.href} variant="primary">
            Heizkosten-Check
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

      {/* Scroll-Progress — kalt → warm */}
      <div className="h-px w-full bg-white/5">
        <div
          className="h-full transition-[width] duration-150"
          style={{
            width: `${progress * 100}%`,
            background:
              "linear-gradient(90deg, #2e5696, var(--color-mod-heat), #f2b98a)",
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
              href={HM_CTA.heizkostencheck.href}
              variant="primary"
              className="mt-2 w-full"
              onClick={() => setOpen(false)}
            >
              {HM_CTA.heizkostencheck.label}
            </ButtonLink>
          </div>
        </div>
      )}
    </header>
  );
}
