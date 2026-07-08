"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { HM_IMAGE, HM_SCENES, HM_CINE_VIDEO } from "@/content/heatmieter";
import {
  hmCineSceneFloat,
  hmCineRawFloat,
  hmCineGetReduced,
  hmCineFrameLoop,
} from "@/lib/heatCine";
import HeatStoryLayer from "./HeatStoryLayer";

/**
 * HeatStage — die fixierte Medienebene der /heatmieter-Cine-Journey.
 *
 * Zwei Systeme in einer Bühne:
 *  1) Sachthemen (Szenen 5–13): Still-Crossfade pro MEDIA-KEY (winter/anlage/
 *     pump/thaw), Ziel-Deckkraft = Maximum über alle Szenen, die ihn nutzen,
 *     gewichtet mit Szenennähe (plateaued Szenen-Float) × (1 − mediaDim).
 *     Der anlage-Key trägt zusätzlich den Live-Loop-Clip (Erfassung).
 *  2) Story (Szenen 1–4): der Zwei-Winter-Mega-Layer (HeatStoryLayer) —
 *     Winter-Frame-Scrub, Washes, WP/Tauwetter, Datenlayer, Ticker, Copy,
 *     Bills, Beats — getrieben vom Story-Float. Der Hero (Szene 0) liegt auf
 *     dem winter-Still mit sanftem Push-in; der Story-Layer blendet an der
 *     Hero-Kante über das identische Winter-Motiv nahtlos ein.
 *
 * Port von ChargeStage.tsx (der Hero-Frame-Scrub lebt hier im Story-Layer).
 */

const FADE_HALF = 0.62;
const HOLD_SCALE = 1.05;
const TRAVEL_SCALE = 0.07;
const VIDEO_WARM = 1.4;
const VIDEO_PLAY = 0.8;

function smoother(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return x * x * x * (x * (x * 6 - 15) + 10);
}

function smoothstep(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
}

/** Medien-Keys in Render-Reihenfolge (winter unten, thaw/anlage oben). */
const MEDIA_KEYS = ["winter", "pump", "thaw", "anlage"] as const;
type MediaKey = (typeof MEDIA_KEYS)[number];

const LAST_INDEX = HM_SCENES.length - 1;

/** Für jeden Media-Key: die Szenen, die ihn zeigen (index + mediaDim). */
const USAGE: Record<MediaKey, { index: number; dim: number }[]> = (() => {
  const u: Record<string, { index: number; dim: number }[]> = {
    winter: [],
    pump: [],
    thaw: [],
    anlage: [],
  };
  HM_SCENES.forEach((s) => {
    if (s.media && u[s.media]) u[s.media].push({ index: s.index, dim: s.mediaDim });
  });
  return u as Record<MediaKey, { index: number; dim: number }[]>;
})();

export default function HeatStage({ onReady }: { onReady?: () => void }) {
  const layerRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});
  const grainRef = useRef<HTMLDivElement>(null);
  const readyFired = useRef(false);

  /* ── ready: sobald das Winter-Poster dekodiert ist ── */
  useEffect(() => {
    let cancelled = false;
    const img = new window.Image();
    const fire = () => {
      if (!cancelled && !readyFired.current) {
        readyFired.current = true;
        onReady?.();
      }
    };
    img.onload = fire;
    img.onerror = fire;
    img.src = HM_IMAGE.winter;
    if (img.complete) fire();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Frame-Treiber ── */
  useEffect(() => {
    const onHide = () => {
      if (document.hidden)
        Object.values(videoRefs.current).forEach(
          (v) => v && !v.paused && v.pause()
        );
    };
    document.addEventListener("visibilitychange", onHide);

    const tick = (now: number) => {
      const rm = hmCineGetReduced();
      const sf = hmCineSceneFloat();
      const raw = hmCineRawFloat();

      for (const key of MEDIA_KEYS) {
        const el = layerRefs.current[key];
        if (!el) continue;

        let op = 0;
        let nearest = 99;
        for (const use of USAGE[key]) {
          let d = sf - use.index;
          // winter-Ebene bleibt vor Szene 0 voll (kein Fade beim Laden).
          if (use.index === 0 && d < 0) d = 0;
          // Letzte Szene (thaw/cta) bleibt bis zum Seitenende voll.
          if (use.index === LAST_INDEX && d > 0) d = 0;
          const ad = Math.abs(d);
          const w = 1 - smoother((ad - 0.04) / FADE_HALF);
          op = Math.max(op, w * (1 - use.dim));
          nearest = Math.min(nearest, ad);
        }

        el.style.opacity = op.toFixed(3);
        el.style.visibility = op < 0.012 ? "hidden" : "visible";

        // Hero-Push-in auf dem winter-Still, sonst ruhiger Ken-Burns.
        const heroPush =
          key === "winter" && raw < 1.3
            ? 1 + 0.09 * smoothstep(Math.min(1, raw))
            : 0;
        const breathe = rm
          ? 0
          : 0.01 * (0.5 + 0.5 * Math.sin(now / 4600 + MEDIA_KEYS.indexOf(key)));
        const scale = heroPush
          ? heroPush + breathe
          : HOLD_SCALE + Math.min(1.4, nearest) * TRAVEL_SCALE + breathe;
        el.style.transform = `scale(${scale.toFixed(4)})`;

        /* Clip-Lifecycle (nur anlage) */
        const vid = videoRefs.current[key];
        const src = HM_CINE_VIDEO[key];
        if (vid && src) {
          const warm = !rm && nearest < VIDEO_WARM;
          if (warm && !vid.getAttribute("src")) {
            vid.setAttribute("src", src);
            vid.load();
          }
          const wantPlay =
            !rm && nearest < VIDEO_PLAY && !document.hidden && op > 0.05;
          if (wantPlay && vid.paused && vid.getAttribute("src")) {
            vid.playbackRate = 0.85;
            vid.play().catch(() => {});
          } else if (!wantPlay && !vid.paused) {
            vid.pause();
          }
          vid.style.opacity = vid.readyState >= 3 ? "1" : "0";
        }
      }

      /* grain drift */
      if (grainRef.current && !rm) {
        const gx = (Math.sin(now / 1700) * 2).toFixed(1);
        const gy = (Math.cos(now / 2300) * 2).toFixed(1);
        grainRef.current.style.transform = `translate3d(${gx}px, ${gy}px, 0)`;
      }
    };
    const stop = hmCineFrameLoop(tick);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onHide);
    };
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden bg-navy-900">
      {/* 1 · Sachthemen-Stills (Crossfade pro Media-Key) */}
      {MEDIA_KEYS.map((key) => (
        <div
          key={key}
          ref={(el) => {
            layerRefs.current[key] = el;
          }}
          className="absolute inset-0 will-change-[transform,opacity]"
          style={{ opacity: 0, visibility: "hidden" }}
          aria-hidden={key !== "winter"}
        >
          <Image
            src={HM_IMAGE[key]}
            alt={
              key === "winter"
                ? "Mehrfamilienhaus im Winter bei Blue Hour — Schnee, warme Fenster, Wärmepumpe im Hof"
                : ""
            }
            fill
            priority={key === "winter"}
            loading={key === "winter" ? undefined : "lazy"}
            sizes="100vw"
            unoptimized
            className="object-cover"
            draggable={false}
          />

          {HM_CINE_VIDEO[key] && (
            <video
              ref={(el) => {
                videoRefs.current[key] = el;
              }}
              muted
              loop
              playsInline
              preload="none"
              disablePictureInPicture
              aria-hidden
              tabIndex={-1}
              className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700"
              style={{ opacity: 0 }}
            />
          )}
        </div>
      ))}

      {/* 2 · Story-Mega-Layer (Szenen 1–4) über den Sachthemen-Stills */}
      <HeatStoryLayer />

      {/* 3 · Grade: Tiefen-Wash + weiche Vignette */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(6,7,9,0.34) 0%, rgba(6,7,9,0) 26%, rgba(6,7,9,0) 68%, rgba(6,7,9,0.5) 100%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(125% 100% at 50% 44%, transparent 52%, rgba(6,7,9,0.55) 100%)",
        }}
      />

      {/* 4 · feines Filmkorn */}
      <div
        ref={grainRef}
        className="pointer-events-none absolute -inset-8 opacity-[0.05] mix-blend-soft-light will-change-transform"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
    </div>
  );
}
