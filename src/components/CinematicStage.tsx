"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { SECTIONS } from "@/content/sections";
import {
  getSectionFloat,
  getSectionRawFloat,
  holdWeight,
  NUM_SECTIONS,
} from "@/lib/scrollProgress";
import {
  STATION_IMAGE,
  STATION_VIDEO,
  STATION_FOCAL,
  HERO_FRAMES,
  heroFramePath,
} from "@/config/stage";

/**
 * CinematicStage — the launch-grade visual layer behind the scrolling copy.
 *
 * A fixed, full-viewport stack of one layer per station:
 *
 *   • STATION 0 (hero) — the scroll-scrubbed 360° ORBIT. A <canvas> draws a
 *     WebP frame sequence (extracted from the Higgsfield orbit clip); the
 *     frame index follows the RAW scroll fraction through the hero band, so
 *     the building visibly rotates under the visitor's finger. A priority
 *     <Image> poster sits underneath until the first frame has decoded (and
 *     remains the reduced-motion / save-data fallback).
 *
 *   • STATIONS 1..N — a still poster with the station's cinematic clip
 *     layered on top. Clips are lazy: `src` is only assigned when the
 *     journey approaches the station, playback runs only while the station
 *     is on stage, and the video fades in over its poster once decodable.
 *
 * Crossfade + Ken-Burns follow the SAME plateaued section-float the whole
 * journey uses (scrollProgress.ts): layers dissolve into each other across
 * band boundaries and rest during each station's hold. One rAF loop; only
 * GPU properties (opacity/transform) are written per frame.
 *
 * prefers-reduced-motion: the frame sequence and all clips are disabled —
 * the journey falls back to the still-image crossfade (user-driven), with
 * no autonomous motion (no breathing, no grain drift, no auto push-in).
 */

/** Base zoom each layer sits at when its station is centred (held). */
const HOLD_SCALE = 1.05;
/** Extra zoom travelled across one band of approach/exit. */
const TRAVEL_SCALE = 0.09;
/** Max parallax translate (in % of viewport) applied across a band. */
const TRAVEL_PAN = 1.4;
/** Crossfade half-width in band units. */
const FADE_HALF = 0.62;
/** The orbit completes at this fraction of the hero band, then rests. */
const HERO_SCRUB_END = 0.88;
/** Stations closer than this (in bands) get their clip src assigned. */
const VIDEO_WARM = 1.45;
/** Stations closer than this actually play. */
const VIDEO_PLAY = 0.85;

function smoother(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return x * x * x * (x * (x * 6 - 15) + 10);
}

interface Layer {
  id: string;
  index: number;
  still: string;
  video?: string;
  alt: string;
  focal: { x: number; y: number };
  priority: boolean;
}

export default function CinematicStage({ onReady }: { onReady?: () => void }) {
  const layerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const grainRef = useRef<HTMLDivElement>(null);
  const readyFired = useRef(false);
  const reducedRef = useRef(false);
  /** decoded orbit frames (index 0 = frame_001) */
  const framesRef = useRef<(HTMLImageElement | null)[]>([]);
  const drawnFrameRef = useRef(-1);
  const canvasOnRef = useRef(false);

  const layers: Layer[] = SECTIONS.map((s) => ({
    id: s.id,
    index: s.index,
    still: s.image ?? STATION_IMAGE[s.id] ?? STATION_IMAGE.hero,
    video: s.index === 0 ? undefined : STATION_VIDEO[s.id],
    alt: s.index === 0 ? `${s.headline} — ${s.subline}` : "",
    focal: STATION_FOCAL[s.id] ?? { x: 0.5, y: 0.5 },
    priority: s.index <= 1,
  }));

  /* ── ready signal: fire once the hero poster has decoded ─────────────── */
  useEffect(() => {
    let cancelled = false;
    const heroSrc = layers[0]?.still;
    if (!heroSrc) return;
    const img = new window.Image();
    const fire = () => {
      if (!cancelled && !readyFired.current) {
        readyFired.current = true;
        onReady?.();
      }
    };
    img.onload = fire;
    img.onerror = fire;
    img.src = heroSrc;
    if (img.complete) fire();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── orbit frame streaming (skipped for reduced-motion / save-data) ────
     StrictMode-safe: the effect is fully restartable — an aborted first run
     leaves its decoded frames in framesRef and the rerun skips them. */
  useEffect(() => {
    const rm = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const conn = (
      navigator as Navigator & { connection?: { saveData?: boolean } }
    ).connection;
    if (rm || conn?.saveData) return;

    const N = HERO_FRAMES.count;
    if (framesRef.current.length !== N)
      framesRef.current = new Array(N).fill(null);
    let disposed = false;
    let next = 0;
    let inFlight = 0;
    const CONCURRENCY = 6;

    const pump = () => {
      while (!disposed && inFlight < CONCURRENCY && next < N) {
        const idx = next++;
        if (framesRef.current[idx]) continue; // already decoded
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
        img.src = heroFramePath(idx + 1);
      }
    };
    pump();
    return () => {
      disposed = true;
    };
  }, []);

  /* ── canvas sizing (DPR-capped) ──────────────────────────────────────── */
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const size = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      cv.width = Math.round(window.innerWidth * dpr);
      cv.height = Math.round(window.innerHeight * dpr);
      drawnFrameRef.current = -1; // force redraw at new size
    };
    size();
    window.addEventListener("resize", size);
    return () => window.removeEventListener("resize", size);
  }, []);

  /* ── the per-frame cinematic driver ──────────────────────────────────── */
  useEffect(() => {
    let raf = 0;
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    reducedRef.current = mq?.matches ?? false;
    const onRM = () => {
      reducedRef.current = mq?.matches ?? false;
    };
    mq?.addEventListener?.("change", onRM);

    const onHide = () => {
      if (document.hidden)
        videoRefs.current.forEach((v) => v && !v.paused && v.pause());
    };
    document.addEventListener("visibilitychange", onHide);

    /** cover-fit draw of orbit frame `idx` (0-based) onto the canvas */
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
      const s = Math.max(cw / iw, ch / ih);
      const dw = iw * s;
      const dh = ih * s;
      ctx.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
      drawnFrameRef.current = idx;
      if (!canvasOnRef.current) {
        canvasOnRef.current = true;
        cv.style.opacity = "1";
      }
    };

    const tick = (now: number) => {
      const rm = reducedRef.current;
      const sf = getSectionFloat();
      const raw = getSectionRawFloat();

      /* ── hero orbit scrub ── */
      if (!rm && raw < 1.6 && framesRef.current.length) {
        const t = Math.min(1, Math.max(0, raw) / HERO_SCRUB_END);
        const target = Math.min(
          HERO_FRAMES.count - 1,
          Math.round(t * (HERO_FRAMES.count - 1))
        );
        if (target !== drawnFrameRef.current) {
          // nearest DECODED frame at or below the target (streaming gap mask)
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

      /* ── station layers: crossfade + Ken-Burns + clip control ── */
      for (let i = 0; i < layers.length; i++) {
        const el = layerRefs.current[i];
        if (!el) continue;
        const d = sf - i;
        const ad = Math.abs(d);

        let op = 1 - smoother((ad - 0.04) / FADE_HALF);
        if (i === 0 && d < 0) op = 1;
        if (i === NUM_SECTIONS - 1 && d > 0) op = 1;

        // Ken-Burns push toward the focal point. The hero layer is exempt
        // while the canvas orbit is live (the orbit IS the motion).
        const heroCanvasLive = i === 0 && canvasOnRef.current && !rm;
        const hw = holdWeight(i);
        const breathe =
          rm || heroCanvasLive
            ? 0
            : hw * 0.011 * (0.5 + 0.5 * Math.sin(now / 4200 + i));
        const scale = heroCanvasLive
          ? 1
          : HOLD_SCALE + ad * TRAVEL_SCALE + breathe;

        const fx = (layers[i].focal.x - 0.5) * 2;
        const fy = (layers[i].focal.y - 0.5) * 2;
        const panMag = heroCanvasLive
          ? 0
          : Math.min(1, ad / FADE_HALF) * TRAVEL_PAN;
        const dir = d < 0 ? 1 : -1;
        const tx = fx * panMag * dir * -1;
        const ty = fy * panMag * dir * -1;

        el.style.opacity = op.toFixed(3);
        el.style.visibility = op < 0.012 ? "hidden" : "visible";
        el.style.transform = `translate3d(${tx.toFixed(3)}%, ${ty.toFixed(
          3
        )}%, 0) scale(${scale.toFixed(4)})`;

        /* clip lifecycle */
        const vid = videoRefs.current[i];
        if (vid && layers[i].video) {
          const warm = !rm && ad < VIDEO_WARM;
          if (warm && !vid.getAttribute("src")) {
            vid.setAttribute("src", layers[i].video!);
            vid.load();
          }
          const wantPlay =
            !rm && ad < VIDEO_PLAY && !document.hidden && op > 0.05;
          if (wantPlay && vid.paused && vid.getAttribute("src")) {
            vid.playbackRate = 0.85;
            vid.play().catch(() => {});
          } else if (!wantPlay && !vid.paused) {
            vid.pause();
          }
          vid.style.opacity = vid.readyState >= 3 ? "1" : "0";
        }
      }

      /* ── grain drift ── */
      if (grainRef.current && !rm) {
        const gx = (Math.sin(now / 1700) * 2).toFixed(1);
        const gy = (Math.cos(now / 2300) * 2).toFixed(1);
        grainRef.current.style.transform = `translate3d(${gx}px, ${gy}px, 0)`;
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      mq?.removeEventListener?.("change", onRM);
      document.removeEventListener("visibilitychange", onHide);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden bg-navy-900">
      {layers.map((l, i) => (
        <div
          key={l.id}
          ref={(el) => {
            layerRefs.current[i] = el;
          }}
          className="absolute inset-0 will-change-[transform,opacity]"
          style={{
            transformOrigin: `${(l.focal.x * 100).toFixed(1)}% ${(
              l.focal.y * 100
            ).toFixed(1)}%`,
            opacity: i === 0 ? 1 : 0,
            visibility: i === 0 ? "visible" : "hidden",
          }}
          aria-hidden={i !== 0}
        >
          {/* still poster — always present (LCP, fallback, video underlay) */}
          <Image
            src={l.still}
            alt={i === 0 ? l.alt : ""}
            fill
            priority={l.priority}
            loading={l.priority ? undefined : "lazy"}
            sizes="100vw"
            unoptimized
            className="object-cover"
            style={{
              objectPosition: `${(l.focal.x * 100).toFixed(1)}% ${(
                l.focal.y * 100
              ).toFixed(1)}%`,
            }}
            draggable={false}
          />

          {/* cinematic clip (lazy src, plays only on stage) */}
          {l.video && (
            <video
              ref={(el) => {
                videoRefs.current[i] = el;
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

          {/* hero orbit canvas (over the hero poster; fades in on first draw) */}
          {i === 0 && (
            <canvas
              ref={canvasRef}
              aria-hidden
              className="absolute inset-0 h-full w-full transition-opacity duration-500 will-change-[opacity]"
              style={{ opacity: 0 }}
            />
          )}
        </div>
      ))}

      {/* ── grade: depth wash + soft vignette (premium, no neon) ── */}
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

      {/* ── faint film grain ── */}
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
