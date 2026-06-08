"use client";

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { SECTIONS } from "@/content/sections";
import { getSectionFloat } from "@/lib/scrollProgress";

/**
 * Scroll-driven camera rig.
 *
 * Every frame we read the fractional section index (0..7) from the scroll
 * store, find the two bounding chapter keyframes, and smoothstep-interpolate
 * the camera position + look-at target between them. The result is then
 * damped toward by the actual camera so movement stays SLOW and calm even if
 * the user scroll-jumps. No GSAP timeline needed for the camera itself — the
 * keyframes live in sections.ts and this rig is the single interpolator.
 */

const _pos = new THREE.Vector3();
const _target = new THREE.Vector3();
const _curTarget = new THREE.Vector3();

function smoothstep(t: number) {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
}

export default function CameraRig({ enabled = true }: { enabled?: boolean }) {
  const { camera } = useThree();
  const curTarget = useRef(
    new THREE.Vector3(...SECTIONS[0].camTarget)
  );
  const inited = useRef(false);

  useFrame((_, delta) => {
    if (!enabled) return;

    const s = getSectionFloat();
    const i = Math.floor(s);
    const a = SECTIONS[Math.min(i, SECTIONS.length - 1)];
    const b = SECTIONS[Math.min(i + 1, SECTIONS.length - 1)];
    const f = smoothstep(s - i);

    _pos.set(...a.camPos).lerp(_target.set(...b.camPos), f);
    _curTarget.set(...a.camTarget).lerp(_target.set(...b.camTarget), f);

    if (!inited.current) {
      camera.position.copy(_pos);
      curTarget.current.copy(_curTarget);
      inited.current = true;
    } else {
      // critically-damped follow — calm, no hectic motion
      const k = 1 - Math.pow(0.0009, delta);
      camera.position.lerp(_pos, k);
      curTarget.current.lerp(_curTarget, k);
    }

    camera.lookAt(curTarget.current);
  });

  return null;
}
