"use client";

import { useEffect, useRef } from "react";
import {
  WHY_BLOCKS,
  TARGET_GROUPS,
  ONBOARDING_STEPS,
  FAQ_ITEMS,
} from "@/content/sections";

/**
 * The four QUIET sections between the platform station and the final CTA:
 * §9 Warum · §10 Zielgruppen · §11 Einführung · §12 FAQ.
 *
 * Deliberately calm: opaque off-black ground (they scroll OVER the fixed
 * cinematic stage), graphite card surfaces, gold hairlines, generous
 * negative space, no imagery — the cinema pauses, the facts speak.
 */
export default function QuietSections() {
  const rootRef = useRef<HTMLDivElement>(null);
  const hubVideoRef = useRef<HTMLVideoElement>(null);

  // Self-contained reveal observer (works in both experiences).
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach(
          (e) => e.isIntersecting && e.target.classList.add("is-in")
        ),
      { threshold: 0.18 }
    );
    rootRef.current
      ?.querySelectorAll(".q-reveal")
      .forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  // Hub-Produktfilm: spielt nur im Viewport; unter prefers-reduced-motion
  // bleibt das Poster stehen.
  useEffect(() => {
    const vid = hubVideoRef.current;
    if (!vid) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches)
      return;
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) vid.play().catch(() => {});
          else vid.pause();
        }),
      { threshold: 0.35 }
    );
    io.observe(vid);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={rootRef} className="relative z-10 bg-navy-900">
      {/* top hairline handoff from the cinema */}
      <div className="hairline mx-auto max-w-4xl" />

      {/* ───────────────────────────── POWERHOUSE Hub v1 ──
          Zwei Spalten: links der Textkörper, rechts der Hub-Produktfilm als
          gerahmte Karte. Opaker Navy-Grund für einen sauberen Übergang aus
          der Plattform-Station (kein Vollbild-Video mehr). */}
      <section
        id="hub"
        aria-labelledby="hub-h"
        className="relative overflow-hidden pb-28 pt-24 sm:pb-32 sm:pt-28 lg:pb-40 lg:pt-32"
      >
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-2 lg:gap-16">
          {/* Textkörper — links */}
          <div className="q-reveal order-2 lg:order-1">
            <p className="mb-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-gold">
              <span className="h-px w-8 bg-gold/60" />
              POWERHOUSE Hub v1
            </p>
            <h2
              id="hub-h"
              className="text-3xl font-bold leading-[1.1] text-ink sm:text-4xl md:text-[2.75rem]"
            >
              Die lokale Schaltzentrale im Gebäude.
            </h2>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-ink-dim sm:text-lg">
              Der Hub verbindet Geräte, Zähler und Sensorik im Objekt und
              übergibt die Daten strukturiert an die Plattform – dieselbe
              lokale Datenbasis für alle Module.
            </p>
            <ul className="mt-8 space-y-3">
              {[
                "verbindet Strom, Wärme, Laden und Sicherheit",
                "lokale Gebäudedatenplattform im Objekt",
                "Schnittstelle zu Zählern, Wärmepumpe, Sensorik und Cloud",
                "Grundlage für Monitoring, Abrechnung und Betrieb",
              ].map((line) => (
                <li
                  key={line}
                  className="flex items-start gap-3 text-[15px] leading-relaxed text-ink-dim"
                >
                  <span
                    aria-hidden
                    className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold"
                  />
                  {line}
                </li>
              ))}
            </ul>
          </div>

          {/* Produktfilm — rechts */}
          <div className="q-reveal order-1 lg:order-2">
            <div className="relative overflow-hidden rounded-3xl border border-white/12 bg-navy-900 shadow-[0_40px_120px_-30px_rgba(0,0,0,0.9)]">
              <video
                ref={hubVideoRef}
                src="/media/hub-v1.mp4"
                poster="/media/hub-v1-poster.jpg"
                muted
                loop
                playsInline
                preload="metadata"
                aria-label="Produktfilm: POWERHOUSE Hub v1 – die lokale Zentrale im Gebäude"
                className="aspect-[4/3] w-full object-cover"
                style={{ objectPosition: "50% 46%" }}
              />
              {/* feiner Innenrahmen + weicher unterer Verlauf für Tiefe */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-inset ring-white/10"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-navy-900/70 to-transparent"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────── §9 Warum Powerhouse 360 ── */}
      <section
        id="vorteile"
        aria-labelledby="vorteile-h"
        className="mx-auto max-w-6xl px-5 py-28 sm:px-8 sm:py-36"
      >
        <div className="q-reveal max-w-2xl">
          <p className="mb-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-gold">
            <span className="h-px w-8 bg-gold/60" />
            Warum Powerhouse 360
          </p>
          <h2
            id="vorteile-h"
            className="text-3xl font-bold leading-[1.1] text-ink sm:text-4xl md:text-[2.75rem]"
          >
            Ruhe im Betrieb.
            <br />
            Klarheit in den Daten.
          </h2>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {WHY_BLOCKS.map((b, i) => (
            <div
              key={b.title}
              className="q-reveal card-surface p-6 transition-colors duration-300"
              style={{ transitionDelay: `${(i % 3) * 70}ms` }}
            >
              <h3 className="text-base font-semibold text-ink">{b.title}</h3>
              <p className="mt-2.5 text-sm leading-relaxed text-ink-dim">
                {b.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ───────────────────────────────────── §10 Zielgruppen ── */}
      <section
        id="zielgruppen"
        aria-labelledby="zielgruppen-h"
        className="border-t border-white/5 bg-[#0c0d10]"
      >
        <div className="mx-auto max-w-6xl px-5 py-28 sm:px-8 sm:py-36">
          <div className="q-reveal max-w-2xl">
            <p className="mb-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-gold">
              <span className="h-px w-8 bg-gold/60" />
              Für wen
            </p>
            <h2
              id="zielgruppen-h"
              className="text-3xl font-bold leading-[1.1] text-ink sm:text-4xl md:text-[2.75rem]"
            >
              Gebaut für die, die Gebäude verantworten.
            </h2>
          </div>

          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {TARGET_GROUPS.map((t, i) => (
              <div
                key={t.title}
                className="q-reveal card-surface p-6"
                style={{ transitionDelay: `${(i % 3) * 70}ms` }}
              >
                <h3 className="text-base font-semibold text-ink">{t.title}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-ink-dim">
                  {t.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────── §11 Einführung ── */}
      <section
        id="ablauf"
        aria-labelledby="ablauf-h"
        className="border-t border-white/5"
      >
        <div className="mx-auto max-w-6xl px-5 py-28 sm:px-8 sm:py-36">
          <div className="q-reveal max-w-2xl">
            <p className="mb-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-gold">
              <span className="h-px w-8 bg-gold/60" />
              Einführung
            </p>
            <h2
              id="ablauf-h"
              className="text-3xl font-bold leading-[1.1] text-ink sm:text-4xl md:text-[2.75rem]"
            >
              In fünf Schritten ins Betriebssystem.
            </h2>
          </div>

          <ol className="mt-14 space-y-0">
            {ONBOARDING_STEPS.map((s, i) => (
              <li
                key={s.step}
                className="q-reveal relative grid gap-2 border-l border-white/10 py-7 pl-10 sm:grid-cols-[110px_1fr] sm:gap-8"
                style={{ transitionDelay: `${i * 60}ms` }}
              >
                <span
                  aria-hidden
                  className="absolute -left-[5px] top-[38px] h-2.5 w-2.5 rounded-full border border-gold/60 bg-navy-900"
                />
                <span className="text-2xl font-bold tabular-nums text-gold/80 sm:text-3xl">
                  {s.step}
                </span>
                <div>
                  <h3 className="text-lg font-semibold text-ink">{s.title}</h3>
                  <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-ink-dim">
                    {s.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ────────────────────────────────────────── §12 FAQ ── */}
      <section
        id="faq"
        aria-labelledby="faq-h"
        className="border-t border-white/5 bg-[#0c0d10]"
      >
        <div className="mx-auto max-w-3xl px-5 py-28 sm:px-8 sm:py-36">
          <div className="q-reveal">
            <p className="mb-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-gold">
              <span className="h-px w-8 bg-gold/60" />
              FAQ
            </p>
            <h2
              id="faq-h"
              className="text-3xl font-bold leading-[1.1] text-ink sm:text-4xl"
            >
              Fragen &amp; Antworten
            </h2>
          </div>

          <div className="mt-12 divide-y divide-white/8 border-y border-white/8">
            {FAQ_ITEMS.map((f) => (
              <details key={f.q} className="q-reveal group">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-left text-base font-medium text-ink transition-colors hover:text-gold-soft [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <span
                    aria-hidden
                    className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-white/15 text-ink-dim transition-transform duration-300 group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="pb-6 pr-10 text-sm leading-relaxed text-ink-dim">
                  {f.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* reveal styling */}
      <style jsx>{`
        div :global(.q-reveal) {
          opacity: 0;
          transform: translateY(26px);
          transition: opacity 0.8s var(--ease-calm),
            transform 0.8s var(--ease-calm);
        }
        div :global(.q-reveal.is-in) {
          opacity: 1;
          transform: none;
        }
        @media (prefers-reduced-motion: reduce) {
          div :global(.q-reveal) {
            opacity: 1;
            transform: none;
            transition: none;
          }
        }
      `}</style>
    </div>
  );
}
