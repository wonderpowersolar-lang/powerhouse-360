"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { SCENE } from "./palette";
import { emphasisWeight, smooth01 } from "./emphasis";
import Hub from "./Hub";

/**
 * The technical room — a recessed interior volume on the ground floor that
 * holds the POWERHOUSE Hub v1. The room is only dimly lit until the Hub
 * chapter activates, then a cool task light brings the Hub forward.
 *
 * Positioned so the Hub sits at world ≈ (-0.1, 2.0, -2.2), matching the
 * hub camera target in sections.ts.
 */
const ROOM_POS: [number, number, number] = [-0.1, 2.0, -2.2];

export default function TechRoom() {
  const lightRef = useRef<THREE.PointLight>(null);
  const wallMat = useRef<THREE.MeshStandardMaterial>(null);

  useFrame(() => {
    const w = smooth01(emphasisWeight("hub", 1.1));
    if (lightRef.current) lightRef.current.intensity = 0.3 + w * 6;
    if (wallMat.current) {
      (wallMat.current.color as THREE.Color).setStyle(SCENE.navy700);
      wallMat.current.emissiveIntensity = w * 0.08;
    }
  });

  return (
    <group position={ROOM_POS}>
      {/* back wall the hub mounts onto */}
      <mesh position={[0, 0, -0.2]}>
        <boxGeometry args={[5, 4, 0.2]} />
        <meshStandardMaterial
          ref={wallMat}
          color={SCENE.navy700}
          emissive={SCENE.teal}
          emissiveIntensity={0}
          roughness={0.9}
        />
      </mesh>
      {/* floor */}
      <mesh position={[0, -2, 1]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[5, 2.6]} />
        <meshStandardMaterial color={SCENE.navy800} roughness={0.95} />
      </mesh>
      {/* side walls (frame the recess) */}
      <mesh position={[-2.5, 0, 1]}>
        <boxGeometry args={[0.2, 4, 2.4]} />
        <meshStandardMaterial color={SCENE.navy800} roughness={0.9} />
      </mesh>
      <mesh position={[2.5, 0, 1]}>
        <boxGeometry args={[0.2, 4, 2.4]} />
        <meshStandardMaterial color={SCENE.navy800} roughness={0.9} />
      </mesh>

      {/* task light */}
      <pointLight
        ref={lightRef}
        position={[0.4, 1.4, 1.6]}
        intensity={0.3}
        color={SCENE.aqua}
        distance={7}
        decay={2}
      />

      {/* The Hub, raised to sit centred on the wall */}
      <group position={[0, 0.05, 0]}>
        <Hub />
      </group>
    </group>
  );
}
