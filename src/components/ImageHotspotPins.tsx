"use client";

import { useEffect, useRef } from "react";
import { setFocus, getFocusBlend, useFocusId, getHotspot } from "@/lib/focusStore";
import { getSectionFloat } from "@/lib/scrollProgress";
import { IMAGE_HOTSPOTS, HERO_IMAGE } from "@/config/stage";

/**
 * ImageHotspotPins — the explorer pins for the IMAGE stage.
 *
 * The R3F pins (HotspotPins) project 3D anchors to screen space via the Canvas
 * camera. The image stage has no camera, so these pins are anchored to FIXED
 * NORMALISED points on the hero overview image (config: IMAGE_HOTSPOTS) and
 * mapped onto the rendered image rect every frame. Because the hero layer uses
 * `object-cover`, we replicate the cover transform here (scale to cover, centre
 * on the focal objectPosition) so a pin sits exactly on its building feature and
 * tracks the slow hero push-in.
 *
 * Visibility mirrors the R3F behaviour: the layer is only shown when the hero is
 * framed whole (the hero band, sectionFloat ≈ 0) and is suppressed while a module
 * is focused (FocusOverlay owns the stage then). The pins are deliberately MORE
 * legible than the 3D version (bigger dot, always-readable chip, stronger ring)
 * per the client note that they were too subtle. Real <button>s → keyboard +
 * touch accessible.
 *
 * One rAF loop writes transform/opacity directly (no per-frame React state);
 * re-renders only when focusId flips.
 */

const ACCENT: Record<string, string> = {
  green: "#43b649",
  teal: "#2bb6b0",
  aqua: "#80cec1",
  amber: "#ec7b13",
  blue: "#5b9bd5",
};

/** Hero image intrinsic size (00-hero-overview.jpg) for the cover mapping. */
const IMG_W = 1920;
const IMG_H = 1071;
/** Hero objectPosition focal (matches STATION_FOCAL.hero / ImageStage). */
const FOCAL = { x: 0.5, y: 0.46 };

/**
 * Map a normalised image point (0..1) to viewport px under `object-cover`.
 * Returns null off-screen. The hero layer covers the full viewport, so we scale
 * the image to cover [vw,vh], align by the focal objectPosition, then place the
 * normalised point inside that displayed rect.
 */
function mapCover(nx: number, ny: number, vw: number, vh: number) {
  const scale = Math.max(vw / IMG_W, vh / IMG_H);
  const dispW = IMG_W * scale;
  const dispH = IMG_H * scale;
  // objectPosition focal: the focal point of the image aligns to the same
  // fractional point of the viewport.
  const left = FOCAL.x * vw - FOCAL.x * dispW;
  const top = FOCAL.y * vh - FOCAL.y * dispH;
  const x = left + nx * dispW;
  const y = top + ny * dispH;
  const onScreen = x > -40 && x < vw + 40 && y > -40 && y < vh + 40;
  return { x, y, onScreen };
}

/** Overview amount for the image stage: 1 on the hero band, fading to 0 by the
 *  time we reach the first product station (pins would clutter the interiors). */
function overviewAmount(sf: number): number {
  // hero band: sf in [0, ~0.85] shows; fade out toward station 1.
  if (sf <= 0.15) return 1;
  if (sf >= 0.85) return 0;
  return 1 - (sf - 0.15) / 0.7;
}

export default function ImageHotspotPins() {
  const focusId = useFocusId();
  const layerRef = useRef<HTMLDivElement>(null);
  const pinRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const layer = layerRef.current;
      if (layer) {
        const blend = getFocusBlend();
        const sf = getSectionFloat();
        const layerOpacity =
          overviewAmount(sf) * (1 - Math.min(1, blend * 1.6));
        layer.style.opacity = layerOpacity.toFixed(3);
        const visible = layerOpacity > 0.02;
        layer.style.visibility = visible ? "visible" : "hidden";

        const vw = window.innerWidth;
        const vh = window.innerHeight;
        for (let i = 0; i < IMAGE_HOTSPOTS.length; i++) {
          const el = pinRefs.current[i];
          if (!el) continue;
          const a = IMAGE_HOTSPOTS[i];
          const p = mapCover(a.x, a.y, vw, vh);
          if (!p.onScreen) {
            el.style.opacity = "0";
            el.style.pointerEvents = "none";
            continue;
          }
          el.style.transform = `translate3d(${p.x.toFixed(1)}px, ${p.y.toFixed(
            1
          )}px, 0) translate(-50%, -50%)`;
          const clickable = layerOpacity > 0.5 && blend < 0.04;
          el.style.opacity = "1";
          el.style.pointerEvents = clickable ? "auto" : "none";
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      ref={layerRef}
      aria-hidden={focusId !== null}
      className="pointer-events-none fixed inset-0 z-20 hidden lg:block"
      style={{ opacity: 0, visibility: "hidden" }}
    >
      {/* Preload the hero so the cover math has the asset ready (cheap). */}
      <link rel="preload" as="image" href={HERO_IMAGE} />
      {IMAGE_HOTSPOTS.map((a, i) => {
        const h = getHotspot(a.id);
        if (!h) return null;
        const color = ACCENT[h.accent] ?? "#2bb6b0";
        const chipRight = a.side === "right";
        return (
          <button
            key={a.id}
            type="button"
            ref={(el) => {
              pinRefs.current[i] = el;
            }}
            data-hotspot={a.id}
            onClick={() => setFocus(a.id)}
            aria-label={`Zur Produktwelt ${h.number} ${h.name} – ${h.zone}`}
            className="image-hotspot group absolute left-0 top-0 will-change-transform"
            style={{ opacity: 0 }}
          >
            {/* dot + double pulse ring — bigger + brighter than the 3D pins */}
            <span className="relative grid h-4 w-4 place-items-center">
              <span
                className="image-hotspot-ring absolute inset-0 rounded-full"
                style={{ border: `2px solid ${color}` }}
              />
              <span
                className="block h-3 w-3 rounded-full transition-transform duration-300 group-hover:scale-[1.4] group-focus-visible:scale-[1.4]"
                style={{
                  background: color,
                  boxShadow: `0 0 0 4px ${color}33, 0 0 14px ${color}, 0 0 3px ${color}`,
                }}
              />
            </span>

            {/* label chip — readable by default (not faded), grows on hover */}
            <span
              className={`absolute top-1/2 flex -translate-y-1/2 items-center gap-2 whitespace-nowrap rounded-full border border-white/15 bg-navy-900/80 py-1 pl-2 pr-3 opacity-100 backdrop-blur-md transition-all duration-300 group-hover:scale-[1.05] group-hover:border-white/35 group-hover:bg-navy-900/95 group-focus-visible:scale-[1.05] group-focus-visible:border-white/35 ${
                chipRight ? "left-6 origin-left" : "right-6 origin-right"
              }`}
              style={{ boxShadow: "0 12px 34px -14px rgba(0,0,0,0.9)" }}
            >
              <span
                className="text-[12px] font-bold tabular-nums leading-none"
                style={{ color }}
              >
                {h.number}
              </span>
              <span className="flex flex-col items-start leading-tight">
                <span className="text-[12.5px] font-semibold leading-none text-ink">
                  {h.name}
                </span>
                <span className="mt-0.5 text-[9px] font-medium uppercase leading-none tracking-[0.14em] text-ink-faint">
                  {h.zone}
                </span>
              </span>
            </span>
          </button>
        );
      })}

      <style jsx>{`
        .image-hotspot-ring {
          animation: image-pin-pulse 2.6s var(--ease-calm) infinite;
        }
        @keyframes image-pin-pulse {
          0% {
            transform: scale(1);
            opacity: 0.9;
          }
          70% {
            transform: scale(2.4);
            opacity: 0;
          }
          100% {
            transform: scale(2.4);
            opacity: 0;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .image-hotspot-ring {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
