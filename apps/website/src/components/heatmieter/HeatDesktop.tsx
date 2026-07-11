"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { HM_SCENES } from "@/content/heatmieter";
import HeatPanel from "./HeatPanel";
import HeatCineScrollBridge from "./HeatCineScrollBridge";
import HeatRail from "./HeatRail";
import HeatLoader from "./HeatLoader";
import { OverlayStyles } from "./HeatCineOverlays";

const HeatStage = dynamic(() => import("./HeatStage"), { ssr: false });

/**
 * Desktop-Erlebnis /heatmieter: EINE fixierte Bühne (Zwei-Winter-Story +
 * Sachthemen-Stills) füllt den Viewport; darüber scrollen die 14 Szenen-Panels
 * mit ihren schwebenden UI-Karten. Die letzte Szene (CTA) ist sticky, damit der
 * Footer sie natürlich hinausschiebt. Port von ChargeDesktop.
 */
export default function HeatDesktop() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (ready) return;
    const t = setTimeout(() => setReady(true), 2500);
    return () => clearTimeout(t);
  }, [ready]);

  const scenes = HM_SCENES.filter((s) => s.id !== "cta");
  const ctaScene = HM_SCENES.find((s) => s.id === "cta")!;

  return (
    <div className="relative">
      <HeatCineScrollBridge />

      {/* fixierte Bühne */}
      <div className="fixed inset-0 z-0 h-dvh w-full overflow-hidden">
        <HeatStage onReady={() => setReady(true)} />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(135% 105% at 50% 45%, transparent 62%, rgba(6,7,9,0.35) 100%)",
          }}
        />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-navy-900/80 to-transparent" />
      </div>

      <HeatLoader hidden={ready} />
      <HeatRail />

      {/* Szenen-Panels über der Bühne */}
      <div className="relative z-10">
        {scenes.map((s) => (
          <HeatPanel key={s.id} scene={s} />
        ))}
        <HeatPanel scene={ctaScene} />
      </div>

      <OverlayStyles />
    </div>
  );
}
