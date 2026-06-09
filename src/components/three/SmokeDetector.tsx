"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { SCENE } from "./palette";
import { emphasisWeight, smooth01 } from "./emphasis";

/**
 * Smokemieter — a discreet round CEILING-MOUNTED smoke detector with a subtle
 * status LED. Believable optical detector: a shallow white disc base, a slightly
 * proud centre dome with vent slots around the rim, and a small green status LED
 * that breathes (heartbeat) — going brighter/steadier when the smoke chapter is
 * active. Mounts under the ceiling; local origin at the disc face, mounts
 * downward (−y) so place it just below a ceiling plane.
 */
export function SmokeDetector({
  status = "ok",
}: {
  status?: "ok" | "service";
}) {
  const ledRef = useRef<THREE.MeshBasicMaterial>(null);
  const ledColor = status === "service" ? SCENE.amber : SCENE.green;

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const w = smooth01(emphasisWeight("smoke", 1.0));
    if (ledRef.current) {
      // Heartbeat blink: a quick double-pulse every ~3s, lifted while active.
      const phase = (t % 3) / 3;
      const beat = phase < 0.06 || (phase > 0.12 && phase < 0.18) ? 1 : 0.18;
      ledRef.current.opacity = (0.3 + w * 0.6) * beat + 0.08;
    }
  });

  return (
    <group rotation={[Math.PI, 0, 0]}>
      {/* base disc (white) with a slate rim so it reads against a white ceiling */}
      <mesh castShadow>
        <cylinderGeometry args={[0.27, 0.28, 0.07, 40]} />
        <meshStandardMaterial color="#cfd6dd" roughness={0.5} metalness={0.1} />
      </mesh>
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.235, 0.235, 0.07, 40]} />
        <meshStandardMaterial color="#f4f7fa" roughness={0.45} />
      </mesh>
      {/* proud centre dome */}
      <mesh position={[0, 0.06, 0]}>
        <cylinderGeometry args={[0.15, 0.2, 0.08, 40]} />
        <meshStandardMaterial color="#e7ecf1" roughness={0.4} metalness={0.08} />
      </mesh>
      {/* vent slots around the rim */}
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i / 12) * Math.PI * 2;
        return (
          <mesh
            key={i}
            position={[Math.cos(a) * 0.21, 0.03, Math.sin(a) * 0.21]}
            rotation={[0, -a, 0]}
          >
            <boxGeometry args={[0.05, 0.03, 0.015]} />
            <meshStandardMaterial color={SCENE.slate} roughness={0.6} />
          </mesh>
        );
      })}
      {/* status LED (on the dome, pointing down) */}
      <mesh position={[0.07, 0.09, 0.0]}>
        <circleGeometry args={[0.018, 16]} />
        <meshBasicMaterial ref={ledRef} color={ledColor} transparent opacity={0.5} toneMapped={false} />
      </mesh>
      {/* test button hint */}
      <mesh position={[-0.05, 0.09, 0.03]}>
        <circleGeometry args={[0.03, 20]} />
        <meshStandardMaterial color="#dde2e7" roughness={0.6} />
      </mesh>
    </group>
  );
}

/**
 * The Smokemieter stairwell scene — an interior landing volume on a mid floor
 * with a ceiling-mounted detector as the hero, a half-flight of stairs + handrail
 * for context, a door, and a wall sign. Built as an enclosed room (FrontSide
 * outward walls) so the interior camera inside it stays clean. Centred so the
 * ceiling detector lands at the smoke camTarget (≈ 0,6.7,-2.4).
 */
export function Stairwell({ pos = [0, 6.4, -2.4] as [number, number, number] }) {
  const lightRef = useRef<THREE.PointLight>(null);
  useFrame(() => {
    const w = smooth01(emphasisWeight("smoke", 1.1));
    if (lightRef.current) lightRef.current.intensity = 2.2 + w * 5;
  });

  const RW = 4.6; // x
  const RH = 3.0; // y
  const RD = 3.4; // z
  const ceilY = RH / 2;

  return (
    <group position={pos}>
      {/* back wall */}
      <mesh position={[0, 0, -RD / 2]}>
        <boxGeometry args={[RW, RH, 0.2]} />
        <meshStandardMaterial color="#2a3a52" roughness={0.9} side={THREE.FrontSide} />
      </mesh>
      {/* ceiling (detector mounts just below) — kept a calm mid-slate so the
          white detector + aqua mount ring read clearly against it (white-on-
          white washed out before). */}
      <mesh position={[0, ceilY, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[RW, RD]} />
        <meshStandardMaterial color="#33445e" roughness={0.85} side={THREE.FrontSide} />
      </mesh>
      {/* floor / landing */}
      <mesh position={[0, -RH / 2, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[RW, RD]} />
        <meshStandardMaterial color="#26384f" roughness={0.85} />
      </mesh>
      {/* side walls */}
      <mesh position={[-RW / 2, 0, 0]}>
        <boxGeometry args={[0.2, RH, RD]} />
        <meshStandardMaterial color={SCENE.navy800} roughness={0.9} side={THREE.FrontSide} />
      </mesh>
      <mesh position={[RW / 2, 0, 0]}>
        <boxGeometry args={[0.2, RH, RD]} />
        <meshStandardMaterial color={SCENE.navy800} roughness={0.9} side={THREE.FrontSide} />
      </mesh>

      {/* ── ceiling-mounted detector (the hero), just below the ceiling ──
          Scaled up so the round detector reads clearly from the stairwell
          camera; a faint mounting ring grounds it to the ceiling. */}
      {/* mount ring flush on the ceiling, above the detector */}
      <mesh position={[0, ceilY - 0.02, 0.8]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.62, 0.74, 44]} />
        <meshBasicMaterial color={SCENE.aqua} transparent opacity={0.22} toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
      {/* short mount plate */}
      <mesh position={[0, ceilY - 0.12, 0.8]}>
        <cylinderGeometry args={[0.56, 0.56, 0.1, 36]} />
        <meshStandardMaterial color="#41526d" roughness={0.8} />
      </mesh>
      {/* the detector itself — hangs slightly proud of the ceiling, pulled toward
          the camera (local z +0.8 → closer) and scaled so it clearly reads. */}
      <group position={[0, ceilY - 0.34, 0.8]} scale={2.4}>
        <SmokeDetector status="ok" />
      </group>

      {/* half-flight of stairs (context) along the left, rising back */}
      {Array.from({ length: 6 }).map((_, i) => (
        <mesh
          key={i}
          position={[-1.4, -RH / 2 + 0.12 + i * 0.22, -0.4 - i * 0.28]}
        >
          <boxGeometry args={[1.4, 0.12, 0.34]} />
          <meshStandardMaterial color={SCENE.navy700} roughness={0.85} />
        </mesh>
      ))}
      {/* handrail */}
      <mesh position={[-0.7, -RH / 2 + 1.0, -1.0]} rotation={[0.5, 0, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 1.9, 10]} />
        <meshStandardMaterial color={SCENE.slateLight} metalness={0.6} roughness={0.4} />
      </mesh>

      {/* apartment door on the right wall */}
      <mesh position={[1.5, -RH / 2 + 1.05, 0.2]}>
        <boxGeometry args={[0.06, 2.1, 0.95]} />
        <meshStandardMaterial color={SCENE.navy700} roughness={0.6} metalness={0.15} />
      </mesh>
      <mesh position={[1.46, -RH / 2 + 1.05, 0.55]}>
        <sphereGeometry args={[0.04, 12, 12]} />
        <meshStandardMaterial color={SCENE.slateLight} metalness={0.7} roughness={0.3} />
      </mesh>

      {/* small wall-mounted exit/safety sign (green) */}
      <mesh position={[1.3, 0.6, -RD / 2 + 0.12]}>
        <planeGeometry args={[0.5, 0.2]} />
        <meshBasicMaterial color={SCENE.green} transparent opacity={0.7} toneMapped={false} />
      </mesh>

      {/* cool stairwell light */}
      <pointLight ref={lightRef} position={[0, ceilY - 0.5, 0.6]} intensity={2.2} color="#dCe8ee" distance={7} decay={2} />
      <pointLight position={[0.2, -0.4, 1.2]} intensity={0.9} color={SCENE.warm} distance={5} decay={2} />
    </group>
  );
}

export default SmokeDetector;
