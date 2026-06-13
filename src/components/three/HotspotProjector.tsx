"use client";

import { useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { HOTSPOTS, getFocusBlend } from "@/lib/focusStore";
import { getSectionFloat } from "@/lib/scrollProgress";
import {
  ensureProjectionSlots,
  setOverviewAmount,
  writeProjection,
} from "@/lib/hotspotProjection";

/**
 * Projects the explorer hotspot anchors to screen space every frame and stores
 * the result in the hotspotProjection bridge for the DOM pin layer to read.
 * Lives inside the Canvas (needs the live camera + drawing-buffer size). Writes
 * imperatively — it renders nothing and never triggers a React re-render.
 *
 * It also publishes an "overview amount" (1 on the hero/finale bands, 0 through
 * the interior chapters) so the DOM layer can show pins only when the building
 * is framed whole — the calm, NRG-like overview stage — and hide them while the
 * camera is deep in a single module during a normal scroll pass.
 */

const _v = new THREE.Vector3();
const LAST = 8; // finale section index

export default function HotspotProjector() {
  const { camera, size } = useThree();
  // Pre-build Vector3 anchors once.
  const anchors = useMemo(
    () => HOTSPOTS.map((h) => new THREE.Vector3(...h.anchor)),
    []
  );
  ensureProjectionSlots(HOTSPOTS.length);

  useFrame(() => {
    // Overview amount: 1 near the hero (index 0) and finale (index 8), ramping
    // to 0 by ~0.85 section-units in. While focused (blend>0) the explorer owns
    // the stage, so force full overview so pins can re-appear on the way OUT.
    const s = getSectionFloat();
    const nearHero = 1 - Math.min(1, s / 0.85);
    const nearFinale = 1 - Math.min(1, Math.abs(LAST - s) / 0.85);
    const blend = getFocusBlend();
    const overview = Math.max(nearHero, nearFinale, blend > 0.01 ? 1 : 0);
    setOverviewAmount(overview);

    for (let i = 0; i < anchors.length; i++) {
      _v.copy(anchors[i]).project(camera);
      // z in NDC > 1 means behind the far plane / camera → treat as off-screen.
      const inFront = _v.z < 1;
      const x = (_v.x * 0.5 + 0.5) * size.width;
      const y = (-_v.y * 0.5 + 0.5) * size.height;
      const onScreen =
        inFront &&
        x > -40 &&
        x < size.width + 40 &&
        y > -40 &&
        y < size.height + 40;
      // Depth scale: nearer anchors slightly larger. _v.z in [-1,1]; map to a
      // gentle 0.62..1 so far pins (roof) don't balloon.
      const scale = THREE.MathUtils.clamp(1 - (_v.z + 1) * 0.2, 0.62, 1);
      writeProjection(i, x, y, onScreen, scale);
    }
  });

  return null;
}
