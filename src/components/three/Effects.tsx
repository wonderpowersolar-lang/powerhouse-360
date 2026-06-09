"use client";

import { useRef } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import {
  EffectComposer,
  Bloom,
  Vignette,
  DepthOfField,
  SMAA,
  N8AO,
} from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import { getSectionFloat } from "@/lib/scrollProgress";
import { SECTIONS } from "@/content/sections";

/**
 * Cinematic post chain for the POWERHOUSE360 tower.
 *
 *  • N8AO      — contact/ambient occlusion for depth in window reveals,
 *                balconies, plaza and interior corners. Low samples + halfRes.
 *  • Bloom     — HIGH luminance threshold so ONLY the brightest warm windows /
 *                LED accents / PV highlights bloom. No global haze.
 *  • DepthOfField — the "architectural miniature" tilt-shift look on the WIDE
 *                exterior shots. focusDistance (WORLD units) + bokeh are driven
 *                from the ACTIVE chapter every frame: interior chapters
 *                (hub / meters / residents) widen the focus range to near
 *                infinity and drop bokeh to 0 so the Hub / cabinet / Paula stay
 *                razor sharp; exterior wide shots get a shallow focal band that
 *                reads as a miniature.
 *  • Vignette  — gentle corner darkening, keeps the calm premium mood.
 *  • SMAA      — cheap edge AA so the post chain doesn't re-introduce jaggies.
 */

// Chapters that sit INSIDE the building envelope, close to a hero asset →
// must stay SHARP (no miniature blur).
const INTERIOR = new Set(["hub", "meters", "residents"]);
// Chapters that frame a CLOSE exterior hero asset (PV array, heat pump). The
// tilt-shift miniature look would smear these, so they get a SHARP subject and
// only a whisper of background bokeh.
const CLOSE_SUBJECT = new Set(["pv", "heat"]);
// The wide architectural shots where the full miniature tilt-shift reads best.
const WIDE = new Set(["hero", "dashboard", "cta"]);

// Minimal typing for the postprocessing DepthOfFieldEffect instance.
type DoFEffect = {
  focusDistance: number;
  focusRange: number;
  bokehScale: number;
};

type FocusKind = "interior" | "close" | "wide";

function activeChapter() {
  const s = getSectionFloat();
  const i = Math.max(0, Math.min(SECTIONS.length - 1, Math.round(s)));
  const sec = SECTIONS[i];
  const cam = sec.camPos;
  const tgt = sec.camTarget;
  const dx = cam[0] - tgt[0];
  const dy = cam[1] - tgt[1];
  const dz = cam[2] - tgt[2];
  const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
  let kind: FocusKind = "wide";
  if (INTERIOR.has(sec.id)) kind = "interior";
  else if (CLOSE_SUBJECT.has(sec.id)) kind = "close";
  else if (WIDE.has(sec.id)) kind = "wide";
  return { kind, dist };
}

export default function Effects() {
  const { size } = useThree();
  const dofRef = useRef<DoFEffect | null>(null);

  // Smoothed focus state so chapter→chapter transitions don't pop.
  const focusDist = useRef(22);
  const focusRange = useRef(30);
  const bokeh = useRef(2.0);

  useFrame((_, delta) => {
    const { kind, dist } = activeChapter();

    // Focus distance is always the camera→subject distance so the HERO of each
    // chapter is in focus. Range + bokeh scale set the look per chapter type:
    //  • interior → enormous range, no bokeh → the whole room is sharp.
    //  • close    → wide range around the subject + a whisper of background
    //               bokeh so the PV array / heat pump stay crisp.
    //  • wide     → shallow focal band + real bokeh → architectural miniature.
    const targetDist = dist;
    let targetRange: number;
    let targetBokeh: number;
    if (kind === "interior") {
      targetRange = 60;
      targetBokeh = 0.0;
    } else if (kind === "close") {
      targetRange = Math.max(6, dist * 1.1);
      targetBokeh = 1.1;
    } else {
      // wide miniature
      targetRange = Math.max(5, dist * 0.5);
      targetBokeh = 3.0;
    }

    const k = 1 - Math.pow(0.0016, delta);
    focusDist.current += (targetDist - focusDist.current) * k;
    focusRange.current += (targetRange - focusRange.current) * k;
    bokeh.current += (targetBokeh - bokeh.current) * k;

    const dof = dofRef.current;
    if (dof) {
      dof.focusDistance = focusDist.current;
      dof.focusRange = focusRange.current;
      dof.bokehScale = bokeh.current;
    }
  });

  return (
    <EffectComposer multisampling={0} enableNormalPass>
      <N8AO
        aoRadius={1.2}
        intensity={1.4}
        distanceFalloff={1.0}
        quality="low"
        halfRes
        color="#0a1018"
      />
      <Bloom
        intensity={0.65}
        luminanceThreshold={0.82}
        luminanceSmoothing={0.2}
        mipmapBlur
        radius={0.68}
      />
      <DepthOfField
        ref={dofRef as never}
        worldFocusDistance={22}
        worldFocusRange={30}
        bokehScale={2.0}
        height={Math.min(560, size.height)}
      />
      <Vignette
        offset={0.3}
        darkness={0.6}
        blendFunction={BlendFunction.NORMAL}
      />
      <SMAA />
    </EffectComposer>
  );
}
