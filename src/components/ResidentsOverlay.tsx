"use client";

/**
 * Residents portal overlay (Section 6, REF-D "Paula").
 *
 * Echoes the PowerHouse360 product: a friendly "Paula" assistant card + a small
 * tenant energy mini-dashboard (current consumption, PV self-supply donut, a
 * Paula tip). Green + navy brand, calm, premium. Sits beside the residents
 * headline as a glassy card group over the warm apartment 3D twin.
 */
export default function ResidentsOverlay() {
  return (
    <div className="mt-8 w-full max-w-md">
      {/* Paula assistant card */}
      <div className="relative overflow-hidden rounded-2xl border border-brand-green/25 bg-white/[0.05] p-4 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-green to-brand-teal text-navy-900">
            <PaulaIcon />
          </span>
          <div>
            <p className="text-sm font-bold text-ink">Hi, ich bin Paula!</p>
            <p className="text-xs text-ink-dim">
              Deine persönliche Energieberaterin
            </p>
          </div>
        </div>
        <p className="mt-3 rounded-xl bg-navy-900/40 p-3 text-sm leading-relaxed text-ink-dim">
          Diesen Monat hast du{" "}
          <span className="font-semibold text-brand-green">31&nbsp;€ gespart</span>{" "}
          und deckst <span className="font-semibold text-brand-aqua">68&nbsp;%</span>{" "}
          deines Stroms direkt vom eigenen Dach.
        </p>
      </div>

      {/* mini dashboard: consumption + PV self-supply */}
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-md">
          <p className="text-[11px] font-medium uppercase tracking-wide text-ink-faint">
            Aktueller Verbrauch
          </p>
          <p className="mt-1.5 flex items-baseline gap-1">
            <span className="text-2xl font-bold tabular-nums text-ink">8,7</span>
            <span className="text-sm font-semibold text-ink-dim">kWh</span>
          </p>
          <p className="mt-0.5 text-xs font-semibold text-brand-green">
            −18&nbsp;% ggü. Vormonat
          </p>
          {/* tiny bar sparkline */}
          <div className="mt-3 flex h-8 items-end gap-1" aria-hidden>
            {[40, 62, 48, 70, 55, 38, 30].map((h, i) => (
              <span
                key={i}
                className="flex-1 rounded-sm bg-gradient-to-t from-brand-teal/40 to-brand-teal"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-md">
          <p className="text-[11px] font-medium uppercase tracking-wide text-ink-faint">
            PV-Eigenversorgung
          </p>
          <div className="mt-2 flex items-center gap-3">
            <Donut percent={68} />
            <div>
              <p className="text-2xl font-bold tabular-nums text-brand-green">
                68%
              </p>
              <p className="text-xs text-ink-dim">vom Dach</p>
            </div>
          </div>
        </div>
      </div>

      {/* Paula tip */}
      <div className="mt-3 flex items-start gap-2 rounded-2xl border border-brand-teal/20 bg-brand-teal/[0.07] p-3 backdrop-blur-md">
        <span className="mt-0.5 text-brand-aqua">
          <BulbIcon />
        </span>
        <p className="text-xs leading-relaxed text-ink-dim">
          <span className="font-semibold text-ink">Paulas Tipp:</span> Lade dein
          E-Auto zwischen 11–15 Uhr, wenn die PV-Anlage am meisten liefert.
        </p>
      </div>
    </div>
  );
}

function Donut({ percent }: { percent: number }) {
  const r = 16;
  const c = 2 * Math.PI * r;
  const filled = (percent / 100) * c;
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" aria-hidden>
      <circle cx="22" cy="22" r={r} fill="none" stroke="#20344f" strokeWidth="6" />
      <circle
        cx="22"
        cy="22"
        r={r}
        fill="none"
        stroke="#43b649"
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={`${filled} ${c}`}
        transform="rotate(-90 22 22)"
      />
    </svg>
  );
}

function PaulaIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-6 8-6s8 2 8 6" />
    </svg>
  );
}
function BulbIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18h6M10 22h4" />
      <path d="M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.1V18h6v-1.2c0-.8.4-1.6 1-2.1A7 7 0 0 0 12 2z" />
    </svg>
  );
}
