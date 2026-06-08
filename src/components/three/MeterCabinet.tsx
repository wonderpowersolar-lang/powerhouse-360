"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { SCENE } from "./palette";
import { emphasisWeight, smooth01 } from "./emphasis";

/**
 * Meter cabinet / metering wall (Powermieter). A row of digital meters with
 * tiny labelled readouts: PV-Erzeugung, Netzbezug, Wohnungen, Allgemein,
 * Wallbox. Readouts light up when the metering chapter is active.
 *
 * Positioned at world ≈ (1.9, 2.2, -1.8) to match the meters camera target.
 */
const POS: [number, number, number] = [1.9, 2.2, -1.8];

const METERS = [
  { label: "PV", color: SCENE.green },
  { label: "NETZ", color: SCENE.teal },
  { label: "WHG", color: SCENE.aqua },
  { label: "ALLG", color: SCENE.slateLight },
  { label: "WBOX", color: SCENE.warm },
];

export default function MeterCabinet() {
  const screensRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const w = smooth01(emphasisWeight("meters", 1.0));
    const t = clock.elapsedTime;
    if (screensRef.current) {
      screensRef.current.children.forEach((c, i) => {
        const m = (c as THREE.Mesh).material as THREE.MeshStandardMaterial;
        const pulse = 0.5 + 0.5 * Math.sin(t * 1.2 + i);
        m.emissiveIntensity = 0.15 + w * (0.5 + pulse * 0.6);
      });
    }
  });

  return (
    <group position={POS}>
      {/* cabinet body */}
      <mesh>
        <boxGeometry args={[3.0, 1.7, 0.28]} />
        <meshStandardMaterial color="#e7eaee" roughness={0.5} metalness={0.05} />
      </mesh>
      {/* inner panel */}
      <mesh position={[0, 0, 0.141]}>
        <boxGeometry args={[2.8, 1.5, 0.02]} />
        <meshStandardMaterial color={SCENE.navy800} roughness={0.6} />
      </mesh>

      {/* meters row */}
      <group ref={screensRef}>
        {METERS.map((m, i) => {
          const x = -1.15 + i * 0.575;
          return (
            <mesh key={i} position={[x, 0.18, 0.16]}>
              <boxGeometry args={[0.46, 0.62, 0.04]} />
              <meshStandardMaterial
                color="#0a1019"
                emissive={m.color}
                emissiveIntensity={0.15}
                roughness={0.3}
              />
            </mesh>
          );
        })}
      </group>

      {/* meter labels */}
      {METERS.map((m, i) => {
        const x = -1.15 + i * 0.575;
        return (
          <Text
            key={i}
            position={[x, -0.32, 0.17]}
            fontSize={0.1}
            color={SCENE.aqua}
            anchorX="center"
            anchorY="middle"
          >
            {m.label}
          </Text>
        );
      })}

      {/* cabinet header */}
      <Text
        position={[0, 0.72, 0.16]}
        fontSize={0.11}
        color={SCENE.navy800}
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.04}
      >
        ZÄHLERSCHRANK
      </Text>
    </group>
  );
}
