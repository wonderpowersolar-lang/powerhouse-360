"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { emphasisWeight, smooth01 } from "./emphasis";
import type { Emphasis } from "@/content/sections";

/**
 * A calm, subtle energy-flow accent: a thin curved line between two points
 * with a few soft dots travelling along it. Appears only when the related
 * chapter is active (driven by `activeOn` emphasis), so flows stay dezent.
 *
 * The line is rendered declaratively (R3F `<line>`) with refs to the material
 * and the dot group; everything is mutated inside useFrame only.
 */
export default function EnergyFlow({
  from,
  to,
  color,
  activeOn,
  dots = 4,
  speed = 0.18,
  bow = 1.2,
}: {
  from: THREE.Vector3Tuple;
  to: THREE.Vector3Tuple;
  color: string;
  activeOn: Emphasis;
  dots?: number;
  speed?: number;
  bow?: number;
}) {
  const dotsRef = useRef<THREE.Group>(null);
  const lineMatRef = useRef<THREE.LineBasicMaterial>(null);

  const curve = useMemo(() => {
    const a = new THREE.Vector3(...from);
    const b = new THREE.Vector3(...to);
    const mid = a.clone().lerp(b, 0.5);
    mid.y += bow; // arc upward
    return new THREE.QuadraticBezierCurve3(a, mid, b);
  }, [from, to, bow]);

  const geometry = useMemo(
    () => new THREE.BufferGeometry().setFromPoints(curve.getPoints(40)),
    [curve]
  );

  useFrame(({ clock }) => {
    const w = smooth01(emphasisWeight(activeOn, 1.0));
    if (lineMatRef.current) lineMatRef.current.opacity = w * 0.45;
    if (dotsRef.current) {
      const t = clock.elapsedTime * speed;
      dotsRef.current.children.forEach((c, i) => {
        const p = (t + i / dots) % 1;
        c.position.copy(curve.getPointAt(p));
        const m = (c as THREE.Mesh).material as THREE.MeshBasicMaterial;
        const edge = Math.sin(p * Math.PI); // fade at both ends
        m.opacity = w * edge * 0.9;
      });
    }
  });

  return (
    <group>
      <line>
        <primitive object={geometry} attach="geometry" />
        <lineBasicMaterial
          ref={lineMatRef}
          color={color}
          transparent
          opacity={0}
          toneMapped={false}
        />
      </line>
      <group ref={dotsRef}>
        {Array.from({ length: dots }).map((_, i) => (
          <mesh key={i}>
            <sphereGeometry args={[0.07, 8, 8]} />
            <meshBasicMaterial
              color={color}
              transparent
              opacity={0}
              toneMapped={false}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}
