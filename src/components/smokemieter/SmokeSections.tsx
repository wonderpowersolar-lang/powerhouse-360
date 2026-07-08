import Image from "next/image";
import { ButtonLink } from "@/components/ui/Button";
import {
  SM_SECTIONS,
  SM_ADMIN_WIDGETS,
  SM_BILLING_ROWS,
  SM_IMAGE,
  SM_VIDEO,
  type SmSection,
} from "@/content/smokemieter";

/**
 * SmokeSections — Akt 3: acht ruhige, klassisch gestapelte Sachsektionen.
 * Bewusst ohne Scroll-Choreografie: Nach dem Kino der Story darf der
 * Sachteil schnell gelesen und gescannt werden.
 */

const ACCENT = "var(--color-mod-smoke)";

function Points({ section }: { section: SmSection }) {
  if (!section.points) return null;
  const numbered = section.id === "ablauf";
  return (
    <ul
      className={
        numbered
          ? "mt-8 grid gap-3 sm:grid-cols-2"
          : "mt-6 space-y-3"
      }
    >
      {section.points.map((p, i) => (
        <li key={p} className="flex items-baseline gap-3">
          {numbered ? (
            <span
              className="shrink-0 font-mono text-sm font-semibold tabular-nums"
              style={{ color: ACCENT }}
            >
              {String(i + 1).padStart(2, "0")}
            </span>
          ) : (
            <span
              aria-hidden
              className="h-1.5 w-1.5 shrink-0 translate-y-[-2px] rounded-full"
              style={{ background: ACCENT }}
            />
          )}
          <span className="text-legible text-base text-ink-dim sm:text-lg">
            {p}
          </span>
        </li>
      ))}
    </ul>
  );
}

function Media({ section }: { section: SmSection }) {
  if (!section.media && section.id !== "plattform" && section.id !== "abrechnung")
    return null;

  if (section.id === "abrechnung") {
    return (
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.04] p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-faint">
          Beleg-Struktur
        </p>
        <dl className="mt-4 space-y-3">
          {SM_BILLING_ROWS.map((r) => (
            <div
              key={r.label}
              className="flex items-baseline justify-between gap-4 border-b border-white/5 pb-3 last:border-b-0 last:pb-0"
            >
              <dt className="shrink-0 text-sm text-ink-faint">{r.label}</dt>
              <dd className="text-right text-sm font-semibold text-ink">
                {r.value}
              </dd>
            </div>
          ))}
        </dl>
        <div className="mt-4 flex items-center gap-2">
          <span
            aria-hidden
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: ACCENT }}
          />
          <span className="text-xs text-ink-dim">
            Grundlage für die Betriebskostenabrechnung
          </span>
        </div>
      </div>
    );
  }

  if (section.id === "plattform") {
    return (
      <div className="grid w-full max-w-md grid-cols-2 gap-3 sm:grid-cols-2">
        {SM_ADMIN_WIDGETS.map((w) => (
          <div
            key={w.label}
            className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3.5"
          >
            <div className="flex items-center gap-2">
              <span
                aria-hidden
                className="h-1.5 w-1.5 rounded-full"
                style={{
                  background:
                    w.state === "warn"
                      ? "#e8b23c"
                      : w.state === "info"
                      ? "rgba(240,244,252,0.55)"
                      : ACCENT,
                }}
              />
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
                {w.label}
              </span>
            </div>
            <p className="mt-1.5 text-lg font-bold text-ink">{w.value}</p>
          </div>
        ))}
      </div>
    );
  }

  const img = section.media ? SM_IMAGE[section.media] : undefined;
  const vid = section.video ? SM_VIDEO[section.video] : undefined;
  if (!img) return null;

  return (
    <div className="relative aspect-[16/10] w-full max-w-lg overflow-hidden rounded-2xl border border-white/10">
      {vid ? (
        <video
          muted
          loop
          playsInline
          autoPlay
          preload="metadata"
          poster={img}
          aria-hidden
          tabIndex={-1}
          className="absolute inset-0 h-full w-full object-cover"
        >
          <source src={vid} type="video/mp4" />
        </video>
      ) : (
        <Image
          src={img}
          alt=""
          fill
          loading="lazy"
          sizes="(min-width: 1024px) 40vw, 90vw"
          unoptimized
          className="object-cover"
          draggable={false}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-navy-900/40 to-transparent" />
    </div>
  );
}

export default function SmokeSections() {
  return (
    <div className="relative bg-navy-900">
      {SM_SECTIONS.map((s, i) => {
        const mediaNode = <Media section={s} />;
        const hasMedia =
          s.media || s.id === "plattform" || s.id === "abrechnung";
        const mediaRight = i % 2 === 0;

        return (
          <section
            key={s.id}
            id={s.id}
            className="border-t border-white/5"
            aria-labelledby={`${s.id}-h`}
          >
            <div
              className={`mx-auto flex w-full max-w-7xl flex-col gap-10 px-5 py-20 sm:px-8 md:py-28 ${
                hasMedia
                  ? `lg:items-center lg:gap-16 ${
                      mediaRight ? "lg:flex-row" : "lg:flex-row-reverse"
                    }`
                  : ""
              }`}
            >
              <div className={hasMedia ? "lg:w-1/2" : "max-w-3xl"}>
                <p
                  className="mb-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em]"
                  style={{ color: ACCENT }}
                >
                  <span className="h-px w-8 bg-current opacity-60" />
                  {s.kicker}
                </p>
                <h2
                  id={`${s.id}-h`}
                  className="text-legible text-3xl font-bold leading-[1.1] text-ink sm:text-4xl"
                >
                  {s.headline}
                </h2>
                <p className="text-legible mt-5 max-w-xl text-base leading-relaxed text-ink-dim sm:text-lg">
                  {s.subline}
                </p>
                <Points section={s} />
                {s.cta && (
                  <div className="mt-8 flex flex-wrap gap-3">
                    {s.cta.map((c) => (
                      <ButtonLink
                        key={c.label}
                        href={c.href}
                        variant={c.variant}
                      >
                        {c.label}
                      </ButtonLink>
                    ))}
                  </div>
                )}
              </div>
              {hasMedia && (
                <div className="flex lg:w-1/2 lg:justify-center">
                  {mediaNode}
                </div>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
