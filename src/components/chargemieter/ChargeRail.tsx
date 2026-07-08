"use client";

import { useEffect, useState } from "react";
import { CM_SCENES, CM_SCENE_LABELS } from "@/content/chargemieter";
import { cmSceneFloat, cmFrameLoop } from "@/lib/chargeProgress";

/**
 * Kapitel-Leiste am rechten Rand (nur Desktop): 12 Punkte, aktives Kapitel
 * mit Label. Klick springt in die Mitte des Szenen-Holds.
 */
export default function ChargeRail() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    let last = -1;
    return cmFrameLoop(() => {
      const idx = Math.round(cmSceneFloat());
      if (idx !== last) {
        last = idx;
        setActive(idx);
      }
    });
  }, []);

  const jump = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const y =
      window.scrollY + el.getBoundingClientRect().top + el.offsetHeight * 0.45;
    window.scrollTo({ top: y, behavior: "smooth" });
  };

  return (
    <div
      className="pointer-events-none fixed right-5 top-1/2 z-40 hidden -translate-y-1/2 lg:block"
      aria-hidden
    >
      <div className="flex flex-col items-end gap-2.5">
        {CM_SCENES.map((s) => {
          const on = s.index === active;
          return (
            <button
              key={s.id}
              tabIndex={-1}
              onClick={() => jump(s.id)}
              className="pointer-events-auto group flex items-center gap-2.5"
            >
              <span
                className={`text-[10px] font-semibold uppercase tracking-[0.18em] transition-all duration-300 ${
                  on
                    ? "translate-x-0 opacity-100"
                    : "translate-x-1.5 opacity-0 group-hover:translate-x-0 group-hover:opacity-60"
                }`}
                style={{ color: "var(--color-mod-charge)" }}
              >
                {CM_SCENE_LABELS[s.id]}
              </span>
              <span
                className="block rounded-full transition-all duration-300"
                style={{
                  width: on ? 7 : 5,
                  height: on ? 7 : 5,
                  background: on
                    ? "var(--color-mod-charge)"
                    : "rgba(244,240,232,0.25)",
                  boxShadow: on ? "0 0 10px rgba(86,200,232,0.6)" : "none",
                }}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
