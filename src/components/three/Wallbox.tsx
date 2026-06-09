"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { SCENE } from "./palette";
import { emphasisWeight, smooth01 } from "./emphasis";

/**
 * A single slim wall-mounted EV wallbox (Chargemieter). A believable charger:
 *  - rounded-corner faceplate (bevelled box) in white/anthracite,
 *  - a glowing status LED strip down one side (the brand cue),
 *  - a small dark "screen" panel + charge icon,
 *  - a coiled cable on a side holster ending in a connector head.
 *
 * `status` tints the LED: charging (green pulse), ready (teal), idle (dim).
 * Faces +z (toward the garage camera). Mount it via the parent group's
 * position; this component is local-origin at the faceplate centre.
 */
export function Wallbox({
  status = "ready",
}: {
  status?: "charging" | "ready" | "idle";
}) {
  const ledRef = useRef<THREE.MeshBasicMaterial>(null);
  const screenRef = useRef<THREE.MeshStandardMaterial>(null);

  const ledColor =
    status === "charging" ? SCENE.green : status === "ready" ? SCENE.teal : SCENE.slate;

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const active = smooth01(emphasisWeight("wallbox", 1.0));
    if (ledRef.current) {
      const pulse =
        status === "charging" ? 0.55 + 0.45 * (0.5 + 0.5 * Math.sin(t * 3)) : 0.6;
      ledRef.current.opacity = (0.35 + active * 0.55) * pulse;
    }
    if (screenRef.current) screenRef.current.emissiveIntensity = 0.3 + active * 0.8;
  });

  return (
    <group>
      {/* back mounting plate */}
      <mesh position={[0, 0, -0.04]}>
        <boxGeometry args={[0.42, 0.66, 0.06]} />
        <meshStandardMaterial color={SCENE.navy800} roughness={0.7} metalness={0.2} />
      </mesh>
      {/* faceplate (rounded look via slim chamfer box) */}
      <mesh position={[0, 0, 0.02]} castShadow>
        <boxGeometry args={[0.38, 0.62, 0.1]} />
        <meshStandardMaterial color="#e9edf1" roughness={0.45} metalness={0.18} />
      </mesh>
      {/* anthracite inset face */}
      <mesh position={[0, 0.06, 0.075]}>
        <boxGeometry args={[0.3, 0.4, 0.02]} />
        <meshStandardMaterial color={SCENE.navy900} roughness={0.5} metalness={0.3} />
      </mesh>
      {/* glowing status LED strip (left edge) */}
      <mesh position={[-0.15, 0.04, 0.08]}>
        <boxGeometry args={[0.03, 0.46, 0.02]} />
        <meshBasicMaterial ref={ledRef} color={ledColor} transparent opacity={0.6} toneMapped={false} />
      </mesh>
      {/* small screen */}
      <mesh position={[0.03, 0.12, 0.085]}>
        <planeGeometry args={[0.18, 0.12]} />
        <meshStandardMaterial
          ref={screenRef}
          color="#0c1726"
          emissive={SCENE.teal}
          emissiveIntensity={0.3}
          roughness={0.25}
        />
      </mesh>
      {/* charge bolt glyph */}
      <mesh position={[0.03, 0.12, 0.092]}>
        <planeGeometry args={[0.05, 0.08]} />
        <meshBasicMaterial color={ledColor} transparent opacity={0.9} toneMapped={false} />
      </mesh>

      {/* coiled cable holster on the right + connector head */}
      <mesh position={[0.13, -0.16, 0.08]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.08, 0.022, 8, 24]} />
        <meshStandardMaterial color={SCENE.navy900} roughness={0.85} />
      </mesh>
      <mesh position={[0.13, -0.27, 0.08]}>
        <boxGeometry args={[0.07, 0.1, 0.06]} />
        <meshStandardMaterial color={SCENE.navy700} roughness={0.6} metalness={0.3} />
      </mesh>
    </group>
  );
}

/**
 * The Chargemieter scene: an underground PARKING GARAGE volume beneath the
 * tower with a wall of wallboxes, marked bays, a parked-car silhouette and a
 * column. Built as its OWN enclosed room (outward FrontSide walls) so the
 * interior camera that sits inside it never sees through to the void — same
 * trick as the tower interior chapters, but a separate sub-grade box.
 *
 * Local origin centred on the garage; placed in world by the parent.
 */
export function Garage({ pos = [0, -2.0, -1.2] as [number, number, number] }) {
  // Garage room extents.
  const RW = 8; // x
  const RH = 2.6; // y
  const RD = 6; // z
  const wallY = 0;
  const wallZ = -RD / 2; // back wall (wallboxes mount here, face +z)

  return (
    <group position={pos}>
      {/* ── room shell (FrontSide outward; camera inside sees inner faces) ── */}
      {/* back wall (wallbox wall) */}
      <mesh position={[0, wallY, wallZ]}>
        <boxGeometry args={[RW, RH, 0.3]} />
        <meshStandardMaterial color="#243247" roughness={0.92} side={THREE.FrontSide} />
      </mesh>
      {/* floor */}
      <mesh position={[0, -RH / 2, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[RW, RD]} />
        <meshStandardMaterial color="#1b2535" roughness={0.9} />
      </mesh>
      {/* ceiling */}
      <mesh position={[0, RH / 2, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[RW, RD]} />
        <meshStandardMaterial color={SCENE.navy900} roughness={0.95} side={THREE.FrontSide} />
      </mesh>
      {/* side walls */}
      <mesh position={[-RW / 2, 0, 0]}>
        <boxGeometry args={[0.3, RH, RD]} />
        <meshStandardMaterial color={SCENE.navy800} roughness={0.9} side={THREE.FrontSide} />
      </mesh>
      <mesh position={[RW / 2, 0, 0]}>
        <boxGeometry args={[0.3, RH, RD]} />
        <meshStandardMaterial color={SCENE.navy800} roughness={0.9} side={THREE.FrontSide} />
      </mesh>

      {/* structural column */}
      <mesh position={[2.4, 0, -0.4]}>
        <boxGeometry args={[0.45, RH, 0.45]} />
        <meshStandardMaterial color={SCENE.navy700} roughness={0.85} />
      </mesh>

      {/* ── wallbox row on the back wall (faces +z) ── */}
      {[
        { x: -2.2, status: "charging" as const },
        { x: -1.2, status: "ready" as const },
        { x: -0.2, status: "charging" as const },
        { x: 0.8, status: "idle" as const },
      ].map((b, i) => (
        <group key={i} position={[b.x, 0.35, wallZ + 0.2]}>
          <Wallbox status={b.status} />
        </group>
      ))}

      {/* painted bay lines + "E" markings on the floor */}
      {[-2.2, -1.2, -0.2, 0.8].map((x, i) => (
        <group key={`bay${i}`}>
          <mesh position={[x - 0.5, -RH / 2 + 0.01, 0.4]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.05, 2.4]} />
            <meshBasicMaterial color="#5b9bd5" toneMapped={false} />
          </mesh>
          <mesh position={[x, -RH / 2 + 0.01, 1.4]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.3, 0.3]} />
            <meshBasicMaterial color={SCENE.green} transparent opacity={0.5} toneMapped={false} />
          </mesh>
        </group>
      ))}
      {/* last bay right edge line */}
      <mesh position={[1.3, -RH / 2 + 0.01, 0.4]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.05, 2.4]} />
        <meshBasicMaterial color="#5b9bd5" toneMapped={false} />
      </mesh>

      {/* parked-car silhouette in a bay (low-poly hatchback) */}
      <CarSilhouette pos={[-1.2, -RH / 2 + 0.35, 0.9]} />

      {/* cool ceiling fixtures (light strips) */}
      {[-2, 0, 2].map((x, i) => (
        <mesh key={`lt${i}`} position={[x, RH / 2 - 0.06, 0.6]}>
          <boxGeometry args={[0.18, 0.04, 1.6]} />
          <meshBasicMaterial color="#cfe4ea" transparent opacity={0.85} toneMapped={false} />
        </mesh>
      ))}
      <pointLight position={[-0.4, RH / 2 - 0.3, 1.0]} intensity={4} color="#d4e6ec" distance={9} decay={2} />
      <pointLight position={[-1.2, 0.2, 1.4]} intensity={2.2} color={SCENE.aqua} distance={6} decay={2} />
    </group>
  );
}

/** A simple low-poly parked car silhouette for bay context. */
function CarSilhouette({ pos }: { pos: [number, number, number] }) {
  return (
    <group position={pos}>
      {/* body */}
      <mesh position={[0, 0.05, 0]}>
        <boxGeometry args={[0.9, 0.34, 1.9]} />
        <meshStandardMaterial color={SCENE.navy700} roughness={0.5} metalness={0.4} />
      </mesh>
      {/* cabin */}
      <mesh position={[0, 0.34, -0.05]}>
        <boxGeometry args={[0.8, 0.32, 1.0]} />
        <meshStandardMaterial color={SCENE.navy600} roughness={0.4} metalness={0.3} />
      </mesh>
      {/* glass hint */}
      <mesh position={[0, 0.34, 0.46]}>
        <planeGeometry args={[0.7, 0.26]} />
        <meshBasicMaterial color={SCENE.aqua} transparent opacity={0.25} toneMapped={false} />
      </mesh>
      {/* wheels */}
      {[
        [-0.46, -0.12, 0.6],
        [0.46, -0.12, 0.6],
        [-0.46, -0.12, -0.6],
        [0.46, -0.12, -0.6],
      ].map((p, i) => (
        <mesh key={i} position={p as [number, number, number]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.16, 0.16, 0.1, 16]} />
          <meshStandardMaterial color={SCENE.navy900} roughness={0.8} />
        </mesh>
      ))}
      {/* charge port glow on the near side */}
      <mesh position={[0.46, 0.08, 0.2]}>
        <circleGeometry args={[0.05, 16]} />
        <meshBasicMaterial color={SCENE.green} transparent opacity={0.7} toneMapped={false} />
      </mesh>
    </group>
  );
}

export default Wallbox;
