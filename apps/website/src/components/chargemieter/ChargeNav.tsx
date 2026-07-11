"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ButtonLink } from "@/components/ui/Button";
import { CM_CTA } from "@/content/chargemieter";

const LINKS = [
  { label: "Lösung", href: "#loesung" },
  /* längster Eintrag — erst ab xl, damit die Leiste bei 1024–1280 px ruhig bleibt */
  { label: "Lastmanagement", href: "#lastmanagement", wide: true },
  { label: "Abrechnung", href: "#abrechnung" },
  { label: "Förderung", href: "#foerderung" },
  { label: "Ablauf", href: "#ablauf" },
];

/**
 * Schlanke ChargeMieter-Navigation: Marke + Rückweg zur Powerhouse-360-
 * Startseite, Kapitel-Anker, Förder-CTA. Cyan-Progress-Hairline statt Gold —
 * die Seite gehört dem Charge-Modul.
 */
export default function ChargeNav() {
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
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3 sm:px-8 lg:gap-6">
        {/* ── Marke: Icon + einzeiliger Wortzug (nie abgeschnitten) ── */}
        <div className="flex shrink-0 items-center gap-3">
          {/* »Charge« weiß statt schwarz (Noir-Grund), »Mieter« im
              Logo-Verlauf Cyan→Grün — wie im Logo-Lockup. */}
          <a href="#hero" className="flex items-center gap-2.5">
            <Image
              src="/brand/chargemieter-mark.png"
              alt=""
              width={72}
              height={72}
              priority
              unoptimized
              className="h-9 w-9 shrink-0 drop-shadow-[0_2px_10px_rgba(60,190,180,0.3)]"
              aria-hidden
            />
            <span className="flex flex-col justify-center">
              <span className="whitespace-nowrap text-lg font-bold leading-none tracking-tight text-ink">
                Charge
                <span className="cm-brand-gradient">Mieter</span>
              </span>
              <span className="mt-1 hidden whitespace-nowrap text-[9px] font-semibold uppercase leading-none tracking-[0.18em] text-ink-faint xl:block">
                Laden im Mehrfamilienhaus
              </span>
            </span>
          </a>
          {/* Trenner + Powerhouse-Backlink gemeinsam erst ab xl (kein
              verwaister Strich auf mittleren Breiten). */}
          <span className="hidden h-5 w-px bg-white/12 xl:block" aria-hidden />
          <a
            href="https://powerhouse360.de"
            className="hidden whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-faint transition-colors hover:text-ink xl:block"
          >
            Powerhouse 360
          </a>
        </div>

        {/* ── Kapitel-Anker ── */}
        <div className="hidden items-center gap-6 lg:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className={`whitespace-nowrap text-sm font-medium text-ink-dim transition-colors hover:text-ink ${
                l.wide ? "hidden xl:inline-block" : ""
              }`}
            >
              {l.label}
            </a>
          ))}
        </div>

        {/* ── CTA ── */}
        <div className="hidden shrink-0 lg:block">
          <ButtonLink href={CM_CTA.foerderung.href} variant="primary">
            {CM_CTA.foerderung.label}
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

      {/* Scroll-Progress — cyan */}
      <div className="h-px w-full bg-white/5">
        <div
          className="h-full transition-[width] duration-150"
          style={{
            width: `${progress * 100}%`,
            background:
              "linear-gradient(90deg, #2f6fc1, var(--color-mod-charge), var(--color-brand-green))",
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
              href={CM_CTA.foerderung.href}
              variant="primary"
              className="mt-2 w-full"
              onClick={() => setOpen(false)}
            >
              {CM_CTA.foerderung.label}
            </ButtonLink>
          </div>
        </div>
      )}
    </header>
  );
}
