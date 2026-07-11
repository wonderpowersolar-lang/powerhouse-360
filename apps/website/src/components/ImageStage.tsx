"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { SECTIONS } from "@/content/sections";
import {
  getSectionFloat,
  holdWeight,
  NUM_SECTIONS,
} from "@/lib/scrollProgress";
import {
  getBlendTarget,
  getFocusBlend,
  getFocusSectionIndex,
  setFocusBlend,
} from "@/lib/focusStore";
import {
  STATION_IMAGE,
  STATION_FOCAL,
} from "@/config/stage";

/**
 * ImageStage — the photoreal cinematic stage that REPLACES the R3F canvas.
 *
 * A fixed, full-viewport stack of one <Image> layer per station. Behind the
 * scrolling copy, exactly where DesktopExperience used to mount <BuildingScene>.
 * It is NOT a slideshow: every frame we read the SAME scroll mapping the camera
 * used (getSectionFloat / holdWeight) and drive, per layer, only GPU properties
 * (opacity + transform). No React state per frame, no layout thrash, no CLS.
 *
 * ── The cinematic model (mirrors the 5-beat motion system) ───────────────────
 * `getSectionFloat()` returns the plateaued section float [0..LAST]: it PINS to
 * the integer through each station's Hold/Explain beat and only travels during
 * the Approach/Transition beats (scrollProgress.ts). We use it two ways:
 *
 *   • CROSSFADE — a layer i is opaque when sectionFloat ≈ i and fades out as the
 *     float moves to i±1, so the OUTGOING image dissolves into the INCOMING one
 *     across the band boundary (the travel beats), and is rock-steady during the
 *     hold. Adjacent layers overlap, so it is a true crossfade, never a cut.
 *
 *   • KEN-BURNS — each layer carries a continuous slow zoom toward its focal
 *     point that is a function of (sectionFloat − i): the image pushes IN as we
 *     approach the station and keeps a hair of drift through the hold, then
 *     pushes past as we leave. Because the float plateaus on the hold, the zoom
 *     velocity collapses to ~1%/band there — still during reading, moving during
 *     travel. This reads as one continuous camera move across the whole journey.
 *
 * A soft depth vignette + a faint film grain on top grade the stack so it feels
 * shot/colour-graded, not flat. No bloom.
 *
 * ── Explorer fly-in (image crossfade-zoom) ──────────────────────────────────
 * In R3F the CameraRig owned the focusBlend easing; in image mode it is gone, so
 * THIS component eases `focusBlend` toward `getBlendTarget()` every frame with
 * the same wall-clock ~1.2s exponential approach. When focused we raise the
 * focused station's image as an overlay layer and zoom it from the hero framing
 * INTO its focal point as blend 0→1 (and back out on clear) — the deliberate
 * crossfade-zoom fly-in. HotspotPins/FocusOverlay read focusBlend exactly as
 * before, so the rest of the explorer chain is unchanged.
 */

/** Base zoom each layer sits at when its station is centred (held). */
const HOLD_SCALE = 1.06;
/** Extra zoom travelled across one band of approach/exit (the push-in depth). */
const TRAVEL_SCALE = 0.1;
/** Max parallax translate (in % of viewport) applied across a band. */
const TRAVEL_PAN = 1.6;
/** How far (in band units) a neighbour image stays partly visible — the
 *  crossfade half-width. 0.5 → layers i and i+1 cross at the band midpoint. */
const FADE_HALF = 0.62;
/** Focus crossfade-zoom: how much deeper the focused image pushes vs its hold. */
const FOCUS_ZOOM = 0.14;

/** Smootherstep for buttery opacity ramps. */
function smoother(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return x * x * x * (x * (x * 6 - 15) + 10);
}

interface Layer {
  id: string;
  index: number;
  src: string;
  alt: string;
  focal: { x: number; y: number };
  /** priority-load the hero + first product station; lazy the rest. */
  priority: boolean;
}

export default function ImageStage({ onReady }: { onReady?: () => void }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const layerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const focusLayerRef = useRef<HTMLDivElement>(null);
  const grainRef = useRef<HTMLDivElement>(null);
  const introRef = useRef<{ t: number; done: boolean }>({ t: 0, done: false });
  const readyFired = useRef(false);
  /** prefers-reduced-motion: damps AUTONOMOUS motion only (breathing, grain,
   *  hero auto push-in). The scroll-coupled crossfade + zoom stay on — that is
   *  user-driven motion and the whole point of the journey. */
  const reducedRef = useRef(false);

  const layers: Layer[] = SECTIONS.map((s) => ({
    id: s.id,
    index: s.index,
    src: s.image ?? STATION_IMAGE[s.id] ?? STATION_IMAGE.hero,
    alt: `${s.kicker} — ${s.headline}`,
    focal: STATION_FOCAL[s.id] ?? { x: 0.5, y: 0.5 },
    priority: s.index <= 1, // hero + powermieter eager; rest lazy
  }));

  // Signal ready once the hero image has decoded (so the loader lifts on the
  // real asset, not a blank frame). Falls back to the DesktopExperience 2.5s cap.
  useEffect(() => {
    let cancelled = false;
    const heroSrc = layers[0]?.src;
    if (!heroSrc) return;
    const img = new window.Image();
    img.onload = () => {
      if (!cancelled && !readyFired.current) {
        readyFired.current = true;
        onReady?.();
      }
    };
    img.onerror = () => {
      if (!cancelled && !readyFired.current) {
        readyFired.current = true;
        onReady?.();
      }
    };
    img.src = heroSrc;
    if (img.complete && !readyFired.current) {
      readyFired.current = true;
      onReady?.();
    }
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The per-frame cinematic driver. One rAF loop; writes only opacity/transform.
  useEffect(() => {
    let raf = 0;
    let last = performance.now();

    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    reducedRef.current = mq?.matches ?? false;
    const onRM = () => {
      reducedRef.current = mq?.matches ?? false;
    };
    mq?.addEventListener?.("change", onRM);

    const tick = (now: number) => {
      const delta = Math.min(0.05, (now - last) / 1000);
      last = now;

      // ── ease the focus blend (CameraRig used to own this) ──────────────────
      const target = getBlendTarget();
      let blend = getFocusBlend();
      if (Math.abs(target - blend) > 0.0008) {
        const kb = 1 - Math.pow(0.06, delta); // ~94%/s — wall-clock ~1.2s
        blend += (target - blend) * kb;
        if (Math.abs(target - blend) < 0.0015) blend = target;
        setFocusBlend(blend);
      } else if (blend !== target) {
        blend = target;
        setFocusBlend(blend);
      }

      const rm = reducedRef.current;

      // ── hero push-in at load (a slow scale-in on the hero layer) ───────────
      const intro = introRef.current;
      if (rm) {
        // reduced-motion: skip the autonomous load push-in, start settled.
        intro.t = 1;
        intro.done = true;
      } else if (!intro.done) {
        intro.t = Math.min(1, intro.t + delta / 2.4); // ~2.4s push-in
        if (intro.t >= 1) intro.done = true;
      }
      // 0..1, eased — 1 = settled at hold framing, 0 = pushed back at load.
      const introEase = smoother(intro.t);

      const sf = getSectionFloat();

      // ── per-station layers ────────────────────────────────────────────────
      for (let i = 0; i < layers.length; i++) {
        const el = layerRefs.current[i];
        if (!el) continue;
        const d = sf - i; // band-relative position (−=before, +=after)
        const ad = Math.abs(d);

        // Crossfade opacity: full at d≈0, gone past the crossfade half-width.
        // The very first/last layers hold opacity past the edge so there is no
        // dark gap at the extremes of the scroll.
        let op = 1 - smoother((ad - 0.04) / FADE_HALF);
        if (i === 0 && d < 0) op = 1; // above hero → keep hero
        if (i === NUM_SECTIONS - 1 && d > 0) op = 1; // below finale → keep finale

        // Ken-Burns: zoom toward focal point. Base hold zoom + a travel term so
        // the image keeps pushing as we cross the band. Because sectionFloat
        // PLATEAUS on the hold (ad→0 there), the travel zoom velocity collapses
        // to ~0 during reading; during Approach/Transition (ad grows) it pushes.
        // On top, a very slow breathing drift (~1%) keeps the still from looking
        // frozen — gated by holdWeight so it ONLY happens once the station is
        // settled (never competes with the travel push).
        const hw = holdWeight(i); // 1 = settled/reading, 0 = travelling
        const breathe = rm ? 0 : hw * 0.012 * (0.5 + 0.5 * Math.sin(now / 4200 + i));
        let scale = HOLD_SCALE + ad * TRAVEL_SCALE + breathe;
        // Hero gets the load push-in: starts further back, settles to HOLD_SCALE.
        if (i === 0) {
          const heroBack = (1 - introEase) * 0.07;
          scale = HOLD_SCALE + ad * TRAVEL_SCALE + heroBack + breathe;
        }

        // Pan toward focal point as we travel (parallax). At d=0 → centred on
        // focal; magnitude grows with |d| so the move reads as a camera dolly.
        const fx = (layers[i].focal.x - 0.5) * 2; // −1..1
        const fy = (layers[i].focal.y - 0.5) * 2;
        const panMag = Math.min(1, ad / FADE_HALF) * TRAVEL_PAN;
        // travel direction: approaching (d<0) pans from off-focal toward focal,
        // leaving (d>0) continues past — both expressed as a small signed offset.
        const dir = d < 0 ? 1 : -1;
        const tx = fx * panMag * dir * -1; // move scene so focal drifts to centre
        const ty = fy * panMag * dir * -1;

        el.style.opacity = op.toFixed(3);
        el.style.visibility = op < 0.012 ? "hidden" : "visible";
        // transform-origin set on the element (focal point) so scale zooms there
        el.style.transform = `translate3d(${tx.toFixed(3)}%, ${ty.toFixed(
          3
        )}%, 0) scale(${scale.toFixed(4)})`;
      }

      // ── focus overlay (explorer crossfade-zoom) ────────────────────────────
      const fl = focusLayerRef.current;
      if (fl) {
        // Which station are we focused on (or flying out of)?
        const fi = getFocusSectionIndex();
        const showBlend = blend;
        if (showBlend > 0.001 && fi >= 0) {
          const child = fl.querySelector<HTMLElement>("[data-focus-img]");
          const want = layers[fi]?.src;
          if (child && want && child.dataset.src !== want) {
            child.dataset.src = want;
            (child as HTMLElement).style.backgroundImage = `url("${want}")`;
            const f = layers[fi].focal;
            child.style.backgroundPosition = `${(f.x * 100).toFixed(1)}% ${(
              f.y * 100
            ).toFixed(1)}%`;
          }
          // zoom IN as blend 0→1: starts at hero-ish framing, pushes to focal.
          const z = HOLD_SCALE + showBlend * FOCUS_ZOOM;
          fl.style.opacity = smoother(showBlend).toFixed(3);
          fl.style.visibility = "visible";
          if (child) {
            child.style.transform = `scale(${z.toFixed(4)})`;
          }
        } else {
          fl.style.opacity = "0";
          fl.style.visibility = "hidden";
        }
      }

      // ── film grain drift (very subtle, keeps the still from looking flat) ──
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
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={rootRef} className="absolute inset-0 overflow-hidden bg-navy-900">
      {/* ── station image layers ── */}
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
          <Image
            src={l.src}
            alt={i === 0 ? l.alt : ""}
            fill
            priority={l.priority}
            loading={l.priority ? undefined : "lazy"}
            sizes="100vw"
            quality={88}
            className="object-cover"
            style={{
              objectPosition: `${(l.focal.x * 100).toFixed(1)}% ${(
                l.focal.y * 100
              ).toFixed(1)}%`,
            }}
            draggable={false}
          />
        </div>
      ))}

      {/* ── focus crossfade-zoom layer (explorer fly-in) ── */}
      <div
        ref={focusLayerRef}
        className="absolute inset-0 will-change-[transform,opacity]"
        style={{ opacity: 0, visibility: "hidden" }}
        aria-hidden
      >
        <div
          data-focus-img
          className="absolute inset-0 bg-cover will-change-transform"
          style={{ backgroundPosition: "50% 50%" }}
        />
      </div>

      {/* ── grade: cool depth wash + soft vignette (premium, no neon) ── */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(9,15,26,0.28) 0%, rgba(9,15,26,0) 28%, rgba(9,15,26,0) 70%, rgba(9,15,26,0.42) 100%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(125% 100% at 50% 44%, transparent 52%, rgba(9,15,26,0.5) 100%)",
        }}
      />

      {/* ── faint film grain (drifts a couple px so the still feels shot) ── */}
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
