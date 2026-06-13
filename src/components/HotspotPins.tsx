"use client";

import { useEffect, useRef } from "react";
import { HOTSPOTS, setFocus, getFocusBlend, useFocusId } from "@/lib/focusStore";
import { getProjection, getOverviewAmount } from "@/lib/hotspotProjection";

/**
 * HotspotPins — the DOM layer of labelled explorer pins (NRG "click a zone").
 *
 * One pin per HOTSPOTS entry: a glowing accent dot + a soft pulsing ring + a
 * label chip (number · name · zone) in dark glass. The pins are anchored to the
 * real 3D module positions: <HotspotProjector> (inside the Canvas) writes each
 * pin's live screen x/y into the projection bridge, and here we read it every
 * frame and write `transform` straight onto the pin elements — NO per-frame
 * React state, so this stays cheap even though it tracks a moving camera.
 *
 * Visibility: the whole layer fades with the "overview amount" (1 on the hero /
 * finale bands, 0 mid-journey) so pins only appear when the building is framed
 * whole, and it is suppressed while a module is focused (the FocusOverlay owns
 * the stage then). Pins are real <button>s → keyboard-focusable and tappable;
 * on touch the hit area is enlarged.
 *
 * Re-renders only when the discrete focusId changes (useFocusId), to flip the
 * layer's pointer-events / aria state.
 */

const ACCENT: Record<string, string> = {
  green: "#43b649",
  teal: "#2bb6b0",
  aqua: "#80cec1",
  amber: "#ec7b13",
  blue: "#5b9bd5",
};

export default function HotspotPins() {
  const focusId = useFocusId();
  const layerRef = useRef<HTMLDivElement>(null);
  const pinRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Per-frame: position each pin from the projection bridge + fade by overview.
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const layer = layerRef.current;
      if (layer) {
        const blend = getFocusBlend();
        // Hide the layer entirely once we're meaningfully flying in/parked.
        const overview = getOverviewAmount();
        const layerOpacity = overview * (1 - Math.min(1, blend * 1.6));
        layer.style.opacity = layerOpacity.toFixed(3);
        // The layer is always pointer-transparent; clickability is granted
        // per-pin below so the gaps between chips pass through to the scene/DOM.
        const visible = layerOpacity > 0.02;
        layer.style.visibility = visible ? "visible" : "hidden";

        for (let i = 0; i < HOTSPOTS.length; i++) {
          const el = pinRefs.current[i];
          if (!el) continue;
          const p = getProjection(i);
          if (!p || !p.onScreen) {
            el.style.opacity = "0";
            el.style.pointerEvents = "none";
            continue;
          }
          el.style.transform = `translate3d(${p.x.toFixed(1)}px, ${p.y.toFixed(
            1
          )}px, 0) translate(-50%, -50%) scale(${p.scale.toFixed(3)})`;
          // Individual pins clickable only when the layer is clearly shown and
          // we're on the overview (not mid fly-in).
          const clickable = layerOpacity > 0.55 && blend < 0.04;
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
      {HOTSPOTS.map((h, i) => {
        const color = ACCENT[h.accent] ?? "#2bb6b0";
        // Chip flows toward the OUTSIDE of the building (left-of-centre anchors
        // → chip left, right-of-centre → chip right), so chips fan apart from
        // the facade instead of stacking on top of one another.
        const chipRight = h.anchor[0] >= 0;
        return (
          <button
            key={h.id}
            type="button"
            ref={(el) => {
              pinRefs.current[i] = el;
            }}
            data-hotspot={h.id}
            onClick={() => setFocus(h.id)}
            aria-label={`Zur Produktwelt ${h.number} ${h.name} – ${h.zone}`}
            className="hotspot-pin group absolute left-0 top-0 will-change-transform"
            style={{ opacity: 0 }}
          >
            {/* dot + pulse ring — the precise anchor point */}
            <span className="relative grid h-3.5 w-3.5 place-items-center">
              <span
                className="hotspot-ring absolute inset-0 rounded-full"
                style={{ border: `1.5px solid ${color}` }}
              />
              <span
                className="block h-2.5 w-2.5 rounded-full transition-transform duration-300 group-hover:scale-[1.35] group-focus-visible:scale-[1.35]"
                style={{
                  background: color,
                  boxShadow: `0 0 10px ${color}, 0 0 2px ${color}`,
                }}
              />
            </span>

            {/* label chip — absolutely placed beside the dot, fanning outward.
                Slightly translucent + small by default; grows + brightens on
                hover/focus so the overview stays calm (not a christmas tree). */}
            <span
              className={`absolute top-1/2 flex -translate-y-1/2 items-center gap-1.5 whitespace-nowrap rounded-full border border-white/10 bg-navy-900/65 py-0.5 pl-1.5 pr-2.5 opacity-85 backdrop-blur-md transition-all duration-300 group-hover:scale-[1.06] group-hover:border-white/25 group-hover:bg-navy-900/90 group-hover:opacity-100 group-focus-visible:scale-[1.06] group-focus-visible:border-white/25 group-focus-visible:opacity-100 ${
                chipRight ? "left-5 origin-left" : "right-5 origin-right"
              }`}
              style={{ boxShadow: "0 10px 30px -14px rgba(0,0,0,0.85)" }}
            >
              <span
                className="text-[11px] font-bold tabular-nums leading-none"
                style={{ color }}
              >
                {h.number}
              </span>
              <span className="flex flex-col items-start leading-tight">
                <span className="text-[11.5px] font-semibold leading-none text-ink">
                  {h.name}
                </span>
                <span className="mt-0.5 text-[8.5px] font-medium uppercase leading-none tracking-[0.14em] text-ink-faint">
                  {h.zone}
                </span>
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
