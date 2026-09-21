"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
// Relative Imports (statt @/-Alias): die Datei wird zusätzlich vom
// design-sync-Bundle außerhalb der Next-Runtime aufgelöst.
import { ButtonLink } from "../ui/Button";
import {
  PM_SCENES,
  PM_CTA_SUPPORT,
  PM_COMPLEXITY_LABELS,
  PM_BENEFITS,
  PM_OWNER_CARDS,
  PM_ADMIN_WIDGETS,
  PM_RESIDENT_CARD,
  PM_RESIDENT_BENEFITS,
  PM_PILOT,
  PM_IMAGE,
  PM_VIDEO,
  type PmScene,
} from "../../content/powermieter";

/**
 * /powermieter — die asset-leichte Modul-Journey (Brief 2026-08-14):
 * gleiche Szenen-Grammatik wie die Geschwisterseiten (Kicker → Headline →
 * Accent-Zeile → Overlay), aber als EIN responsives Erlebnis ohne
 * Desktop/Mobile-Fork und ohne Scrub-Sequenzen. Hero/CTA tragen das
 * vorhandene Still + den Clip (reduced-motion → nur Still); alle übrigen
 * Szenen leben aus Tokens: Solar-Gold-Akzent (mod-power), card-surface,
 * hairlines — der Markenverlauf hat EINEN Moment: den finalen CTA.
 */

const ACCENT = "var(--color-mod-power)";

/* prefers-reduced-motion, SSR-sicher: Server-Snapshot ist konservativ true
   (Still statt Clip, Inhalte sofort sichtbar); der Client korrigiert nach
   der Hydration über useSyncExternalStore ohne setState-im-Effect. */
function subscribeReducedMotion(cb: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}
function useReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => true
  );
}

/* Reveal-on-scroll: Sektionen blenden beim ersten Eintritt weich ein.
   Unter prefers-reduced-motion stehen die Inhalte sofort. */
function useReveal() {
  const ref = useRef<HTMLElement | null>(null);
  const reduced = useReducedMotion();
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setEntered(true);
          io.disconnect();
        }
      },
      { threshold: 0.18 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduced]);
  return { ref, shown: entered || reduced };
}

function Kicker({ children }: { children: string }) {
  return (
    <p
      className="text-sm font-medium uppercase tracking-widest"
      style={{ color: ACCENT }}
    >
      {children}
    </p>
  );
}

/* ────────────────────────────────────────────── Overlay-Bausteine */

function ComplexityChips() {
  return (
    <div className="mt-10 flex max-w-xl flex-wrap gap-2.5">
      {PM_COMPLEXITY_LABELS.map((label, i) => (
        <span
          key={label}
          className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-ink-dim"
          style={{ opacity: 1 - i * 0.06 }}
        >
          {label}
        </span>
      ))}
    </div>
  );
}

function BenefitRows() {
  return (
    <div className="mt-10 max-w-xl">
      {PM_BENEFITS.map((label, i) => (
        <div key={label}>
          {i > 0 && <div className="hairline" />}
          <div className="flex items-baseline gap-4 py-3.5">
            <span
              className="text-sm font-semibold tabular-nums"
              style={{ color: ACCENT }}
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="text-lg text-ink">{label}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function OwnerCards() {
  return (
    <div className="mt-10 grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
      {PM_OWNER_CARDS.map((label) => (
        <div key={label} className="card-surface px-5 py-4">
          <span className="text-base text-ink">{label}</span>
        </div>
      ))}
    </div>
  );
}

const STATE_COLOR: Record<"ok" | "info" | "warn", string> = {
  ok: "var(--color-gold-soft)",
  info: "var(--color-mod-charge)",
  warn: "var(--color-warm-amber)",
};

function AdminBoard() {
  return (
    <div className="mt-10 grid max-w-2xl grid-cols-2 gap-2.5 sm:grid-cols-3">
      {PM_ADMIN_WIDGETS.map((w) => (
        <div
          key={w.label}
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-3"
        >
          <div className="flex items-center gap-2">
            <span
              aria-hidden
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{ background: STATE_COLOR[w.state ?? "ok"] }}
            />
            <span className="text-xs uppercase tracking-wide text-ink-faint">
              {w.label}
            </span>
          </div>
          <p className="mt-1 text-base font-bold tabular-nums text-ink">
            {w.value}
          </p>
        </div>
      ))}
    </div>
  );
}

function ResidentCard() {
  return (
    <div className="mt-10 flex max-w-2xl flex-col gap-6 sm:flex-row sm:items-start">
      <div className="card-surface w-full max-w-xs px-5 py-4">
        <p
          className="text-xs font-medium uppercase tracking-widest"
          style={{ color: ACCENT }}
        >
          {PM_RESIDENT_CARD.title}
        </p>
        <div className="mt-3">
          {PM_RESIDENT_CARD.rows.map((row, i) => (
            <div key={row.label}>
              {i > 0 && <div className="hairline" />}
              <div className="py-2.5">
                <p className="text-xs uppercase tracking-wide text-ink-faint">
                  {row.label}
                </p>
                <p className="mt-0.5 text-sm font-semibold text-ink">
                  {row.value}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <ul className="flex-1 space-y-2.5">
        {PM_RESIDENT_BENEFITS.map((b) => (
          <li key={b} className="flex items-center gap-3 text-ink-dim">
            <span
              aria-hidden
              className="inline-block h-1 w-4 rounded-full"
              style={{ background: ACCENT }}
            />
            {b}
          </li>
        ))}
      </ul>
    </div>
  );
}

function PilotPanel() {
  return (
    <div className="mx-auto mt-12 w-full max-w-2xl">
      <div className="hairline-gradient" />
      <div className="card-surface mt-6 px-6 py-6 text-left sm:px-8">
        {PM_PILOT.facts.map((f, i) => (
          <div key={f.label}>
            {i > 0 && <div className="hairline" />}
            <div className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-[10rem_1fr] sm:gap-4">
              <span className="text-xs uppercase tracking-widest text-ink-faint">
                {f.label}
              </span>
              <span className="text-base text-ink">{f.value}</span>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-5 text-sm leading-relaxed text-ink-faint">
        {PM_PILOT.note}
      </p>
    </div>
  );
}

function Overlay({ scene }: { scene: PmScene }) {
  switch (scene.overlay) {
    case "complexity":
      return <ComplexityChips />;
    case "benefits":
      return <BenefitRows />;
    case "owner":
      return <OwnerCards />;
    case "adminboard":
      return <AdminBoard />;
    case "resident":
      return <ResidentCard />;
    case "pilot":
      return <PilotPanel />;
    default:
      return null;
  }
}

/* ────────────────────────────────────────────── Szenen-Band */

function SceneSection({ scene }: { scene: PmScene }) {
  const { ref, shown } = useReveal();
  const isHero = scene.id === "hero";
  const isCta = scene.id === "cta";
  const centered = scene.align === "center";

  return (
    <section
      id={scene.id}
      ref={ref as React.RefObject<HTMLElement>}
      className={`relative overflow-hidden ${
        isHero ? "min-h-svh" : "min-h-[88svh]"
      } flex items-center bg-navy-900`}
    >
      {/* Media-Ebene: nur Hero/CTA tragen Still+Clip; dazwischen bleibt der
          Void schwarz und die Karten tragen die Szene. */}
      {(isHero || isCta) && <HeroMedia dim={isHero ? 0.35 : 0.62} />}

      {/* Richtungs-Scrim für Lesbarkeit über Medien */}
      {(isHero || isCta) && (
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background: centered
              ? "radial-gradient(ellipse at center, transparent 0%, rgba(10,11,13,0.72) 78%)"
              : "linear-gradient(100deg, rgba(10,11,13,0.88) 22%, rgba(10,11,13,0.28) 64%, transparent 100%)",
          }}
        />
      )}

      <div
        className={`relative mx-auto w-full max-w-6xl px-6 py-24 sm:px-10 ${
          centered
            ? "text-center"
            : scene.align === "right"
              ? "sm:ml-auto sm:max-w-3xl sm:pr-16 lg:mr-24"
              : "sm:max-w-3xl lg:ml-24"
        } transition-all duration-700 ${
          shown ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
        }`}
      >
        <Kicker>{scene.kicker}</Kicker>
        <h2 className="mt-4 text-4xl font-bold leading-tight text-ink text-legible sm:text-5xl">
          {scene.headline}
          {scene.headlineAccent && (
            <span className="mt-2 block" style={{ color: ACCENT }}>
              {scene.headlineAccent}
            </span>
          )}
        </h2>
        <p
          className={`mt-5 max-w-xl text-lg leading-relaxed text-ink-dim ${
            centered ? "mx-auto" : ""
          }`}
        >
          {scene.subline}
        </p>

        <Overlay scene={scene} />

        {scene.cta && (
          <div
            className={`mt-10 flex flex-wrap items-center gap-3 ${
              centered ? "justify-center" : ""
            }`}
          >
            {scene.cta.map((c) => (
              <ButtonLink key={c.label} href={c.href} variant={c.variant}>
                {c.label}
              </ButtonLink>
            ))}
          </div>
        )}

        {isCta && (
          <p className="mt-6 text-sm text-ink-faint">{PM_CTA_SUPPORT}</p>
        )}
      </div>
    </section>
  );
}

/* Hero-/CTA-Medienebene: Clip mit Still als Poster; reduced-motion oder
   Datenspar-Umgebungen bekommen nur das Still. */
function HeroMedia({ dim }: { dim: number }) {
  const motionOk = !useReducedMotion();
  return (
    <div aria-hidden className="absolute inset-0">
      {motionOk ? (
        <video
          className="h-full w-full object-cover"
          src={PM_VIDEO.hero}
          poster={PM_IMAGE.hero}
          autoPlay
          muted
          loop
          playsInline
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- Ambient-Still hinter Scrim; next/image bringt hier keinen Vorteil
        <img
          className="h-full w-full object-cover"
          src={PM_IMAGE.hero}
          alt=""
        />
      )}
      <div
        className="absolute inset-0"
        style={{ background: `rgba(10, 11, 13, ${dim})` }}
      />
    </div>
  );
}

export function PowerExperience() {
  return (
    <div className="bg-navy-900 text-ink">
      {PM_SCENES.map((scene) => (
        <SceneSection key={scene.id} scene={scene} />
      ))}
    </div>
  );
}

// Named + Default: named für `export *`-Bundles (design-sync),
// Default für den bestehenden Page-Import.
export default PowerExperience;
