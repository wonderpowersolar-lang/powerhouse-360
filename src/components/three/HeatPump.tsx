"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { SCENE } from "./palette";
import { emphasisWeight, smooth01 } from "./emphasis";
import { BUILDING_DIMS } from "./Building";

/**
 * Air-source heat pump (Heatmaker) in the courtyard on the -x side. A faithful
 * outdoor unit:
 *  - body with horizontal louvre grille on the fan face + panel seams
 *  - recessed circular fan housing with spinning blades + hub cap
 *  - brand hint on the side panel
 *  - insulated refrigerant pipes routed into the wall, on a wall bracket
 *  - condensate drip + clean concrete pad
 *
 * Warms up + fan spins faster when the heat chapter is active. Glow stays very
 * subtle so the unit body stays readable.
 */
const { WIDTH } = BUILDING_DIMS;
// Ground-level outdoor unit beside the tower (-x side), on the plaza. Fan faces
// -x (away from the building); insulated pipes route +x into the wall.
const POS: [number, number, number] = [-WIDTH / 2 - 1.7, 0.9, 1.2];

const BODY_W = 1.7;
const BODY_H = 1.5;
const BODY_D = 1.0;

export default function HeatPump() {
  const fanRef = useRef<THREE.Group>(null);
  const bodyMat = useRef<THREE.MeshStandardMaterial>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    const w = smooth01(emphasisWeight("heatpump", 1.0));
    if (fanRef.current) fanRef.current.rotation.z += delta * (0.6 + w * 7);
    if (bodyMat.current) bodyMat.current.emissiveIntensity = 0.03 + w * 0.4;
    if (glowRef.current) {
      const m = glowRef.current.material as THREE.MeshBasicMaterial;
      m.opacity = 0.03 + w * 0.14;
    }
  });

  return (
    <group position={POS}>
      {/* concrete pad with chamfered top */}
      <mesh position={[0, -0.85, 0]} receiveShadow>
        <boxGeometry args={[2.3, 0.2, 1.7]} />
        <meshStandardMaterial color={SCENE.navy800} roughness={0.95} />
      </mesh>
      {/* anti-vibration feet */}
      {[[-0.7, -0.6], [0.7, -0.6], [-0.7, 0.6], [0.7, 0.6]].map((p, i) => (
        <mesh key={i} position={[p[0], -0.73, p[1]]}>
          <boxGeometry args={[0.14, 0.1, 0.14]} />
          <meshStandardMaterial color={SCENE.navy900} roughness={0.8} />
        </mesh>
      ))}

      {/* main outdoor unit body */}
      <mesh castShadow>
        <boxGeometry args={[BODY_W, BODY_H, BODY_D]} />
        <meshStandardMaterial
          ref={bodyMat}
          color={SCENE.slate}
          emissive={SCENE.teal}
          emissiveIntensity={0.03}
          roughness={0.5}
          metalness={0.4}
        />
      </mesh>

      {/* top panel cap (slightly proud, darker) */}
      <mesh position={[0, BODY_H / 2 + 0.02, 0]}>
        <boxGeometry args={[BODY_W + 0.04, 0.06, BODY_D + 0.04]} />
        <meshStandardMaterial color={SCENE.navy700} roughness={0.6} metalness={0.3} />
      </mesh>

      {/* panel seams on +z side (a couple of horizontal break lines) */}
      {[-0.35, 0.0, 0.35].map((y, i) => (
        <mesh key={`seam${i}`} position={[0, y, BODY_D / 2 + 0.001]}>
          <boxGeometry args={[BODY_W - 0.06, 0.012, 0.01]} />
          <meshStandardMaterial color={SCENE.navy800} roughness={0.7} />
        </mesh>
      ))}

      {/* fan face recess (faces -x, away from building) */}
      <mesh position={[-BODY_W / 2 - 0.01, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.68, 0.68, 0.08, 32]} />
        <meshStandardMaterial color={SCENE.navy900} roughness={0.6} metalness={0.3} />
      </mesh>
      {/* fan guard ring */}
      <mesh position={[-BODY_W / 2 - 0.06, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.6, 0.03, 8, 32]} />
        <meshStandardMaterial color={SCENE.slateLight} metalness={0.6} roughness={0.4} />
      </mesh>
      {/* guard spokes */}
      {[0, 1, 2, 3].map((i) => (
        <mesh
          key={`spoke${i}`}
          position={[-BODY_W / 2 - 0.06, 0, 0]}
          rotation={[(i * Math.PI) / 4, 0, Math.PI / 2]}
        >
          <boxGeometry args={[0.012, 1.18, 0.012]} />
          <meshStandardMaterial color={SCENE.slate} metalness={0.5} roughness={0.5} />
        </mesh>
      ))}

      {/* fan blades + hub */}
      <group ref={fanRef} position={[-BODY_W / 2 - 0.04, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        {[0, 1, 2, 3, 4].map((i) => (
          <mesh
            key={i}
            rotation={[0, 0, (i * Math.PI * 2) / 5]}
            position={[0, 0.24, 0]}
          >
            <boxGeometry args={[0.16, 0.46, 0.02]} />
            <meshStandardMaterial color={SCENE.slateLight} roughness={0.4} metalness={0.3} />
          </mesh>
        ))}
        <mesh>
          <cylinderGeometry args={[0.12, 0.12, 0.1, 16]} />
          <meshStandardMaterial color={SCENE.navy700} metalness={0.5} />
        </mesh>
      </group>

      {/* louvre grille on the +z front face (air outlet slats) */}
      <group position={[0, 0, BODY_D / 2 + 0.005]}>
        {Array.from({ length: 7 }).map((_, i) => (
          <mesh key={i} position={[0, 0.5 - i * 0.16, 0]} rotation={[0.25, 0, 0]}>
            <boxGeometry args={[1.0, 0.1, 0.02]} />
            <meshStandardMaterial color={SCENE.navy600} roughness={0.6} metalness={0.25} />
          </mesh>
        ))}
      </group>

      {/* brand hint on the +z face, lower-left */}
      <Text
        position={[-0.45, -0.62, BODY_D / 2 + 0.02]}
        fontSize={0.1}
        color={SCENE.aqua}
        anchorX="left"
        anchorY="middle"
        letterSpacing={0.04}
      >
        HEATMAKER
      </Text>

      {/* warm glow halo when active — kept subtle */}
      <mesh ref={glowRef} position={[0.1, 0.1, 0]}>
        <sphereGeometry args={[0.95, 16, 16]} />
        <meshBasicMaterial color={SCENE.amber} transparent opacity={0.03} toneMapped={false} />
      </mesh>

      {/* insulated refrigerant pipes into the wall (+x side), wall bracket */}
      <group position={[BODY_W / 2 + 0.1, -0.2, 0.1]}>
        {/* two insulated lines */}
        {[-0.12, 0.12].map((dz, i) => (
          <mesh key={i} position={[0.55, 0, dz]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.07, 0.07, 1.3, 12]} />
            <meshStandardMaterial color="#d9dde2" roughness={0.7} />
          </mesh>
        ))}
        {/* elbow down into wall */}
        <mesh position={[1.2, -0.25, 0]}>
          <cylinderGeometry args={[0.075, 0.075, 0.6, 12]} />
          <meshStandardMaterial color="#d9dde2" roughness={0.7} />
        </mesh>
        {/* wall bracket */}
        <mesh position={[0.2, 0, 0]}>
          <boxGeometry args={[0.1, 0.4, 0.4]} />
          <meshStandardMaterial color={SCENE.navy700} metalness={0.4} roughness={0.5} />
        </mesh>
      </group>

      {/* condensate drip pipe + small puddle */}
      <mesh position={[0.3, -0.75, 0.4]}>
        <cylinderGeometry args={[0.025, 0.025, 0.2, 8]} />
        <meshStandardMaterial color={SCENE.slate} metalness={0.4} roughness={0.5} />
      </mesh>
    </group>
  );
}
