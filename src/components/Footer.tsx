import { LogoLockup } from "./ui/Logo";
import { MODULES, NAV_LINKS } from "@/content/sections";

export default function Footer() {
  return (
    <footer className="relative z-10 border-t border-white/8 bg-navy-900">
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <LogoLockup className="h-8 w-auto" />
            <p className="mt-5 text-sm leading-relaxed text-ink-faint">
              Das Betriebssystem deiner Immobilie. Energie, Wärme,
              Ladeinfrastruktur, Sicherheit und digitale Prozesse – verbunden
              in einer Plattform für Mehrfamilienhäuser.
            </p>
          </div>

          <nav
            className="flex flex-wrap gap-x-12 gap-y-8"
            aria-label="Footer"
          >
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-ink-faint">
                Module
              </p>
              <ul className="flex flex-col gap-3">
                {MODULES.map((m) => (
                  <li key={m.id}>
                    <a
                      href={`/#${m.id}`}
                      className="text-sm text-ink-dim transition-colors hover:text-ink"
                    >
                      {m.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-ink-faint">
                Plattform
              </p>
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
            </div>
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-ink-faint">
                Kontakt
              </p>
              <ul className="flex flex-col gap-3">
                <li>
                  <a href="/demo" className="text-sm text-ink-dim hover:text-ink">
                    Demo anfragen
                  </a>
                </li>
                <li>
                  <a
                    href="/projekt-besprechen"
                    className="text-sm text-ink-dim hover:text-ink"
                  >
                    Projekt besprechen
                  </a>
                </li>
                <li>
                  <a
                    href="mailto:info@powerhouse360.de"
                    className="text-sm text-ink-dim hover:text-ink"
                  >
                    info@powerhouse360.de
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-ink-faint">
                Rechtliches
              </p>
              <ul className="flex flex-col gap-3">
                <li>
                  <a
                    href="/impressum"
                    className="text-sm text-ink-dim hover:text-ink"
                  >
                    Impressum
                  </a>
                </li>
                <li>
                  <a
                    href="/datenschutz"
                    className="text-sm text-ink-dim hover:text-ink"
                  >
                    Datenschutz
                  </a>
                </li>
              </ul>
            </div>
          </nav>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/8 pt-6 text-xs text-ink-faint sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} AKL Powerhouse 360 GmbH. Alle Rechte
            vorbehalten.
          </p>
          <p>Das Betriebssystem für Mehrfamilienhäuser</p>
        </div>
      </div>
    </footer>
  );
}
