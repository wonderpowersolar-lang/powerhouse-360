"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { SCENE } from "./palette";
import { emphasisWeight, smooth01 } from "./emphasis";
import { BUILDING_DIMS } from "./Building";

/**
 * Heatmieter — a REALISTIC monobloc air-to-water heat pump (Luft-Wasser-
 * Wärmepumpe) in the courtyard on the -x side, the way a Vaillant aroTHERM /
 * Viessmann Vitocal outdoor unit actually looks:
 *
 *  - UPRIGHT rectangular cabinet (taller than deep) on an anti-vibration stand,
 *  - a LARGE circular fan recessed behind a round protective grille on the FRONT
 *    face (faces -x, toward the heat-chapter camera) — concentric guard rings +
 *    radial spokes + spinning swept blades + centre hub cap,
 *  - a TOP air-outlet louvre cassette (angled slats) where the cooled air exits,
 *  - side SERVICE panels with recessed seams + fixing screws + a small data badge,
 *  - INSULATED flow / return pipes (lagged, grey) routed from the base into the
 *    building wall on a bracket, with a condensate drain,
 *  - a clean concrete pad.
 *
 * The fan spins faster + a faint warm core glows when the heat chapter is active;
 * the body stays readable (no wash-out).
 */
const { WIDTH } = BUILDING_DIMS;

// Cabinet dimensions — upright monobloc. Fan + grille live on the -x face.
const BODY_W = 1.35; // along x (depth of the unit, front face at -x)
const BODY_H = 2.0; // height (upright)
const BODY_D = 1.55; // along z (width of the unit)
const STAND_H = 0.5; // feet/stand height above pad

// Centre of the cabinet body. Sits just off the -x facade on the plaza.
const PAD_Y = 0.04;
const BODY_CY = PAD_Y + STAND_H + BODY_H / 2;
const POS: [number, number, number] = [-WIDTH / 2 - 1.9, 0, 1.2];

// Front (fan) face plane in local space.
const FRONT_X = -BODY_W / 2;
const FAN_R = 0.62;

export default function HeatPump() {
  const fanRef = useRef<THREE.Group>(null);
  const bodyMat = useRef<THREE.MeshStandardMaterial>(null);
  const coreRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    const w = smooth01(emphasisWeight("heatpump", 1.0));
    if (fanRef.current) fanRef.current.rotation.x += delta * (0.7 + w * 8);
    if (bodyMat.current) bodyMat.current.emissiveIntensity = 0.02 + w * 0.18;
    if (coreRef.current) {
      const m = coreRef.current.material as THREE.MeshBasicMaterial;
      m.opacity = 0.04 + w * 0.22;
    }
  });

  // Swept fan blades (5), built once.
  const blades = useMemo(() => [0, 1, 2, 3, 4], []);

  return (
    <group position={POS}>
      {/* ── concrete pad ── */}
      <mesh position={[0, PAD_Y - 0.06, 0]} receiveShadow>
        <boxGeometry args={[BODY_W + 0.7, 0.12, BODY_D + 0.6]} />
        <meshStandardMaterial color={SCENE.navy800} roughness={0.96} />
      </mesh>

      {/* ── anti-vibration stand (two rails + feet) ── */}
      {[-BODY_D / 2 + 0.2, BODY_D / 2 - 0.2].map((z, i) => (
        <mesh key={`rail${i}`} position={[0, PAD_Y + STAND_H / 2, z]} castShadow>
          <boxGeometry args={[BODY_W - 0.1, STAND_H, 0.12]} />
          <meshStandardMaterial color={SCENE.navy900} metalness={0.5} roughness={0.6} />
        </mesh>
      ))}

      {/* ── main UPRIGHT cabinet ── */}
      <mesh position={[0, BODY_CY, 0]} castShadow receiveShadow>
        <boxGeometry args={[BODY_W, BODY_H, BODY_D]} />
        <meshStandardMaterial
          ref={bodyMat}
          color="#cfd6dc"
          emissive={SCENE.amber}
          emissiveIntensity={0.02}
          roughness={0.42}
          metalness={0.32}
        />
      </mesh>
      {/* darker plinth band at the cabinet base */}
      <mesh position={[0, PAD_Y + STAND_H + 0.12, 0]}>
        <boxGeometry args={[BODY_W + 0.02, 0.24, BODY_D + 0.02]} />
        <meshStandardMaterial color={SCENE.slate} roughness={0.6} metalness={0.35} />
      </mesh>

      {/* ── TOP air-outlet louvre cassette (angled slats) ── */}
      <group position={[0, BODY_CY + BODY_H / 2 + 0.01, 0]}>
        <mesh>
          <boxGeometry args={[BODY_W + 0.06, 0.1, BODY_D + 0.06]} />
          <meshStandardMaterial color={SCENE.slate} roughness={0.5} metalness={0.4} />
        </mesh>
        {Array.from({ length: 6 }).map((_, i) => (
          <mesh key={i} position={[0, 0.08, -BODY_D / 2 + 0.22 + i * 0.22]} rotation={[0.5, 0, 0]}>
            <boxGeometry args={[BODY_W - 0.16, 0.02, 0.16]} />
            <meshStandardMaterial color={SCENE.navy700} roughness={0.55} metalness={0.3} />
          </mesh>
        ))}
      </group>

      {/* ── FRONT FAN ASSEMBLY (faces -x, toward the heat camera) ── */}
      <group position={[FRONT_X - 0.01, BODY_CY + 0.12, 0]} rotation={[0, 0, 0]}>
        {/* recessed fan well (dark) */}
        <mesh position={[-0.02, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[FAN_R + 0.06, FAN_R + 0.06, 0.1, 40]} />
          <meshStandardMaterial color={SCENE.navy900} roughness={0.7} metalness={0.3} />
        </mesh>

        {/* swept blades + hub (spin) */}
        <group ref={fanRef} position={[-0.06, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          {blades.map((i) => (
            <mesh
              key={i}
              rotation={[0, (i * Math.PI * 2) / blades.length, 0.42]}
              position={[0, 0, 0]}
            >
              {/* a curved-ish blade: thin tapered box offset from centre */}
              <group rotation={[0, 0, 0]}>
                <mesh position={[0, 0.02, 0.3]} rotation={[0.35, 0, 0]}>
                  <boxGeometry args={[0.2, 0.02, 0.5]} />
                  <meshStandardMaterial color="#aeb8c0" roughness={0.4} metalness={0.35} />
                </mesh>
              </group>
            </mesh>
          ))}
          {/* hub cap */}
          <mesh rotation={[0, 0, 0]}>
            <cylinderGeometry args={[0.16, 0.18, 0.14, 20]} />
            <meshStandardMaterial color={SCENE.navy700} metalness={0.6} roughness={0.4} />
          </mesh>
        </group>

        {/* faint warm core glow (active state) just inside the well */}
        <mesh ref={coreRef} position={[0.02, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <circleGeometry args={[FAN_R * 0.8, 32]} />
          <meshBasicMaterial color={SCENE.amber} transparent opacity={0.04} side={THREE.DoubleSide} toneMapped={false} />
        </mesh>

        {/* round protective GRILLE: outer ring + 2 concentric rings + spokes */}
        <group position={[-0.12, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          {[FAN_R + 0.04, FAN_R * 0.66, FAN_R * 0.34].map((r, i) => (
            <mesh key={`ring${i}`}>
              <torusGeometry args={[r, 0.022, 8, 44]} />
              <meshStandardMaterial color={i === 0 ? SCENE.slateLight : SCENE.slate} metalness={0.65} roughness={0.4} />
            </mesh>
          ))}
          {Array.from({ length: 8 }).map((_, i) => (
            <mesh key={`spk${i}`} rotation={[0, (i * Math.PI) / 4, 0]}>
              <boxGeometry args={[0.014, 0.014, (FAN_R + 0.04) * 2]} />
              <meshStandardMaterial color={SCENE.slate} metalness={0.55} roughness={0.45} />
            </mesh>
          ))}
        </group>
      </group>

      {/* ── side SERVICE panel seams + fixing screws (on +z face) ── */}
      <group position={[0, BODY_CY, BODY_D / 2 + 0.001]}>
        {[BODY_H * 0.28, -BODY_H * 0.18].map((y, i) => (
          <mesh key={`seam${i}`} position={[0, y, 0]}>
            <boxGeometry args={[BODY_W - 0.1, 0.014, 0.006]} />
            <meshStandardMaterial color={SCENE.navy600} roughness={0.6} />
          </mesh>
        ))}
        {[[-0.5, 0.8], [0.5, 0.8], [-0.5, -0.8], [0.5, -0.8]].map((p, i) => (
          <mesh key={`scr${i}`} position={[p[0], p[1], 0.004]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.022, 0.022, 0.01, 8]} />
            <meshStandardMaterial color={SCENE.slate} metalness={0.6} roughness={0.4} />
          </mesh>
        ))}
      </group>

      {/* data/brand badge on the +z upper panel */}
      <Text
        position={[0, BODY_CY + BODY_H * 0.34, BODY_D / 2 + 0.012]}
        fontSize={0.11}
        color={SCENE.navy700}
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.05}
        rotation={[0, 0, 0]}
      >
        HEATMIETER
      </Text>

      {/* ── insulated flow/return pipes into the building wall (+x side) ── */}
      <group position={[BODY_W / 2 + 0.05, PAD_Y + STAND_H + 0.3, 0.2]}>
        {[-0.16, 0.16].map((dz, i) => (
          <group key={i}>
            {/* horizontal lagged run toward the wall */}
            <mesh position={[0.6, 0, dz]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.075, 0.075, 1.25, 14]} />
              <meshStandardMaterial color="#dfe3e7" roughness={0.75} />
            </mesh>
            {/* elbow + short vertical into wall */}
            <mesh position={[1.2, 0.18, dz]}>
              <cylinderGeometry args={[0.078, 0.078, 0.5, 14]} />
              <meshStandardMaterial color="#dfe3e7" roughness={0.75} />
            </mesh>
          </group>
        ))}
        {/* wall bracket */}
        <mesh position={[1.2, 0, 0]}>
          <boxGeometry args={[0.1, 0.46, 0.5]} />
          <meshStandardMaterial color={SCENE.navy700} metalness={0.4} roughness={0.5} />
        </mesh>
      </group>

      {/* condensate drain pipe to the pad */}
      <mesh position={[0.2, PAD_Y + 0.18, BODY_D / 2 - 0.2]}>
        <cylinderGeometry args={[0.03, 0.03, STAND_H + 0.3, 8]} />
        <meshStandardMaterial color={SCENE.slate} metalness={0.4} roughness={0.5} />
      </mesh>
    </group>
  );
}
