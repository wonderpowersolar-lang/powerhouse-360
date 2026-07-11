"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import {
  CM_IMAGE,
  CM_VIDEO,
  CM_SCENES,
  CM_SCENE_STAGE,
  CM_HERO_FRAMES,
  cmHeroFramePath,
} from "@/content/chargemieter";
import {
  cmSceneFloat,
  cmRawFloat,
  cmGetReduced,
  cmFrameLoop,
} from "@/lib/chargeProgress";

/**
 * ChargeStage — die fixierte Medienebene hinter der ChargeMieter-Story.
 *
 * Eine Ebene pro MEDIA-KEY (nicht pro Szene): mehrere Szenen teilen sich ein
 * Motiv; die Ziel-Deckkraft einer Ebene ist das Maximum über alle Szenen, die
 * sie verwenden — gewichtet mit der Szenennähe und (1 − mediaDim). Der Hero
 * bekommt zusätzlich die scroll-gescrubbte Frame-Sequenz (Auto → Wallbox) als
 * Canvas, exakt wie der Orbit der Startseite.
 */

const FADE_HALF = 0.62;
const HOLD_SCALE = 1.05;
const TRAVEL_SCALE = 0.07;
/** Der Hero-Scrub ist bei diesem Anteil des Hero-Bands abgeschlossen. */
const HERO_SCRUB_END = 0.85;
const VIDEO_WARM = 1.4;
const VIDEO_PLAY = 0.8;

function smoother(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return x * x * x * (x * (x * 6 - 15) + 10);
}

/** Medien-Keys in Render-Reihenfolge (hero unten, cta oben). */
const MEDIA_KEYS = ["hero", "row", "plug", "garage", "cta"] as const;
type MediaKey = (typeof MEDIA_KEYS)[number];

/** Für jeden Media-Key: die Szenen, die ihn zeigen (index + mediaDim). */
const USAGE: Record<MediaKey, { index: number; dim: number }[]> = (() => {
  const u: Record<string, { index: number; dim: number }[]> = {
    hero: [],
    row: [],
    plug: [],
    garage: [],
    cta: [],
  };
  CM_SCENES.forEach((s) => {
    const st = CM_SCENE_STAGE[s.id];
    if (st?.media && u[st.media]) {
      u[st.media].push({ index: s.index, dim: st.mediaDim });
    }
  });
  return u as Record<MediaKey, { index: number; dim: number }[]>;
})();

export default function ChargeStage({ onReady }: { onReady?: () => void }) {
  const layerRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const grainRef = useRef<HTMLDivElement>(null);
  const readyFired = useRef(false);
  const framesRef = useRef<(HTMLImageElement | null)[]>([]);
  const drawnFrameRef = useRef(-1);
  const canvasOnRef = useRef(false);

  /* ── ready: sobald das Hero-Poster dekodiert ist ── */
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
    img.src = CM_IMAGE.hero;
    if (img.complete) fire();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Hero-Frames streamen (nicht bei reduced motion / save-data) ── */
  useEffect(() => {
    const rm = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const conn = (
      navigator as Navigator & { connection?: { saveData?: boolean } }
    ).connection;
    if (rm || conn?.saveData) return;

    const N = CM_HERO_FRAMES.count;
    if (framesRef.current.length !== N)
      framesRef.current = new Array(N).fill(null);
    let disposed = false;
    let next = 0;
    let inFlight = 0;
    const CONCURRENCY = 6;

    const pump = () => {
      while (!disposed && inFlight < CONCURRENCY && next < N) {
        const idx = next++;
        if (framesRef.current[idx]) continue;
        inFlight++;
        const img = new window.Image();
        img.decoding = "async";
        img.onload = () => {
          framesRef.current[idx] = img;
          inFlight--;
          pump();
        };
        img.onerror = () => {
          inFlight--;
          pump();
        };
        img.src = cmHeroFramePath(idx + 1);
      }
    };
    pump();
    return () => {
      disposed = true;
    };
  }, []);

  /* ── Canvas-Größe (DPR-gedeckelt) ── */
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const size = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      cv.width = Math.round(window.innerWidth * dpr);
      cv.height = Math.round(window.innerHeight * dpr);
      drawnFrameRef.current = -1;
    };
    size();
    window.addEventListener("resize", size);
    return () => window.removeEventListener("resize", size);
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

    const draw = (idx: number) => {
      const cv = canvasRef.current;
      const img = framesRef.current[idx];
      if (!cv || !img) return;
      const ctx = cv.getContext("2d");
      if (!ctx) return;
      const cw = cv.width;
      const ch = cv.height;
      const iw = img.naturalWidth || 1;
      const ih = img.naturalHeight || 1;
      const sc = Math.max(cw / iw, ch / ih);
      const dw = iw * sc;
      const dh = ih * sc;
      ctx.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
      drawnFrameRef.current = idx;
      if (!canvasOnRef.current) {
        canvasOnRef.current = true;
        cv.style.opacity = "1";
      }
    };

    const tick = (now: number) => {
      const rm = cmGetReduced();
      const sf = cmSceneFloat();
      const raw = cmRawFloat();

      /* Hero-Scrub: Auto → Wallbox innerhalb des Hero-Bands */
      if (!rm && raw < 1.6 && framesRef.current.length) {
        const t = Math.min(1, Math.max(0, raw) / HERO_SCRUB_END);
        const target = Math.min(
          CM_HERO_FRAMES.count - 1,
          Math.round(t * (CM_HERO_FRAMES.count - 1))
        );
        if (target !== drawnFrameRef.current) {
          let pick = -1;
          for (let k = target; k >= 0; k--) {
            if (framesRef.current[k]) {
              pick = k;
              break;
            }
          }
          if (pick >= 0 && pick !== drawnFrameRef.current) draw(pick);
        }
      }

      /* Medien-Ebenen: Deckkraft aus Szenennähe × (1 − dim) */
      for (const key of MEDIA_KEYS) {
        const el = layerRefs.current[key];
        if (!el) continue;

        let op = 0;
        let nearest = 99;
        for (const use of USAGE[key]) {
          let d = sf - use.index;
          // Hero-Ebene bleibt vor Szene 0 voll (kein Fade beim Laden).
          if (use.index === 0 && d < 0) d = 0;
          // Letzte Szene bleibt bis zum Seitenende voll.
          if (use.index === CM_SCENES.length - 1 && d > 0) d = 0;
          const ad = Math.abs(d);
          const w = 1 - smoother((ad - 0.04) / FADE_HALF);
          op = Math.max(op, w * (1 - use.dim));
          nearest = Math.min(nearest, ad);
        }

        el.style.opacity = op.toFixed(3);
        el.style.visibility = op < 0.012 ? "hidden" : "visible";

        // ruhiger Ken-Burns-Push relativ zur nächstgelegenen Nutzung
        const heroCanvasLive = key === "hero" && canvasOnRef.current && !rm;
        const breathe =
          rm || heroCanvasLive
            ? 0
            : 0.01 * (0.5 + 0.5 * Math.sin(now / 4600 + MEDIA_KEYS.indexOf(key)));
        const scale = heroCanvasLive
          ? 1
          : HOLD_SCALE + Math.min(1.4, nearest) * TRAVEL_SCALE + breathe;
        el.style.transform = `scale(${scale.toFixed(4)})`;

        /* Clip-Lifecycle */
        const vid = videoRefs.current[key];
        const src = CM_VIDEO[key];
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
    const stop = cmFrameLoop(tick);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onHide);
    };
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden bg-navy-900">
      {MEDIA_KEYS.map((key) => (
        <div
          key={key}
          ref={(el) => {
            layerRefs.current[key] = el;
          }}
          className="absolute inset-0 will-change-[transform,opacity]"
          style={{
            opacity: key === "hero" ? 1 : 0,
            visibility: key === "hero" ? "visible" : "hidden",
          }}
          aria-hidden={key !== "hero"}
        >
          <Image
            src={CM_IMAGE[key]}
            alt={
              key === "hero"
                ? "Elektroauto an einer Wallbox vor einem Mehrfamilienhaus bei Nacht"
                : ""
            }
            fill
            priority={key === "hero"}
            loading={key === "hero" ? undefined : "lazy"}
            sizes="100vw"
            unoptimized
            className="object-cover"
            draggable={false}
          />

          {CM_VIDEO[key] && (
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

          {key === "hero" && (
            <canvas
              ref={canvasRef}
              aria-hidden
              className="absolute inset-0 h-full w-full transition-opacity duration-500 will-change-[opacity]"
              style={{ opacity: 0 }}
            />
          )}
        </div>
      ))}

      {/* Grade: Tiefen-Wash + weiche Vignette */}
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

      {/* feines Filmkorn */}
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
