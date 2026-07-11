"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { CM_SCENES } from "@/content/chargemieter";
import ChargePanel from "./ChargePanel";
import ChargeScrollBridge from "./ChargeScrollBridge";
import ChargeRail from "./ChargeRail";
import ChargeLoader from "./ChargeLoader";
import { OverlayStyles } from "./ChargeOverlays";

const ChargeStage = dynamic(() => import("./ChargeStage"), { ssr: false });

/**
 * Desktop-Erlebnis /chargemieter: EINE fixierte Bühne (kinematische Medien +
 * Grade) füllt den Viewport; darüber scrollen die 12 Szenen-Panels mit ihren
 * schwebenden UI-Karten. Die letzte Szene (CTA) ist sticky, damit der Footer
 * sie natürlich hinausschiebt.
 */
export default function ChargeDesktop() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (ready) return;
    const t = setTimeout(() => setReady(true), 2500);
    return () => clearTimeout(t);
  }, [ready]);

  const scenes = CM_SCENES.filter((s) => s.id !== "cta");
  const ctaScene = CM_SCENES.find((s) => s.id === "cta")!;

  return (
    <div className="relative">
      <ChargeScrollBridge />

      {/* fixierte Bühne */}
      <div className="fixed inset-0 z-0 h-dvh w-full overflow-hidden">
        <ChargeStage onReady={() => setReady(true)} />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(135% 105% at 50% 45%, transparent 62%, rgba(6,7,9,0.35) 100%)",
          }}
        />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-navy-900/80 to-transparent" />
      </div>

      <ChargeLoader hidden={ready} />
      <ChargeRail />

      {/* Szenen-Panels über der Bühne */}
      <div className="relative z-10">
        {scenes.map((s) => (
          <ChargePanel key={s.id} scene={s} />
        ))}
        <ChargePanel scene={ctaScene} />
      </div>

      <OverlayStyles />
    </div>
  );
}
