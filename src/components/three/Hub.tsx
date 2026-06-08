"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { SCENE } from "./palette";
import { emphasisWeight, smooth01 } from "./emphasis";

/**
 * POWERHOUSE Hub v1 — the recognizable hero device of the technical room.
 *
 * Stylised but faithful to the real product:
 *  - White rectangular wall-mounted enclosure
 *  - "POWERHOUSE 360" wordmark at the top
 *  - Black recessed display area in the centre
 *  - Large "HUB v1" lettering
 *  - Two round latches/locks on the right edge
 *  - Wall mount with cables/conduits, a small router/gateway beside it,
 *    and subtle status LEDs
 *
 * Mounted on the rear interior wall of the technical room (-z, ground-ish).
 */

// Local frame; the whole room group is positioned by TechRoom.
export default function Hub() {
  const ledRef = useRef<THREE.Group>(null);
  const displayMat = useRef<THREE.MeshStandardMaterial>(null);

  useFrame(({ clock }) => {
    const w = smooth01(emphasisWeight("hub", 1.0));
    const t = clock.elapsedTime;
    if (displayMat.current) {
      displayMat.current.emissiveIntensity = 0.2 + w * 0.9;
    }
    // status LEDs blink gently
    if (ledRef.current) {
      ledRef.current.children.forEach((c, i) => {
        const m = (c as THREE.Mesh).material as THREE.MeshBasicMaterial;
        const phase = Math.sin(t * (1.4 + i * 0.4) + i) * 0.5 + 0.5;
        m.opacity = 0.35 + phase * 0.65 * (0.5 + w * 0.5);
      });
    }
  });

  return (
    <group>
      {/* mounting backplate on wall */}
      <mesh position={[0, 0, -0.05]}>
        <boxGeometry args={[1.55, 2.05, 0.06]} />
        <meshStandardMaterial color={SCENE.slate} roughness={0.7} />
      </mesh>

      {/* white enclosure */}
      <mesh castShadow>
        <boxGeometry args={[1.4, 1.9, 0.22]} />
        <meshStandardMaterial color="#f3f5f7" roughness={0.45} metalness={0.05} />
      </mesh>

      {/* top brand bar */}
      <Text
        position={[-0.05, 0.74, 0.12]}
        fontSize={0.13}
        color={SCENE.navy800}
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.02}
        maxWidth={1.2}
      >
        POWERHOUSE 360
      </Text>
      {/* tiny stacked-mark hint left of wordmark */}
      <mesh position={[-0.58, 0.74, 0.12]}>
        <boxGeometry args={[0.1, 0.1, 0.02]} />
        <meshStandardMaterial color={SCENE.teal} emissive={SCENE.teal} emissiveIntensity={0.5} />
      </mesh>

      {/* black recessed display */}
      <mesh position={[-0.12, 0.18, 0.111]}>
        <boxGeometry args={[0.92, 0.74, 0.02]} />
        <meshStandardMaterial
          ref={displayMat}
          color="#05080d"
          emissive={SCENE.teal}
          emissiveIntensity={0.2}
          roughness={0.2}
          metalness={0.1}
        />
      </mesh>
      {/* faint display readout line */}
      <Text
        position={[-0.12, 0.32, 0.125]}
        fontSize={0.07}
        color={SCENE.aqua}
        anchorX="center"
        anchorY="middle"
      >
        SYSTEM · ONLINE
      </Text>
      <mesh position={[-0.12, 0.16, 0.124]}>
        <planeGeometry args={[0.7, 0.012]} />
        <meshBasicMaterial color={SCENE.teal} transparent opacity={0.6} />
      </mesh>
      <mesh position={[-0.12, 0.08, 0.124]}>
        <planeGeometry args={[0.5, 0.012]} />
        <meshBasicMaterial color={SCENE.green} transparent opacity={0.5} />
      </mesh>

      {/* large HUB v1 lettering */}
      <Text
        position={[-0.12, -0.52, 0.12]}
        fontSize={0.26}
        color={SCENE.navy800}
        anchorX="center"
        anchorY="middle"
        fontWeight={700}
        letterSpacing={0.01}
      >
        HUB v1
      </Text>

      {/* two round latches on the right edge */}
      {[0.42, -0.42].map((y, i) => (
        <group key={i} position={[0.56, y, 0.115]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.1, 0.1, 0.04, 24]} />
            <meshStandardMaterial color={SCENE.slateLight} metalness={0.6} roughness={0.35} />
          </mesh>
          <mesh position={[0, 0, 0.025]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.045, 0.045, 0.03, 16]} />
            <meshStandardMaterial color={SCENE.navy700} metalness={0.5} roughness={0.4} />
          </mesh>
        </group>
      ))}

      {/* status LEDs strip (bottom-left of enclosure) */}
      <group ref={ledRef} position={[-0.5, -0.78, 0.115]}>
        {[SCENE.green, SCENE.teal, SCENE.warm].map((col, i) => (
          <mesh key={i} position={[i * 0.12, 0, 0]}>
            <circleGeometry args={[0.025, 16]} />
            <meshBasicMaterial color={col} transparent opacity={0.6} toneMapped={false} />
          </mesh>
        ))}
      </group>

      {/* conduits / cables running down from the enclosure */}
      {[-0.35, 0, 0.3].map((x, i) => (
        <mesh key={i} position={[x, -1.4, -0.02]}>
          <cylinderGeometry args={[0.035, 0.035, 1.2, 8]} />
          <meshStandardMaterial color={SCENE.navy600} roughness={0.6} />
        </mesh>
      ))}
      {/* cable gland tray under hub */}
      <mesh position={[0, -1.02, 0.02]}>
        <boxGeometry args={[1.2, 0.12, 0.18]} />
        <meshStandardMaterial color={SCENE.navy700} roughness={0.7} />
      </mesh>

      {/* small router / gateway beside the hub (to the left) */}
      <group position={[-1.15, -0.3, 0.05]}>
        <mesh>
          <boxGeometry args={[0.5, 0.16, 0.34]} />
          <meshStandardMaterial color={SCENE.navy600} roughness={0.5} metalness={0.2} />
        </mesh>
        {/* antennas */}
        {[-0.12, 0.12].map((x, i) => (
          <mesh key={i} position={[x, 0.18, -0.1]} rotation={[0.2, 0, 0]}>
            <cylinderGeometry args={[0.012, 0.012, 0.3, 8]} />
            <meshStandardMaterial color={SCENE.navy800} />
          </mesh>
        ))}
        {/* router LEDs */}
        {[0, 1, 2].map((i) => (
          <mesh key={i} position={[-0.15 + i * 0.08, 0.02, 0.18]}>
            <circleGeometry args={[0.012, 12]} />
            <meshBasicMaterial color={SCENE.green} toneMapped={false} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
