"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { SCENE } from "./palette";
import { emphasisWeight, smooth01 } from "./emphasis";
import { BUILDING_DIMS } from "./Building";

/**
 * Heatmieter — a MODERN anthracite monobloc air-to-water heat pump, rebuilt to
 * the client reference (REF-4):
 *
 *  - WIDE rectangular anthracite body with softly rounded edges (NOT white, NOT
 *    a round-fan front),
 *  - the LEFT ~2/3 of the front face is a full-height intake grille of fine
 *    HORIZONTAL black louvres — the fan sits hidden BEHIND the louvres and is
 *    only barely visible as a dark disc + slow blade hint,
 *  - the RIGHT ~1/3 is a smooth anthracite service panel with a thin vertical
 *    status strip and a small brand mark,
 *  - the body sits on TWO concrete block feet on a concrete pad with a pebble
 *    border and a small green lawn patch (REF-1: pad + lawn on the right plaza
 *    edge),
 *  - context: a dark wall-mounted downlight on the facade above casts a warm
 *    cone over the unit, a vertical-slat dark fence runs behind-right, a few
 *    ornamental grass tufts + a glowing bollard light sit nearby,
 *  - INSULATED flow/return pipes (lagged, grey) run from the unit into the
 *    building wall on a bracket, with a condensate drain.
 *
 * Sits on the +x (right) edge of the plaza per REF-1, so it reads in the hero
 * frame on a small pad with its own lawn patch, and the heatmieter chapter
 * camera (sections.ts) frames it three-quarter from the front-right.
 */
const { WIDTH } = BUILDING_DIMS;

// ── placement: right plaza edge, beside the +x facade ──────────────────────
const POS: [number, number, number] = [WIDTH / 2 + 1.7, 0, 1.5];

// ── body dimensions (wide monobloc; front face = +x) ───────────────────────
// Moodframe 03-heatpump-station.png: the unit is wider than tall at ~1.3–1.4,
// NOT a long slab — body resized to match.
const BODY_D = 0.74; // along x (depth of unit; front face at +x)
const BODY_H = 1.18; // height
const BODY_W = 1.62; // along z (width of unit) — W:H ≈ 1.37 per moodframe
const PAD_H = 0.1;
const FOOT_H = 0.22;
const BODY_CY = PAD_H + FOOT_H + BODY_H / 2; // ≈ 0.91
const FRONT_X = BODY_D / 2; // +0.37 local

// Louvre region (left ~2/3 of the front in the camera's view = larger z) and
// service panel (right ~1/3 = smaller z).
const LOUVRE_CZ = 0.26; // centre z of the louvre region
const LOUVRE_W = 1.0; // louvre span along z
const PANEL_CZ = -0.5; // centre z of the smooth service panel
const PANEL_W = 0.48;

const ANTHRACITE = "#2b3036";
const ANTHRACITE_DARK = "#23272c";
const ANTHRACITE_PANEL = "#363c43";
const CONCRETE = "#737a82";

export default function HeatPump() {
  const fanRef = useRef<THREE.Group>(null);
  const stripRef = useRef<THREE.MeshBasicMaterial>(null);
  const glowRef = useRef<THREE.MeshBasicMaterial>(null);
  const spotRef = useRef<THREE.SpotLight>(null);
  const spotTarget = useMemo(() => new THREE.Object3D(), []);

  useFrame((_, delta) => {
    const w = smooth01(emphasisWeight("heatpump", 1.0));
    // fan barely visible behind the louvres — slow idle, gentle ramp-up
    if (fanRef.current) fanRef.current.rotation.x += delta * (0.5 + w * 3.5);
    if (stripRef.current) stripRef.current.opacity = 0.3 + w * 0.65;
    if (glowRef.current) glowRef.current.opacity = 0.02 + w * 0.12;
    if (spotRef.current) spotRef.current.intensity = 2.2 + w * 7.5;
  });

  // pebble border — deterministic scatter around the pad perimeter
  const pebbles = useMemo(() => {
    let seed = 7;
    const rng = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
    const out: { x: number; z: number; r: number; c: string }[] = [];
    // light river pebbles per moodframe (warm grey-beige, not dark slate)
    const cols = ["#7d7e80", "#8e8a84", "#6a6c70", "#98948d"];
    // along the two long edges (±x of pad) and the two short edges (±z)
    for (let i = 0; i < 44; i++) {
      const t = rng();
      const edge = i % 4;
      const padX = 0.85;
      const padZ = 1.38;
      let x = 0;
      let z = 0;
      if (edge === 0) {
        x = padX + 0.08 + rng() * 0.1;
        z = -padZ + t * padZ * 2;
      } else if (edge === 1) {
        x = -padX - 0.08 - rng() * 0.1;
        z = -padZ + t * padZ * 2;
      } else if (edge === 2) {
        z = padZ + 0.08 + rng() * 0.1;
        x = -padX + t * padX * 2;
      } else {
        z = -padZ - 0.08 - rng() * 0.1;
        x = -padX + t * padX * 2;
      }
      out.push({ x, z, r: 0.035 + rng() * 0.045, c: cols[i % 4] });
    }
    return out;
  }, []);

  // FINE horizontal louvres (moodframe: dense, thin fins over ~2/3 of front)
  const louvres = useMemo(() => Array.from({ length: 22 }, (_, i) => i), []);

  return (
    <group position={POS}>
      {/* ── small green lawn patch under/around the pad (REF-1) ── */}
      <mesh position={[0.15, 0.018, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[2.7, 3.4]} />
        <meshStandardMaterial color="#23502f" roughness={1} />
      </mesh>

      {/* ── concrete pad ── */}
      <mesh position={[0, PAD_H / 2 + 0.01, 0]} receiveShadow castShadow>
        <boxGeometry args={[1.5, PAD_H, 2.5]} />
        <meshStandardMaterial color={CONCRETE} roughness={0.92} metalness={0.05} />
      </mesh>
      {/* pebble border */}
      {pebbles.map((p, i) => (
        <mesh key={`peb${i}`} position={[p.x, 0.035, p.z]}>
          <icosahedronGeometry args={[p.r, 0]} />
          <meshStandardMaterial color={p.c} roughness={0.95} flatShading />
        </mesh>
      ))}

      {/* ── TWO concrete block feet ── */}
      {[-0.5, 0.5].map((z, i) => (
        <mesh key={`foot${i}`} position={[0, PAD_H + FOOT_H / 2, z]} castShadow>
          <boxGeometry args={[0.55, FOOT_H, 0.3]} />
          <meshStandardMaterial color="#5d646c" roughness={0.9} metalness={0.05} />
        </mesh>
      ))}

      {/* ── WIDE anthracite body (rounded edges via slight bevel stack) ── */}
      <mesh position={[0, BODY_CY, 0]} castShadow receiveShadow>
        <boxGeometry args={[BODY_D, BODY_H, BODY_W]} />
        <meshStandardMaterial
          color={ANTHRACITE}
          roughness={0.5}
          metalness={0.25}
          envMapIntensity={0.8}
        />
      </mesh>
      {/* softly rounded top cap */}
      <mesh position={[0, BODY_CY + BODY_H / 2 + 0.018, 0]} castShadow>
        <boxGeometry args={[BODY_D - 0.06, 0.04, BODY_W - 0.06]} />
        <meshStandardMaterial color={ANTHRACITE_DARK} roughness={0.45} metalness={0.3} />
      </mesh>
      {/* subtle base trim */}
      <mesh position={[0, PAD_H + FOOT_H + 0.03, 0]}>
        <boxGeometry args={[BODY_D + 0.015, 0.06, BODY_W + 0.015]} />
        <meshStandardMaterial color="#1d2126" roughness={0.6} metalness={0.3} />
      </mesh>

      {/* ── FRONT (+x): louvre intake, left ~2/3 ── */}
      {/* dark recessed cavity behind the louvres */}
      <mesh position={[FRONT_X - 0.025, BODY_CY, LOUVRE_CZ]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[LOUVRE_W + 0.06, BODY_H - 0.12]} />
        <meshStandardMaterial color="#14171b" roughness={0.85} />
      </mesh>
      {/* fan hidden behind the louvres — barely visible dark disc + blade hint */}
      <group position={[FRONT_X - 0.02, BODY_CY, LOUVRE_CZ]}>
        <mesh rotation={[0, Math.PI / 2, 0]}>
          <circleGeometry args={[0.36, 28]} />
          <meshStandardMaterial color="#1a1e23" roughness={0.7} metalness={0.2} />
        </mesh>
        <group ref={fanRef} rotation={[0, 0, Math.PI / 2]}>
          {[0, 1, 2, 3].map((i) => (
            <mesh key={i} rotation={[(i * Math.PI) / 2, 0, 0]} position={[0, 0, 0]}>
              <boxGeometry args={[0.01, 0.09, 0.6]} />
              <meshStandardMaterial color="#262b31" roughness={0.55} metalness={0.3} />
            </mesh>
          ))}
        </group>
        {/* faint warm glow when the chapter is active */}
        <mesh position={[0.012, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <circleGeometry args={[0.34, 24]} />
          <meshBasicMaterial
            ref={glowRef}
            color={SCENE.warm}
            transparent
            opacity={0.02}
            toneMapped={false}
          />
        </mesh>
      </group>
      {/* fine HORIZONTAL louvres across the intake */}
      {louvres.map((i) => {
        const y = BODY_CY - (BODY_H - 0.2) / 2 + (i * (BODY_H - 0.2)) / 21;
        return (
          <mesh key={`lv${i}`} position={[FRONT_X + 0.012, y, LOUVRE_CZ]} rotation={[0, 0, -0.38]}>
            <boxGeometry args={[0.045, 0.015, LOUVRE_W]} />
            <meshStandardMaterial color={ANTHRACITE_DARK} roughness={0.55} metalness={0.25} />
          </mesh>
        );
      })}
      {/* slim frame around the louvre field */}
      {[
        [BODY_CY + (BODY_H - 0.12) / 2, 0.03, LOUVRE_W + 0.08],
        [BODY_CY - (BODY_H - 0.12) / 2, 0.03, LOUVRE_W + 0.08],
      ].map((p, i) => (
        <mesh key={`lf${i}`} position={[FRONT_X + 0.01, p[0], LOUVRE_CZ]}>
          <boxGeometry args={[0.03, p[1], p[2]]} />
          <meshStandardMaterial color={ANTHRACITE} roughness={0.5} metalness={0.25} />
        </mesh>
      ))}

      {/* ── FRONT (+x): smooth service panel, right ~1/3 ── */}
      <mesh position={[FRONT_X + 0.008, BODY_CY, PANEL_CZ]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[PANEL_W, BODY_H - 0.1]} />
        <meshStandardMaterial
          color={ANTHRACITE_PANEL}
          roughness={0.38}
          metalness={0.3}
          envMapIntensity={0.9}
        />
      </mesh>
      {/* thin HORIZONTAL status light strip near the panel top (moodframe:
          a discreet cool-white LED line, breathing — never neon) */}
      <mesh position={[FRONT_X + 0.014, BODY_CY + 0.3, PANEL_CZ]}>
        <boxGeometry args={[0.012, 0.016, PANEL_W * 0.72]} />
        <meshBasicMaterial
          ref={stripRef}
          color="#d9e9e6"
          transparent
          opacity={0.3}
          toneMapped={false}
        />
      </mesh>
      {/* small brand mark on the service panel */}
      <Text
        position={[FRONT_X + 0.014, BODY_CY - 0.4, PANEL_CZ]}
        rotation={[0, Math.PI / 2, 0]}
        fontSize={0.042}
        color="#8d97a1"
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.12}
      >
        HEATMIETER
      </Text>

      {/* side seam on the +z face (service panel split) */}
      <mesh position={[0, BODY_CY, BODY_W / 2 + 0.002]}>
        <boxGeometry args={[BODY_D - 0.08, 0.012, 0.006]} />
        <meshStandardMaterial color="#1d2126" roughness={0.6} />
      </mesh>

      {/* ── insulated flow/return pipes into the building wall (-x → facade) ── */}
      <group position={[-BODY_D / 2 - 0.02, PAD_H + FOOT_H + 0.18, -0.05]}>
        {[-0.14, 0.14].map((dz, i) => (
          <group key={i}>
            {/* horizontal lagged run toward the wall */}
            <mesh position={[-0.62, 0, dz]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.07, 0.07, 1.3, 14]} />
              <meshStandardMaterial color="#aeb4ba" roughness={0.8} />
            </mesh>
            {/* elbow + short vertical rise at the wall */}
            <mesh position={[-1.25, 0.21, dz]}>
              <cylinderGeometry args={[0.072, 0.072, 0.55, 14]} />
              <meshStandardMaterial color="#aeb4ba" roughness={0.8} />
            </mesh>
          </group>
        ))}
        {/* wall bracket */}
        <mesh position={[-1.25, 0.05, 0]}>
          <boxGeometry args={[0.1, 0.4, 0.46]} />
          <meshStandardMaterial color={SCENE.navy700} metalness={0.4} roughness={0.5} />
        </mesh>
      </group>
      {/* condensate drain to the pad */}
      <mesh position={[-0.15, PAD_H + 0.12, BODY_W / 2 - 0.25]}>
        <cylinderGeometry args={[0.025, 0.025, FOOT_H + 0.2, 8]} />
        <meshStandardMaterial color={SCENE.slate} metalness={0.4} roughness={0.5} />
      </mesh>

      {/* ── wall-mounted downlight on the facade, warm cone over the unit ── */}
      <group position={[-POS[0] + WIDTH / 2 + 0.12, 2.85, 0]}>
        {/* dark fixture body */}
        <mesh castShadow>
          <boxGeometry args={[0.16, 0.22, 0.12]} />
          <meshStandardMaterial color="#1d2126" roughness={0.5} metalness={0.4} />
        </mesh>
        {/* warm emitting underside */}
        <mesh position={[0.0, -0.115, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.13, 0.09]} />
          <meshBasicMaterial color={SCENE.warm} toneMapped={false} />
        </mesh>
      </group>
      <spotLight
        ref={spotRef}
        position={[-POS[0] + WIDTH / 2 + 0.35, 2.8, 0]}
        angle={0.62}
        penumbra={0.75}
        intensity={2.2}
        color="#f3bd78"
        distance={9}
        decay={1.6}
        target={spotTarget}
      />
      <primitive object={spotTarget} position={[0.3, 0, 0.6]} />
      {/* faked warm light cone ON the wall below the fixture (REF-4) — a flat
          additive circle-sector hugging the facade, apex at the downlight,
          fanning downward. Inner wedge adds a brighter core. */}
      {[
        { r: 2.1, spread: 0.5, o: 0.09 },
        { r: 1.3, spread: 0.34, o: 0.1 },
      ].map((c, i) => (
        <mesh
          key={`cone${i}`}
          position={[-POS[0] + WIDTH / 2 + 0.035 + i * 0.004, 2.72, 0]}
          rotation={[0, Math.PI / 2, 0]}
        >
          <circleGeometry
            args={[c.r, 14, -Math.PI / 2 - c.spread / 2, c.spread]}
          />
          <meshBasicMaterial
            color={SCENE.warm}
            transparent
            opacity={c.o}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            side={THREE.DoubleSide}
            toneMapped={false}
          />
        </mesh>
      ))}

      {/* ── vertical-slat WOOD fence behind-right (moodframe: warm brown
          timber slats catching the downlight, not anthracite) ── */}
      <group position={[-0.3, 0, -1.55]}>
        {Array.from({ length: 13 }).map((_, i) => (
          <mesh key={`sl${i}`} position={[-1.0 + i * 0.17, 0.62, 0]} castShadow>
            <boxGeometry args={[0.08, 1.24, 0.022]} />
            <meshStandardMaterial
              color={i % 2 ? "#4a3a28" : "#3e3022"}
              roughness={0.85}
              metalness={0.02}
            />
          </mesh>
        ))}
        {[0.28, 0.98].map((y, i) => (
          <mesh key={`rl${i}`} position={[0.02, y, -0.025]}>
            <boxGeometry args={[2.2, 0.05, 0.02]} />
            <meshStandardMaterial color="#332718" roughness={0.85} />
          </mesh>
        ))}
      </group>

      {/* ── ornamental grass tufts (moodframe: prominent tall grasses) ── */}
      {[
        { p: [-0.45, 0, 1.65] as [number, number, number], s: 1.2 },
        { p: [0.75, 0, -1.35], s: 1.0 },
        { p: [-1.05, 0, -0.9], s: 0.9 },
        { p: [0.15, 0, -1.7], s: 1.1 },
      ].map((g, gi) => (
        <group key={`gr${gi}`} position={g.p as [number, number, number]} scale={g.s}>
          {Array.from({ length: 7 }).map((_, i) => {
            const a = (i / 7) * Math.PI * 2;
            return (
              <mesh
                key={i}
                position={[Math.cos(a) * 0.06, 0.16, Math.sin(a) * 0.06]}
                rotation={[Math.cos(a) * 0.35, 0, Math.sin(a) * 0.35]}
              >
                <coneGeometry args={[0.022, 0.34 + (i % 3) * 0.09, 4]} />
                <meshStandardMaterial
                  color={i % 2 ? "#4c7040" : "#3d5c34"}
                  roughness={0.95}
                  flatShading
                />
              </mesh>
            );
          })}
        </group>
      ))}

      {/* ── glowing bollard light ── */}
      <group position={[0.85, 0, 2.1]}>
        <mesh position={[0, 0.26, 0]} castShadow>
          <cylinderGeometry args={[0.045, 0.05, 0.52, 10]} />
          <meshStandardMaterial color="#22262b" roughness={0.6} metalness={0.35} />
        </mesh>
        <mesh position={[0, 0.46, 0]}>
          <cylinderGeometry args={[0.047, 0.047, 0.06, 10]} />
          <meshBasicMaterial color={SCENE.warm} toneMapped={false} />
        </mesh>
        <pointLight position={[0, 0.5, 0]} intensity={0.9} color={SCENE.warm} distance={2.8} decay={2} />
      </group>
    </group>
  );
}
