"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { SCENE } from "./palette";
import { emphasisWeight, smooth01 } from "./emphasis";
import { BUILDING_DIMS } from "./Building";

/**
 * Rooftop PV array (Powermaker). A real, readable solar field on the roof:
 *  - large tilted modules with an aluminium frame and a deep-blue reflective
 *    glass face that catches the key light
 *  - an instanced cell grid (mullions) so each module reads as a real panel
 *  - mounting rails under each row + a cable tray running toward the tech room
 *  - parapet edge + a roof vent / skylight for context
 *
 * Glows a subtle brand-green only when the PV chapter is active. Built large
 * enough to clearly read "solar roof" from the steep top-down PV camera.
 */
const { WIDTH, DEPTH, ROOF_Y: ROOF_TOP } = BUILDING_DIMS;
// PV array sits on a raised plinth on the main roof, in the front (+z) half,
// clear of the setback penthouse (which sits center/back). z-shifted toward +z.
const ROOF_Y = ROOF_TOP + 0.55;
const ARRAY_Z = DEPTH / 2 - 1.4;

const ROWS = 4;
const COLS = 5;
const PANEL_W = 0.92; // along x
const PANEL_D = 0.82; // along the slope (z before tilt)
const GAP_X = 0.08;
const GAP_Z = 0.34;
const TILT = -0.34; // radians, faces +z / up toward camera

// cell grid per module
const CELL_COLS = 6;
const CELL_ROWS = 4;

export default function RoofPV() {
  const groupRef = useRef<THREE.Group>(null);
  const accentMat = useRef<THREE.MeshStandardMaterial>(null);

  // Shared materials (one instance, reused by every module) so the whole array
  // brightens together on the PV chapter and draw setup stays cheap.
  const glassMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(SCENE.navy700),
        emissive: new THREE.Color(SCENE.teal),
        emissiveIntensity: 0.22,
        metalness: 0.9,
        roughness: 0.12,
        envMapIntensity: 1.6, // catch the cool sky lightformer → real glass sheen
      }),
    []
  );
  const frameMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(SCENE.slateLight),
        metalness: 0.85,
        roughness: 0.35,
        envMapIntensity: 1.3,
      }),
    []
  );
  const mullionMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(SCENE.navy900),
        roughness: 0.7,
      }),
    []
  );

  // module placement
  const placements = useMemo(() => {
    const out: { x: number; z: number }[] = [];
    const startX = -((COLS - 1) * (PANEL_W + GAP_X)) / 2;
    const startZ = -((ROWS - 1) * (PANEL_D + GAP_Z)) / 2;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        out.push({
          x: startX + c * (PANEL_W + GAP_X),
          z: startZ + r * (PANEL_D + GAP_Z),
        });
      }
    }
    return out;
  }, []);

  useFrame(() => {
    const w = smooth01(emphasisWeight("pv", 1.1));
    glassMat.emissiveIntensity = 0.22 + w * 0.55;
    if (accentMat.current) {
      accentMat.current.emissiveIntensity = 0.1 + w * 1.6;
    }
    if (groupRef.current) {
      groupRef.current.position.set(0, ROOF_Y + w * 0.05, ARRAY_Z);
    }
  });

  // a single module, fully detailed
  const Module = ({ x, z }: { x: number; z: number }) => {
    const cellW = (PANEL_W - 0.1) / CELL_COLS;
    const cellD = (PANEL_D - 0.1) / CELL_ROWS;
    return (
      <group position={[x, 0, z]} rotation={[TILT, 0, 0]}>
        {/* aluminium frame (slightly larger, behind glass) */}
        <mesh position={[0, -0.012, 0]} material={frameMat}>
          <boxGeometry args={[PANEL_W, 0.05, PANEL_D]} />
        </mesh>
        {/* deep-blue reflective glass face */}
        <mesh position={[0, 0.02, 0]} material={glassMat}>
          <boxGeometry args={[PANEL_W - 0.06, 0.02, PANEL_D - 0.06]} />
        </mesh>
        {/* cell mullions — vertical */}
        {Array.from({ length: CELL_COLS - 1 }).map((_, i) => (
          <mesh
            key={`v${i}`}
            material={mullionMat}
            position={[-((PANEL_W - 0.1) / 2) + (i + 1) * cellW, 0.032, 0]}
          >
            <boxGeometry args={[0.012, 0.004, PANEL_D - 0.1]} />
          </mesh>
        ))}
        {/* cell mullions — horizontal */}
        {Array.from({ length: CELL_ROWS - 1 }).map((_, i) => (
          <mesh
            key={`h${i}`}
            material={mullionMat}
            position={[0, 0.032, -((PANEL_D - 0.1) / 2) + (i + 1) * cellD]}
          >
            <boxGeometry args={[PANEL_W - 0.1, 0.004, 0.012]} />
          </mesh>
        ))}
      </group>
    );
  };

  // mounting rails: one continuous rail per row, under the modules
  const startZ = -((ROWS - 1) * (PANEL_D + GAP_Z)) / 2;
  const railSpanX = COLS * (PANEL_W + GAP_X);

  return (
    <group ref={groupRef} position={[0, ROOF_Y, ARRAY_Z]}>
      {/* raised mounting plinth under the array */}
      <mesh position={[0, -0.42, 0]}>
        <boxGeometry args={[COLS * (PANEL_W + GAP_X) + 0.6, 0.34, ROWS * (PANEL_D + GAP_Z) + 0.5]} />
        <meshStandardMaterial color={SCENE.navy700} roughness={0.85} metalness={0.12} />
      </mesh>
      {/* modules */}
      {placements.map((p, i) => (
        <Module key={i} x={p.x} z={p.z} />
      ))}

      {/* mounting rails per row */}
      {Array.from({ length: ROWS }).map((_, r) => {
        const z = startZ + r * (PANEL_D + GAP_Z);
        return (
          <group key={`rail${r}`} position={[0, -0.16, z]}>
            <mesh position={[0, 0, -0.22]}>
              <boxGeometry args={[railSpanX, 0.05, 0.05]} />
              <meshStandardMaterial color={SCENE.slate} metalness={0.7} roughness={0.45} />
            </mesh>
            <mesh position={[0, 0, 0.22]}>
              <boxGeometry args={[railSpanX, 0.05, 0.05]} />
              <meshStandardMaterial color={SCENE.slate} metalness={0.7} roughness={0.45} />
            </mesh>
          </group>
        );
      })}

      {/* low front parapet edge in front of the array */}
      <mesh position={[0, -0.3, (ROWS * (PANEL_D + GAP_Z)) / 2 + 0.1]}>
        <boxGeometry args={[WIDTH - 0.4, 0.2, 0.1]} />
        <meshStandardMaterial color={SCENE.navy800} roughness={0.9} />
      </mesh>

      {/* roof vent / skylight cube beside the array */}
      <group position={[-WIDTH / 2 + 1.0, -0.28, (ROWS * (PANEL_D + GAP_Z)) / 2 + 0.2]}>
        <mesh>
          <boxGeometry args={[0.5, 0.32, 0.5]} />
          <meshStandardMaterial color={SCENE.navy700} roughness={0.8} metalness={0.2} />
        </mesh>
        <mesh position={[0, 0.2, 0]}>
          <boxGeometry args={[0.42, 0.06, 0.42]} />
          <meshStandardMaterial color={SCENE.slate} metalness={0.6} roughness={0.5} />
        </mesh>
      </group>

      {/* cable tray running from array toward the tech-room riser (-z), with a
          subtle green accent that lights on the PV chapter */}
      <mesh position={[-1.0, -0.32, -((ROWS * (PANEL_D + GAP_Z)) / 2) - 0.3]}>
        <boxGeometry args={[0.16, 0.08, 1.2]} />
        <meshStandardMaterial color={SCENE.navy700} metalness={0.4} roughness={0.6} />
      </mesh>
      <mesh position={[-1.0, -0.275, -((ROWS * (PANEL_D + GAP_Z)) / 2) - 0.3]}>
        <boxGeometry args={[0.06, 0.02, 1.1]} />
        <meshStandardMaterial
          ref={accentMat}
          color={SCENE.green}
          emissive={SCENE.green}
          emissiveIntensity={0.1}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}
