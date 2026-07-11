"use client";

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { SECTIONS } from "@/content/sections";
import { getSectionFloat } from "@/lib/scrollProgress";
import {
  getBlendTarget,
  getFocusBlend,
  getFocusSectionIndex,
  setFocusBlend,
} from "@/lib/focusStore";

/**
 * Scroll-driven camera rig + interactive-explorer focus override.
 *
 * BASE (unchanged): every frame we read the fractional section index from the
 * scroll store, find the two bounding chapter keyframes, smoothstep-interpolate
 * the camera position + look-at between them, then critically-damp the real
 * camera toward that pose. The keyframes live in sections.ts; this rig is the
 * single interpolator. No GSAP timeline drives the camera in this base mode.
 *
 * FOCUS OVERRIDE (explorer): the focus store exposes a GSAP-tweened `focusBlend`
 * 0..1 and a focused SECTION INDEX. Each frame we ALSO compute the focused
 * module's exact keyframe pose, then blend:
 *
 *     desired = lerp(scrollPose, focusPose, focusBlend)
 *
 * and feed THAT through the same damped follow. So:
 *   • blend 0  → desired === scrollPose → the scroll journey is byte-identical,
 *   • blend 1  → desired === the focused keyframe → camera is parked on the zone,
 *   • 0 < b < 1 → a calm glide between the two (the fly-in / fly-out).
 *
 * Because we blend OVER the live scroll pose rather than fighting it, the
 * handoff back to scroll (blend → 0) is seamless: the moment blend hits 0 the
 * focus term contributes nothing and the rig is purely scroll-driven again.
 *
 * The blend is eased toward its target (0 / 1, set by the focus store on pin
 * click / back) right here in `useFrame` using the real frame delta — NOT a
 * GSAP/rAF ticker. Under SwiftShader or heavy first frames the render FPS can
 * drop, which would stall an rAF-driven tween; a delta-based exponential
 * approach keeps the fly-in a calm, wall-clock ~1.2s at any frame rate.
 */

const _pos = new THREE.Vector3();
const _b = new THREE.Vector3();
const _scrollTarget = new THREE.Vector3();
const _focusPos = new THREE.Vector3();
const _focusTarget = new THREE.Vector3();
const _desiredPos = new THREE.Vector3();
const _desiredTarget = new THREE.Vector3();

function smoothstep(t: number) {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
}

/** Scroll-driven pose at the current section-float (writes into out vectors). */
function scrollPose(outPos: THREE.Vector3, outTarget: THREE.Vector3) {
  const s = getSectionFloat();
  const i = Math.floor(s);
  const a = SECTIONS[Math.min(i, SECTIONS.length - 1)];
  const b = SECTIONS[Math.min(i + 1, SECTIONS.length - 1)];
  const f = smoothstep(s - i);
  outPos.set(...a.camPos).lerp(_b.set(...b.camPos), f);
  outTarget.set(...a.camTarget).lerp(_b.set(...b.camTarget), f);
}

export default function CameraRig({ enabled = true }: { enabled?: boolean }) {
  const { camera } = useThree();
  const curTarget = useRef(new THREE.Vector3(...SECTIONS[0].camTarget));
  const inited = useRef(false);
  // Last known focus pose, so the fly-OUT keeps interpolating smoothly AFTER
  // focusId has cleared (blend still easing down, section index already -1).
  const lastFocus = useRef({
    pos: new THREE.Vector3(...SECTIONS[1].camPos),
    target: new THREE.Vector3(...SECTIONS[1].camTarget),
  });

  useFrame((_, delta) => {
    if (!enabled) return;

    // 0 — ease the focus blend toward its target (0 overview / 1 parked) using
    // the real frame delta, so the fly-in is a calm wall-clock ~1.2s at any FPS.
    const target = getBlendTarget();
    let blendNow = getFocusBlend();
    if (Math.abs(target - blendNow) > 0.0008) {
      // exponential approach: ~94% of the remaining distance per second.
      const kb = 1 - Math.pow(0.06, delta);
      blendNow += (target - blendNow) * kb;
      if (Math.abs(target - blendNow) < 0.0015) blendNow = target;
      setFocusBlend(blendNow);
    } else if (blendNow !== target) {
      blendNow = target;
      setFocusBlend(blendNow);
    }

    // 1 — live scroll-driven pose (the base journey).
    scrollPose(_pos, _scrollTarget);

    // 2 — focus override. Blend toward the focused module's keyframe by the
    // eased focusBlend. When blend is ~0 this whole branch is a no-op.
    const blend = blendNow;
    if (blend > 0.0005) {
      const fi = getFocusSectionIndex();
      // While flying OUT (focusId already cleared) getFocusSectionIndex() is -1
      // but blend is still easing down — keep using the last focus pose so the
      // exit interpolates smoothly. We cache it on the ref.
      if (fi >= 0) {
        const fs = SECTIONS[Math.min(fi, SECTIONS.length - 1)];
        _focusPos.set(...fs.camPos);
        _focusTarget.set(...fs.camTarget);
        lastFocus.current.pos.copy(_focusPos);
        lastFocus.current.target.copy(_focusTarget);
      } else {
        _focusPos.copy(lastFocus.current.pos);
        _focusTarget.copy(lastFocus.current.target);
      }
      _desiredPos.copy(_pos).lerp(_focusPos, blend);
      _desiredTarget.copy(_scrollTarget).lerp(_focusTarget, blend);
    } else {
      _desiredPos.copy(_pos);
      _desiredTarget.copy(_scrollTarget);
    }

    if (!inited.current) {
      camera.position.copy(_desiredPos);
      curTarget.current.copy(_desiredTarget);
      inited.current = true;
    } else {
      // critically-damped follow — calm, no hectic motion. The plateaued scroll
      // keyframes AND the focus keyframe are both reached with a gentle settle.
      const k = 1 - Math.pow(0.0007, delta);
      camera.position.lerp(_desiredPos, k);
      curTarget.current.lerp(_desiredTarget, k);
    }

    camera.lookAt(curTarget.current);
  });

  return null;
}
