"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { SCENE } from "./palette";
import { emphasisWeight, smooth01 } from "./emphasis";
import { BUILDING_DIMS } from "./Building";

/**
 * Rooftop PV array (Powermaker). A neat grid of tilted modules on the roof.
 * Glows brand-green when the PV chapter is active. Frames are emissive-lit
 * to read clearly from the camera's elevated roof angle.
 */
const { FLOORS, FLOOR_H } = BUILDING_DIMS;
const ROOF_Y = FLOORS * FLOOR_H + 0.65;

const ROWS = 3;
const COLS = 5;
const PANEL_W = 1.05;
const PANEL_D = 0.72;

export default function RoofPV() {
  const groupRef = useRef<THREE.Group>(null);
  const frameMat = useRef<THREE.MeshStandardMaterial>(null);
  const glassMat = useRef<THREE.MeshStandardMaterial>(null);

  useFrame(() => {
    const w = smooth01(emphasisWeight("pv", 1.1));
    if (frameMat.current) frameMat.current.emissiveIntensity = 0.15 + w * 1.4;
    if (glassMat.current) glassMat.current.emissiveIntensity = 0.05 + w * 0.6;
    if (groupRef.current) {
      // gentle lift when emphasised
      groupRef.current.position.y = ROOF_Y + w * 0.04;
    }
  });

  const panels = [];
  const startX = -((COLS - 1) * (PANEL_W + 0.12)) / 2;
  const startZ = -((ROWS - 1) * (PANEL_D + 0.45)) / 2;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const x = startX + c * (PANEL_W + 0.12);
      const z = startZ + r * (PANEL_D + 0.45);
      panels.push(
        <group key={`${r}-${c}`} position={[x, 0, z]} rotation={[-0.32, 0, 0]}>
          {/* glass */}
          <mesh>
            <boxGeometry args={[PANEL_W, 0.04, PANEL_D]} />
            <meshStandardMaterial
              ref={c === 0 && r === 0 ? glassMat : undefined}
              color={SCENE.navy900}
              emissive={SCENE.teal}
              emissiveIntensity={0.05}
              metalness={0.6}
              roughness={0.25}
            />
          </mesh>
          {/* cell grid hint */}
          <mesh position={[0, 0.025, 0]}>
            <boxGeometry args={[PANEL_W - 0.08, 0.005, PANEL_D - 0.06]} />
            <meshStandardMaterial
              ref={r === 0 && c === 0 ? frameMat : undefined}
              color={SCENE.navy800}
              emissive={SCENE.green}
              emissiveIntensity={0.15}
              metalness={0.3}
              roughness={0.5}
            />
          </mesh>
        </group>
      );
    }
  }

  return (
    <group ref={groupRef} position={[0, ROOF_Y, 0]}>
      {panels}
    </group>
  );
}
