import { LogoLockup } from "./ui/Logo";
import { NAV_LINKS } from "@/content/sections";

export default function Footer() {
  return (
    <footer className="relative z-10 border-t border-white/8 bg-navy-900">
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <LogoLockup className="h-8 w-auto" />
            <p className="mt-5 text-sm leading-relaxed text-ink-faint">
              Das Building-OS für Mehrfamilienhäuser. Aus einem Gebäude wird ein
              intelligentes Energie-Asset – Solar, Wärme, Messung, Abrechnung und
              Betrieb in einem System.
            </p>
          </div>

          <nav className="flex flex-wrap gap-x-10 gap-y-3" aria-label="Footer">
            <ul className="flex flex-col gap-3">
              {NAV_LINKS.map((l) => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    className="text-sm text-ink-dim transition-colors hover:text-ink"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
            <ul className="flex flex-col gap-3">
              <li>
                <a href="#cta" className="text-sm text-ink-dim hover:text-ink">
                  Pilotobjekt anfragen
                </a>
              </li>
              <li>
                <a href="#cta" className="text-sm text-ink-dim hover:text-ink">
                  Demo buchen
                </a>
              </li>
            </ul>
          </nav>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/8 pt-6 text-xs text-ink-faint sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} POWERHOUSE 360. Alle Rechte vorbehalten.</p>
          <p>Energieaktive Mehrfamilienhäuser · Made in Germany</p>
        </div>
      </div>
    </footer>
  );
}
