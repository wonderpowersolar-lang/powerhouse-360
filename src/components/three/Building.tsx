"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { SCENE } from "./palette";
import { emphasisWeight } from "./emphasis";

/**
 * The multi-family building (MFH).
 *
 * A clean architectural box-massing with stacked floors that echo the logo's
 * stacked-building mark. Windows are instanced for performance; a subset glow
 * warm (evening mood) via per-instance emissive color. A slim brand-teal band
 * separates the lower/upper massing, referencing the green→teal logo gradient.
 *
 * Footprint ~ 7 (x) by 5 (z), height ~ 12. Origin at ground centre.
 */

const FLOORS = 5;
const FLOOR_H = 2.05;
const WIDTH = 7;
const DEPTH = 5;
const COLS = 4; // windows per floor on the wide face
const DEPTH_COLS = 3; // windows on the side face

export default function Building() {
  const winRef = useRef<THREE.InstancedMesh>(null);
  const litFlags = useRef<number[]>([]);
  const baseColors = useRef<THREE.Color[]>([]);

  // Build window transforms once.
  const { matrices, lit } = useMemo(() => {
    const m: THREE.Matrix4[] = [];
    const litArr: number[] = [];
    const dummy = new THREE.Object3D();
    const winW = 0.62;
    const winH = 1.0;

    const place = (
      x: number,
      y: number,
      z: number,
      ry: number,
      isLit: boolean
    ) => {
      dummy.position.set(x, y, z);
      dummy.rotation.set(0, ry, 0);
      dummy.scale.set(winW, winH, 1);
      dummy.updateMatrix();
      m.push(dummy.matrix.clone());
      litArr.push(isLit ? 1 : 0);
    };

    // deterministic pseudo-random lit pattern (evening: ~55% windows lit)
    let seed = 7;
    const rng = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    for (let f = 0; f < FLOORS; f++) {
      const y = 1.1 + f * FLOOR_H;
      // front (+z) and back (-z)
      for (let c = 0; c < COLS; c++) {
        const x = -WIDTH / 2 + 1.1 + (c * (WIDTH - 2.2)) / (COLS - 1);
        place(x, y, DEPTH / 2 + 0.01, 0, rng() > 0.42);
        place(x, y, -DEPTH / 2 - 0.01, Math.PI, rng() > 0.5);
      }
      // sides (+x and -x)
      for (let c = 0; c < DEPTH_COLS; c++) {
        const z = -DEPTH / 2 + 1.0 + (c * (DEPTH - 2.0)) / (DEPTH_COLS - 1);
        place(WIDTH / 2 + 0.01, y, z, Math.PI / 2, rng() > 0.5);
        place(-WIDTH / 2 - 0.01, y, z, -Math.PI / 2, rng() > 0.55);
      }
    }
    return { matrices: m, lit: litArr };
  }, []);

  // Set matrices + initialise per-instance colors once the mesh exists.
  const onMesh = (mesh: THREE.InstancedMesh | null) => {
    if (!mesh) return;
    winRef.current = mesh;
    const warm = new THREE.Color(SCENE.warm);
    const cold = new THREE.Color(SCENE.navy600);
    const cols: THREE.Color[] = [];
    matrices.forEach((mat, i) => {
      mesh.setMatrixAt(i, mat);
      const base = (lit[i] ? warm : cold).clone();
      cols.push(base);
      mesh.setColorAt(i, base);
    });
    baseColors.current = cols;
    litFlags.current = lit;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  };

  // Gentle window flicker + slight brighten when building is emphasised.
  useFrame(({ clock }) => {
    const mesh = winRef.current;
    if (!mesh || !mesh.instanceColor) return;
    const t = clock.elapsedTime;
    const w = emphasisWeight("building", 1.4);
    const warm = new THREE.Color(SCENE.warm);
    const amber = new THREE.Color(SCENE.amber);
    const tmp = new THREE.Color();
    let dirty = false;
    for (let i = 0; i < litFlags.current.length; i++) {
      if (!litFlags.current[i]) continue;
      // subtle per-window breathing
      const flick = 0.82 + 0.18 * Math.sin(t * 0.7 + i * 1.3);
      tmp.copy(warm).lerp(amber, 0.15 + 0.1 * Math.sin(i)).multiplyScalar(
        flick * (0.9 + 0.25 * w)
      );
      mesh.setColorAt(i, tmp);
      dirty = true;
    }
    if (dirty && mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  return (
    <group>
      {/* Main massing — lower (slate-navy) and upper (slightly lighter) blocks */}
      <mesh position={[0, (FLOORS * FLOOR_H) / 2 + 0.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[WIDTH, FLOORS * FLOOR_H + 0.4, DEPTH]} />
        <meshStandardMaterial
          color={SCENE.navy700}
          roughness={0.78}
          metalness={0.12}
        />
      </mesh>

      {/* Slim brand band separating massing (logo green→teal language) */}
      <mesh position={[0, FLOOR_H * 1 + 0.15, 0]}>
        <boxGeometry args={[WIDTH + 0.06, 0.12, DEPTH + 0.06]} />
        <meshStandardMaterial
          color={SCENE.teal}
          emissive={SCENE.teal}
          emissiveIntensity={0.4}
          roughness={0.4}
        />
      </mesh>

      {/* Ground floor base / entrance plinth */}
      <mesh position={[0, 0.5, 0]} receiveShadow>
        <boxGeometry args={[WIDTH + 0.5, 1, DEPTH + 0.5]} />
        <meshStandardMaterial color={SCENE.navy800} roughness={0.85} />
      </mesh>

      {/* Entrance glow (warm) */}
      <mesh position={[0, 0.85, DEPTH / 2 + 0.28]}>
        <planeGeometry args={[1.6, 1.3]} />
        <meshBasicMaterial color={SCENE.warm} transparent opacity={0.5} />
      </mesh>

      {/* Roof slab (PV mounts on top of this) */}
      <mesh position={[0, FLOORS * FLOOR_H + 0.5, 0]} receiveShadow>
        <boxGeometry args={[WIDTH + 0.2, 0.3, DEPTH + 0.2]} />
        <meshStandardMaterial color={SCENE.navy800} roughness={0.9} />
      </mesh>

      {/* Roof parapet */}
      <mesh position={[0, FLOORS * FLOOR_H + 0.75, 0]}>
        <boxGeometry args={[WIDTH + 0.2, 0.18, DEPTH + 0.2]} />
        <meshStandardMaterial color={SCENE.navy700} roughness={0.85} />
      </mesh>

      {/* Windows (instanced, warm-emissive when lit) */}
      <instancedMesh
        ref={onMesh}
        args={[undefined, undefined, matrices.length]}
        frustumCulled={false}
      >
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
    </group>
  );
}

export const BUILDING_DIMS = { FLOORS, FLOOR_H, WIDTH, DEPTH };
