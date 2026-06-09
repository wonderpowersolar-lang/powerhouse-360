"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { SCENE } from "./palette";
import { emphasisWeight, smooth01 } from "./emphasis";

/**
 * Meter cabinet / metering wall (Powermieter) — a real German Zählerschrank.
 *
 *  - steel cabinet body with a recessed inner back panel and a door frame
 *  - a DIN-rail row of digital meters, each with a large glowing readout +
 *    a small kWh value and a coloured status dot + a label below
 *  - a breaker row (MCBs) on a second rail beneath the meters
 *  - wiring gutter + cables down the side
 *
 * Positioned at world ≈ (1.6, 3.0, -2.5) to match the meters camera target.
 */
const POS: [number, number, number] = [1.6, 3.0, -2.5];

const METERS = [
  { label: "PV", value: "7.4 kW", color: SCENE.green },
  { label: "NETZ", value: "1.2 kW", color: SCENE.teal },
  { label: "WHG", value: "3.1 kW", color: SCENE.aqua },
  { label: "ALLG", value: "0.4 kW", color: SCENE.slateLight },
  { label: "WBOX", value: "11 kW", color: SCENE.warm },
];

const FRONT_Z = 0.18; // proud of the inner panel for readouts/text

export default function MeterCabinet() {
  const screensRef = useRef<THREE.Group>(null);
  const dotsRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const w = smooth01(emphasisWeight("meters", 1.0));
    const t = clock.elapsedTime;
    if (screensRef.current) {
      screensRef.current.children.forEach((c, i) => {
        const m = (c as THREE.Mesh).material as THREE.MeshStandardMaterial;
        const pulse = 0.5 + 0.5 * Math.sin(t * 1.0 + i * 0.7);
        // brighter base so readouts read even off-chapter; lift hard on chapter
        m.emissiveIntensity = 0.85 + w * (0.9 + pulse * 0.5);
      });
    }
    if (dotsRef.current) {
      dotsRef.current.children.forEach((c, i) => {
        const m = (c as THREE.Mesh).material as THREE.MeshBasicMaterial;
        const blink = 0.55 + 0.45 * Math.sin(t * (1.6 + i * 0.5) + i);
        m.opacity = 0.4 + blink * (0.3 + w * 0.3);
      });
    }
  });

  return (
    <group position={POS}>
      {/* steel cabinet body */}
      <mesh>
        <boxGeometry args={[2.9, 2.4, 0.3]} />
        <meshStandardMaterial color="#c7ced6" roughness={0.45} metalness={0.4} />
      </mesh>
      {/* door frame bezel (slightly proud, darker steel) */}
      <mesh position={[0, 0, 0.151]}>
        <boxGeometry args={[2.9, 2.4, 0.03]} />
        <meshStandardMaterial color="#9aa6b2" roughness={0.4} metalness={0.5} />
      </mesh>
      {/* recessed inner back panel (dark) */}
      <mesh position={[0, 0, 0.14]}>
        <boxGeometry args={[2.6, 2.1, 0.04]} />
        <meshStandardMaterial color={SCENE.navy900} roughness={0.7} />
      </mesh>
      {/* DIN rail behind the meters */}
      <mesh position={[0, 0.42, 0.155]}>
        <boxGeometry args={[2.5, 0.08, 0.03]} />
        <meshStandardMaterial color={SCENE.slateLight} metalness={0.7} roughness={0.4} />
      </mesh>
      {/* DIN rail behind breakers */}
      <mesh position={[0, -0.5, 0.155]}>
        <boxGeometry args={[2.5, 0.08, 0.03]} />
        <meshStandardMaterial color={SCENE.slateLight} metalness={0.7} roughness={0.4} />
      </mesh>

      {/* meter modules: white housing + large glowing readout each */}
      {METERS.map((m, i) => {
        const x = -1.0 + i * 0.5;
        return (
          <group key={i} position={[x, 0.42, 0]}>
            {/* white meter housing */}
            <mesh position={[0, 0, 0.16]}>
              <boxGeometry args={[0.42, 0.66, 0.12]} />
              <meshStandardMaterial color="#eef1f4" roughness={0.5} metalness={0.05} />
            </mesh>
          </group>
        );
      })}

      {/* readout screens (separate group so useFrame can pulse emissive) —
          enlarged + brighter so the kW values read clearly straight-on. */}
      <group ref={screensRef}>
        {METERS.map((m, i) => {
          const x = -1.0 + i * 0.5;
          return (
            <mesh key={i} position={[x, 0.52, FRONT_Z + 0.05]}>
              <boxGeometry args={[0.4, 0.27, 0.02]} />
              <meshStandardMaterial
                color="#04141d"
                emissive={m.color}
                emissiveIntensity={0.85}
                roughness={0.2}
                toneMapped={false}
              />
            </mesh>
          );
        })}
      </group>

      {/* readout values — larger, bright, on the lit screens */}
      {METERS.map((m, i) => {
        const x = -1.0 + i * 0.5;
        return (
          <Text
            key={`v${i}`}
            position={[x, 0.52, FRONT_Z + 0.066]}
            fontSize={0.1}
            color={SCENE.white}
            anchorX="center"
            anchorY="middle"
            fontWeight={700}
            outlineWidth={0.004}
            outlineColor={m.color}
          >
            {m.value}
          </Text>
        );
      })}

      {/* status dots */}
      <group ref={dotsRef}>
        {METERS.map((m, i) => {
          const x = -1.0 + i * 0.5;
          return (
            <mesh key={i} position={[x + 0.13, 0.3, FRONT_Z + 0.05]}>
              <circleGeometry args={[0.022, 16]} />
              <meshBasicMaterial color={m.color} transparent opacity={0.6} toneMapped={false} />
            </mesh>
          );
        })}
      </group>

      {/* meter labels */}
      {METERS.map((m, i) => {
        const x = -1.0 + i * 0.5;
        return (
          <Text
            key={`l${i}`}
            position={[x, 0.29, FRONT_Z + 0.05]}
            fontSize={0.085}
            color={SCENE.white}
            anchorX="center"
            anchorY="middle"
            letterSpacing={0.02}
            fontWeight={600}
          >
            {m.label}
          </Text>
        );
      })}

      {/* breaker row (MCB toggles) */}
      {Array.from({ length: 12 }).map((_, i) => {
        const x = -1.1 + i * 0.2;
        return (
          <group key={`b${i}`} position={[x, -0.5, FRONT_Z + 0.02]}>
            <mesh>
              <boxGeometry args={[0.14, 0.26, 0.08]} />
              <meshStandardMaterial color="#dfe4ea" roughness={0.5} />
            </mesh>
            {/* toggle */}
            <mesh position={[0, i % 3 === 0 ? 0.05 : -0.04, 0.05]}>
              <boxGeometry args={[0.06, 0.07, 0.04]} />
              <meshStandardMaterial color={i % 3 === 0 ? SCENE.navy700 : "#2a3340"} />
            </mesh>
          </group>
        );
      })}

      {/* wiring gutter on the right + a few cables */}
      <mesh position={[1.18, -0.05, FRONT_Z]}>
        <boxGeometry args={[0.16, 1.4, 0.1]} />
        <meshStandardMaterial color="#aeb6c0" roughness={0.5} metalness={0.3} />
      </mesh>
      {[-0.04, 0, 0.04].map((dx, i) => (
        <mesh key={`c${i}`} position={[1.18 + dx, -0.9, FRONT_Z]} rotation={[0, 0, 0]}>
          <cylinderGeometry args={[0.018, 0.018, 0.6, 8]} />
          <meshStandardMaterial
            color={[SCENE.green, SCENE.teal, SCENE.warm][i]}
            roughness={0.6}
          />
        </mesh>
      ))}

      {/* cabinet header label on the door frame */}
      <Text
        position={[0, 1.02, FRONT_Z]}
        fontSize={0.12}
        color={SCENE.navy800}
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.06}
        fontWeight={700}
      >
        ZÄHLERSCHRANK
      </Text>
      <Text
        position={[0, 0.86, FRONT_Z]}
        fontSize={0.07}
        color={SCENE.slate}
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.04}
      >
        POWERMIETER · MIETERSTROM
      </Text>
    </group>
  );
}
