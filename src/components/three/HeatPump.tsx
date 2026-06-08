"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { SCENE } from "./palette";
import { emphasisWeight, smooth01 } from "./emphasis";
import { BUILDING_DIMS } from "./Building";

/**
 * Air-source heat pump (Heatmaker), sitting in the courtyard on the -x side
 * of the building. A clean outdoor unit with a spinning fan; warms up + the
 * fan spins faster when the heat chapter is active.
 */
const { WIDTH } = BUILDING_DIMS;
const POS: [number, number, number] = [-WIDTH / 2 - 1.6, 0.9, 0.6];

export default function HeatPump() {
  const fanRef = useRef<THREE.Group>(null);
  const bodyMat = useRef<THREE.MeshStandardMaterial>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    const w = smooth01(emphasisWeight("heatpump", 1.0));
    if (fanRef.current) fanRef.current.rotation.z += delta * (0.6 + w * 6);
    if (bodyMat.current) bodyMat.current.emissiveIntensity = 0.04 + w * 0.5;
    if (glowRef.current) {
      const m = glowRef.current.material as THREE.MeshBasicMaterial;
      m.opacity = 0.08 + w * 0.4;
    }
  });

  return (
    <group position={POS}>
      {/* concrete pad */}
      <mesh position={[0, -0.85, 0]} receiveShadow>
        <boxGeometry args={[2.2, 0.18, 1.6]} />
        <meshStandardMaterial color={SCENE.navy800} roughness={0.95} />
      </mesh>

      {/* main outdoor unit body */}
      <mesh castShadow>
        <boxGeometry args={[1.7, 1.5, 1.0]} />
        <meshStandardMaterial
          ref={bodyMat}
          color={SCENE.slate}
          emissive={SCENE.teal}
          emissiveIntensity={0.04}
          roughness={0.55}
          metalness={0.35}
        />
      </mesh>

      {/* fan grille recess (faces -x, away from building) */}
      <mesh position={[-0.86, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.62, 0.62, 0.06, 28]} />
        <meshStandardMaterial color={SCENE.navy900} roughness={0.6} />
      </mesh>

      {/* fan blades */}
      <group ref={fanRef} position={[-0.9, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        {[0, 1, 2, 3, 4].map((i) => (
          <mesh key={i} rotation={[0, 0, (i * Math.PI * 2) / 5]} position={[0, 0.22, 0]}>
            <boxGeometry args={[0.12, 0.44, 0.02]} />
            <meshStandardMaterial color={SCENE.slateLight} roughness={0.4} />
          </mesh>
        ))}
        <mesh>
          <cylinderGeometry args={[0.1, 0.1, 0.08, 16]} />
          <meshStandardMaterial color={SCENE.navy700} />
        </mesh>
      </group>

      {/* warm glow halo when active */}
      <mesh ref={glowRef} position={[0.2, 0, 0]}>
        <sphereGeometry args={[1.4, 16, 16]} />
        <meshBasicMaterial color={SCENE.amber} transparent opacity={0.08} />
      </mesh>

      {/* pipe into building */}
      <mesh position={[0.95, -0.3, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.06, 0.06, 1.4, 12]} />
        <meshStandardMaterial color={SCENE.slate} metalness={0.5} roughness={0.4} />
      </mesh>
    </group>
  );
}
