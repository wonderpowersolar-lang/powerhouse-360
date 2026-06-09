"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { MeshReflectorMaterial } from "@react-three/drei";
import * as THREE from "three";
import { SCENE } from "./palette";
import { emphasisWeight } from "./emphasis";

/**
 * POWERHOUSE360 — the residential TOWER (REF-A).
 *
 * A premium, isometric-dusk multi-family tower: a SQUARE footprint, clearly
 * taller than wide. 7 occupied floors of dark anthracite concrete with vertical
 * pier columns at the corners and between window bays, full-height warm-lit glass
 * window walls per unit, CONTINUOUS balconies with slim glass railings wrapping
 * every floor, and a SETBACK PENTHOUSE on top with a roof terrace + greenery.
 * The main roof carries a raised plinth for the rooftop PV array (RoofPV.tsx).
 * The tower sits on an isometric PLAZA tile (paved plaza, two L-shaped corner
 * planting beds with a tree + shrubs + warm uplights, and a dark street with
 * lane markings wrapping the front).
 *
 * ── INTERIOR-CAMERA SAFETY (constraint 2) ──────────────────────────────────
 * The three interior chapters (hub / meters / residents) place the camera INSIDE
 * the solid tower box looking toward -z. That works because:
 *   • the main massing is a SOLID box whose outward faces back-face-cull from
 *     inside (the box uses default FrontSide),
 *   • every window plane is single-sided (FrontSide) facing OUTWARD,
 *   • there are NO interior floor slabs and NO DoubleSide materials inside the
 *     envelope.
 * All added detail (piers, balconies, railings, penthouse, plaza, entrance,
 * cornice) lives strictly OUTSIDE the envelope (on / beyond the ±x / ±z faces or
 * above the roof) so it can never occlude the interior cameras. The balcony
 * slabs sit just proud of each face and the railings face outward — none of them
 * intrude into the interior volume the cameras look through.
 *
 * Footprint 6 (x) × 6 (z). Origin at ground centre, plaza at y0.
 */

const FLOORS = 7; // occupied floors below the penthouse
const FLOOR_H = 2.0;
const WIDTH = 6; // x: -3 .. 3
const DEPTH = 6; // z: -3 .. 3
const GROUND_H = 1.6; // taller glazed ground floor / lobby
const COLS = 3; // window bays per floor on each face
const PH_INSET = 1.15; // penthouse setback from each edge

// Derived heights
const BODY_BASE = 0; // tower base sits on plaza
const BODY_TOP = GROUND_H + FLOORS * FLOOR_H; // top of occupied massing
const PH_H = 2.2; // penthouse height
const ROOF_Y = BODY_TOP; // main roof slab top (where PV plinth + terrace sit)

const WIN_W = 1.05;
const WIN_H = 1.45;

export default function Building() {
  const winRef = useRef<THREE.InstancedMesh>(null);
  const litFlags = useRef<number[]>([]);

  // ── Window + frame + sill instanced transforms (built once) ──────────────
  const { winMatrices, lit, frameMatrices, sillMatrices } = useMemo(() => {
    const wm: THREE.Matrix4[] = [];
    const fm: THREE.Matrix4[] = [];
    const sm: THREE.Matrix4[] = [];
    const litArr: number[] = [];
    const dummy = new THREE.Object3D();

    const place = (x: number, y: number, z: number, ry: number, isLit: boolean) => {
      // glass plane (warm interior when lit)
      dummy.position.set(x, y, z);
      dummy.rotation.set(0, ry, 0);
      dummy.scale.set(WIN_W, WIN_H, 1);
      dummy.updateMatrix();
      wm.push(dummy.matrix.clone());
      litArr.push(isLit ? 1 : 0);

      // recessed dark frame just behind the glass
      dummy.scale.set(WIN_W + 0.16, WIN_H + 0.16, 1);
      dummy.position.set(x - Math.sin(ry) * 0.02, y, z - Math.cos(ry) * 0.02);
      dummy.updateMatrix();
      fm.push(dummy.matrix.clone());

      // slim sill, proud of the facade
      dummy.scale.set(WIN_W + 0.2, 0.08, 1);
      dummy.position.set(
        x + Math.sin(ry) * 0.04,
        y - WIN_H / 2 - 0.1,
        z + Math.cos(ry) * 0.04
      );
      dummy.updateMatrix();
      sm.push(dummy.matrix.clone());
    };

    let seed = 11;
    const rng = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    const bayX = (c: number) =>
      -WIDTH / 2 + (WIDTH / (COLS + 1)) * (c + 1);
    const bayZ = (c: number) =>
      -DEPTH / 2 + (DEPTH / (COLS + 1)) * (c + 1);

    for (let f = 0; f < FLOORS; f++) {
      const y = GROUND_H + f * FLOOR_H + FLOOR_H * 0.5 - 0.1;
      for (let c = 0; c < COLS; c++) {
        // +z and -z faces
        place(bayX(c), y, DEPTH / 2 + 0.02, 0, rng() > 0.38);
        place(bayX(c), y, -DEPTH / 2 - 0.02, Math.PI, rng() > 0.46);
        // +x and -x faces
        place(WIDTH / 2 + 0.02, y, bayZ(c), Math.PI / 2, rng() > 0.44);
        place(-WIDTH / 2 - 0.02, y, bayZ(c), -Math.PI / 2, rng() > 0.5);
      }
    }
    return { winMatrices: wm, lit: litArr, frameMatrices: fm, sillMatrices: sm };
  }, []);

  // Set window matrices + per-instance colours once the mesh exists.
  const onWinMesh = (mesh: THREE.InstancedMesh | null) => {
    if (!mesh) return;
    winRef.current = mesh;
    const warm = new THREE.Color(SCENE.warm);
    const cold = new THREE.Color(SCENE.navy600);
    winMatrices.forEach((mat, i) => {
      mesh.setMatrixAt(i, mat);
      mesh.setColorAt(i, (lit[i] ? warm : cold).clone());
    });
    litFlags.current = lit;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  };
  const onFrameMesh = (mesh: THREE.InstancedMesh | null) => {
    if (!mesh) return;
    frameMatrices.forEach((m, i) => mesh.setMatrixAt(i, m));
    mesh.instanceMatrix.needsUpdate = true;
  };
  const onSillMesh = (mesh: THREE.InstancedMesh | null) => {
    if (!mesh) return;
    sillMatrices.forEach((m, i) => mesh.setMatrixAt(i, m));
    mesh.instanceMatrix.needsUpdate = true;
  };

  // Gentle window flicker + slight brighten when the building is emphasised.
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
      const flick = 0.82 + 0.18 * Math.sin(t * 0.7 + i * 1.3);
      tmp
        .copy(warm)
        .lerp(amber, 0.12 + 0.1 * Math.sin(i))
        .multiplyScalar(flick * (0.9 + 0.25 * w));
      mesh.setColorAt(i, tmp);
      dirty = true;
    }
    if (dirty && mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  // ── Vertical pier columns (corners + between bays), exterior only ────────
  // pier x positions: corners and between each bay
  const pierXs = useMemo(() => {
    const out = [-WIDTH / 2, WIDTH / 2];
    for (let i = 1; i <= COLS; i++) {
      out.push(-WIDTH / 2 + (WIDTH / (COLS + 1)) * i);
    }
    return out;
  }, []);
  const pierZs = useMemo(() => {
    const out = [-DEPTH / 2, DEPTH / 2];
    for (let i = 1; i <= COLS; i++) {
      out.push(-DEPTH / 2 + (DEPTH / (COLS + 1)) * i);
    }
    return out;
  }, []);

  const pierH = BODY_TOP - GROUND_H + 0.2;
  const pierMidY = GROUND_H + (BODY_TOP - GROUND_H) / 2;

  // ── Continuous balcony bands per floor (exterior, wrap front + sides) ─────
  // A balcony band = thin slab + slim glass rail along the +z, +x and -x faces
  // of each upper floor. Kept OUTSIDE the envelope so interior cams stay clear.
  const balconyFloors = useMemo(
    () => Array.from({ length: FLOORS - 1 }, (_, i) => i + 1),
    []
  );

  return (
    <group>
      {/* ───────────────── MAIN MASSING ───────────────── */}
      {/* glazed ground floor / lobby plinth (slightly inset, darker) */}
      <mesh position={[0, GROUND_H / 2, 0]} receiveShadow>
        <boxGeometry args={[WIDTH + 0.02, GROUND_H, DEPTH + 0.02]} />
        <meshStandardMaterial
          color={SCENE.navy900}
          roughness={0.78}
          metalness={0.14}
          envMapIntensity={0.7}
        />
      </mesh>
      {/* main tower body (anthracite concrete). Slightly lower roughness + a
          modest envMapIntensity so the cool sky lightformer grazes the facade
          and gives the concrete believable, non-flat falloff. */}
      <mesh position={[0, GROUND_H + (BODY_TOP - GROUND_H) / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[WIDTH, BODY_TOP - GROUND_H, DEPTH]} />
        <meshStandardMaterial
          color={SCENE.navy800}
          roughness={0.72}
          metalness={0.16}
          envMapIntensity={0.85}
        />
      </mesh>

      {/* vertical pier columns on the front/back faces (along x) */}
      {pierXs.map((x, i) => (
        <group key={`pierx${i}`}>
          <mesh position={[x, pierMidY, DEPTH / 2 + 0.05]}>
            <boxGeometry args={[0.26, pierH, 0.12]} />
            <meshStandardMaterial color={SCENE.navy700} roughness={0.72} metalness={0.15} />
          </mesh>
          <mesh position={[x, pierMidY, -DEPTH / 2 - 0.05]}>
            <boxGeometry args={[0.26, pierH, 0.12]} />
            <meshStandardMaterial color={SCENE.navy700} roughness={0.72} metalness={0.15} />
          </mesh>
        </group>
      ))}
      {/* vertical pier columns on the side faces (along z) */}
      {pierZs.map((z, i) => (
        <group key={`pierz${i}`}>
          <mesh position={[WIDTH / 2 + 0.05, pierMidY, z]}>
            <boxGeometry args={[0.12, pierH, 0.26]} />
            <meshStandardMaterial color={SCENE.navy700} roughness={0.72} metalness={0.15} />
          </mesh>
          <mesh position={[-WIDTH / 2 - 0.05, pierMidY, z]}>
            <boxGeometry args={[0.12, pierH, 0.26]} />
            <meshStandardMaterial color={SCENE.navy700} roughness={0.72} metalness={0.15} />
          </mesh>
        </group>
      ))}

      {/* ground-floor lobby glow band (warm), front face */}
      <mesh position={[0, GROUND_H * 0.55, DEPTH / 2 + 0.03]}>
        <planeGeometry args={[WIDTH - 1.0, GROUND_H * 0.7]} />
        <meshBasicMaterial color={SCENE.warm} transparent opacity={0.28} toneMapped={false} />
      </mesh>

      {/* ───────────────── ENTRANCE (front, exterior) ───────────────── */}
      <group position={[0, 0, DEPTH / 2]}>
        <mesh position={[0, GROUND_H * 0.5, 0.16]}>
          <boxGeometry args={[2.0, GROUND_H * 0.92, 0.12]} />
          <meshStandardMaterial color={SCENE.navy700} roughness={0.55} metalness={0.2} />
        </mesh>
        <mesh position={[0, GROUND_H * 0.5, 0.23]}>
          <planeGeometry args={[1.7, GROUND_H * 0.8]} />
          <meshBasicMaterial color={SCENE.warm} transparent opacity={0.6} toneMapped={false} />
        </mesh>
        <mesh position={[0, GROUND_H * 0.5, 0.235]}>
          <boxGeometry args={[0.04, GROUND_H * 0.8, 0.02]} />
          <meshStandardMaterial color={SCENE.navy800} />
        </mesh>
        {/* slim canopy */}
        <mesh position={[0, GROUND_H + 0.05, 0.5]}>
          <boxGeometry args={[2.5, 0.1, 0.8]} />
          <meshStandardMaterial color={SCENE.navy600} roughness={0.6} metalness={0.25} />
        </mesh>
        <mesh position={[0, GROUND_H - 0.01, 0.62]}>
          <boxGeometry args={[2.1, 0.02, 0.04]} />
          <meshBasicMaterial color={SCENE.aqua} transparent opacity={0.5} toneMapped={false} />
        </mesh>
      </group>

      {/* ───────────────── CONTINUOUS BALCONY BANDS ───────────────── */}
      {balconyFloors.map((f) => {
        const y = GROUND_H + f * FLOOR_H - 0.18;
        return (
          <group key={`balc${f}`}>
            {/* front (+z) */}
            <BalconyBand axis="z" sign={1} y={y} span={WIDTH} />
            {/* sides */}
            <BalconyBand axis="x" sign={1} y={y} span={DEPTH} />
            <BalconyBand axis="x" sign={-1} y={y} span={DEPTH} />
          </group>
        );
      })}

      {/* ───────────────── ROOF: slab, cornice, parapet ───────────────── */}
      <mesh position={[0, ROOF_Y + 0.12, 0]} receiveShadow>
        <boxGeometry args={[WIDTH + 0.2, 0.24, DEPTH + 0.2]} />
        <meshStandardMaterial color={SCENE.navy800} roughness={0.9} />
      </mesh>
      <mesh position={[0, ROOF_Y + 0.26, 0]}>
        <boxGeometry args={[WIDTH + 0.4, 0.1, DEPTH + 0.4]} />
        <meshStandardMaterial color={SCENE.navy700} roughness={0.8} metalness={0.15} />
      </mesh>
      <mesh position={[0, ROOF_Y + 0.4, 0]}>
        <boxGeometry args={[WIDTH + 0.1, 0.18, DEPTH + 0.1]} />
        <meshStandardMaterial color={SCENE.navy600} roughness={0.85} />
      </mesh>

      {/* ───────────────── SETBACK PENTHOUSE + ROOF TERRACE ───────────────── */}
      <group position={[0, ROOF_Y + 0.5, 0]}>
        {/* penthouse volume (inset on +z/+x so a terrace wraps the front corner) */}
        <mesh
          position={[PH_INSET * 0.4, PH_H / 2, -PH_INSET * 0.4]}
          castShadow
        >
          <boxGeometry args={[WIDTH - PH_INSET * 1.4, PH_H, DEPTH - PH_INSET * 1.4]} />
          <meshStandardMaterial color={SCENE.navy700} roughness={0.72} metalness={0.14} />
        </mesh>
        {/* penthouse glass wall (warm, faces +z toward the terrace/front) */}
        <mesh
          position={[
            PH_INSET * 0.4,
            PH_H * 0.5,
            -PH_INSET * 0.4 + (DEPTH - PH_INSET * 1.4) / 2 + 0.02,
          ]}
        >
          <planeGeometry args={[(WIDTH - PH_INSET * 1.4) * 0.82, PH_H * 0.7]} />
          <meshBasicMaterial color={SCENE.warm} transparent opacity={0.42} toneMapped={false} />
        </mesh>
        {/* penthouse roof cap */}
        <mesh position={[PH_INSET * 0.4, PH_H + 0.06, -PH_INSET * 0.4]}>
          <boxGeometry args={[WIDTH - PH_INSET * 1.2, 0.12, DEPTH - PH_INSET * 1.2]} />
          <meshStandardMaterial color={SCENE.navy800} roughness={0.85} metalness={0.1} />
        </mesh>

        {/* terrace deck (paved) in front of the penthouse */}
        <mesh position={[0, 0.02, (DEPTH - PH_INSET) / 2 - 0.6]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[WIDTH - 0.6, PH_INSET + 0.6]} />
          <meshStandardMaterial color={SCENE.navy600} roughness={0.85} />
        </mesh>
        {/* terrace glass railing (front edge) */}
        <mesh position={[0, 0.45, DEPTH / 2 - 0.55]}>
          <boxGeometry args={[WIDTH - 0.4, 0.85, 0.04]} />
          <meshStandardMaterial color={SCENE.aqua} transparent opacity={0.18} roughness={0.2} metalness={0.4} />
        </mesh>
        <mesh position={[0, 0.9, DEPTH / 2 - 0.55]}>
          <boxGeometry args={[WIDTH - 0.36, 0.05, 0.06]} />
          <meshStandardMaterial color={SCENE.slateLight} metalness={0.6} roughness={0.4} />
        </mesh>
        {/* perimeter planters with greenery + warm uplight */}
        {[-WIDTH / 2 + 0.8, 0, WIDTH / 2 - 0.8].map((x, i) => (
          <group key={`pl${i}`} position={[x, 0.12, DEPTH / 2 - 0.85]}>
            <mesh>
              <boxGeometry args={[1.1, 0.24, 0.4]} />
              <meshStandardMaterial color={SCENE.navy800} roughness={0.9} />
            </mesh>
            {/* faceted hedge volume + clustered shrubs on top */}
            <mesh position={[0, 0.3, 0]}>
              <boxGeometry args={[0.95, 0.4, 0.32]} />
              <meshStandardMaterial color="#2f7d4a" roughness={0.92} flatShading />
            </mesh>
            <Shrub x={-0.28} z={0} scale={0.7} />
            <Shrub x={0.28} z={0} scale={0.62} />
          </group>
        ))}
      </group>

      {/* ───────────────── PLAZA + LANDSCAPE ───────────────── */}
      <Plaza />

      {/* ───────────────── INSTANCED GLASS / FRAMES / SILLS ───────────────── */}
      {/* recessed window frames (single-sided, facing outward) */}
      <instancedMesh
        ref={onFrameMesh}
        args={[undefined, undefined, frameMatrices.length]}
        frustumCulled={false}
      >
        <planeGeometry args={[1, 1]} />
        <meshStandardMaterial color={SCENE.navy900} roughness={0.6} side={THREE.FrontSide} />
      </instancedMesh>
      {/* window sills */}
      <instancedMesh
        ref={onSillMesh}
        args={[undefined, undefined, sillMatrices.length]}
        frustumCulled={false}
      >
        <planeGeometry args={[1, 1]} />
        <meshStandardMaterial color={SCENE.slate} roughness={0.55} metalness={0.2} side={THREE.FrontSide} />
      </instancedMesh>
      {/* glass (warm-emissive when lit, single-sided outward) */}
      <instancedMesh
        ref={onWinMesh}
        args={[undefined, undefined, winMatrices.length]}
        frustumCulled={false}
      >
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial toneMapped={false} side={THREE.FrontSide} />
      </instancedMesh>
    </group>
  );
}

/**
 * A continuous balcony band on one face of one floor: thin slab proud of the
 * facade + a slim translucent glass rail + a top handrail. Exterior-only, never
 * intrudes into the interior volume.
 */
function BalconyBand({
  axis,
  sign,
  y,
  span,
}: {
  axis: "x" | "z";
  sign: 1 | -1;
  y: number;
  span: number;
}) {
  const faceOffset = (axis === "z" ? DEPTH : WIDTH) / 2 + 0.02;
  const depth = 0.55; // how far the balcony juts out
  const railH = 0.62;

  if (axis === "z") {
    const z = sign * faceOffset;
    return (
      <group position={[0, y, z + sign * depth * 0.5]}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[span - 0.1, 0.08, depth]} />
          <meshStandardMaterial color={SCENE.navy600} roughness={0.7} metalness={0.15} />
        </mesh>
        <mesh position={[0, railH / 2 + 0.04, sign * depth * 0.5]}>
          <boxGeometry args={[span - 0.1, railH, 0.03]} />
          <meshStandardMaterial color={SCENE.aqua} transparent opacity={0.16} roughness={0.2} metalness={0.4} />
        </mesh>
        <mesh position={[0, railH + 0.06, sign * depth * 0.5]}>
          <boxGeometry args={[span - 0.06, 0.04, 0.05]} />
          <meshStandardMaterial color={SCENE.slateLight} metalness={0.6} roughness={0.4} />
        </mesh>
      </group>
    );
  }
  const x = sign * faceOffset;
  return (
    <group position={[x + sign * depth * 0.5, y, 0]}>
      <mesh>
        <boxGeometry args={[depth, 0.08, span - 0.1]} />
        <meshStandardMaterial color={SCENE.navy600} roughness={0.7} metalness={0.15} />
      </mesh>
      <mesh position={[sign * depth * 0.5, railH / 2 + 0.04, 0]}>
        <boxGeometry args={[0.03, railH, span - 0.1]} />
        <meshStandardMaterial color={SCENE.aqua} transparent opacity={0.16} roughness={0.2} metalness={0.4} />
      </mesh>
      <mesh position={[sign * depth * 0.5, railH + 0.06, 0]}>
        <boxGeometry args={[0.05, 0.04, span - 0.06]} />
        <meshStandardMaterial color={SCENE.slateLight} metalness={0.6} roughness={0.4} />
      </mesh>
    </group>
  );
}

/**
 * Isometric plaza tile under the tower: light paved plaza + perimeter, two
 * L-shaped landscaped planting beds at the front corners (tree + shrubs + warm
 * ground uplights), and a dark asphalt street with lane markings wrapping the
 * front (+z). All flat / low geometry on the ground plane — never near the cams.
 */
/**
 * A stylised low-poly plaza tree. Two species, chosen by `kind`:
 *  - "conifer": tapered trunk + three stacked cones (spruce silhouette).
 *  - "deciduous": short trunk + a faceted layered canopy (3 offset icosahedra)
 *    that reads as a rounded crown without the obvious "green ball" look.
 * Foliage uses flat-shaded low-poly geometry + two greens for depth, plus a
 * faint emissive so the canopy still reads in the dark evening scene.
 * Module-scope so geometry isn't re-created each render.
 */
function Tree({
  x,
  z,
  kind = "deciduous",
  scale = 1,
  rot = 0,
}: {
  x: number;
  z: number;
  kind?: "conifer" | "deciduous";
  scale?: number;
  rot?: number;
}) {
  const dark = "#2f7d4a";
  const lit = "#46a35e";
  return (
    <group position={[x, 0, z]} scale={scale} rotation={[0, rot, 0]}>
      {kind === "conifer" ? (
        <>
          {/* trunk */}
          <mesh position={[0, 0.45, 0]} castShadow>
            <cylinderGeometry args={[0.07, 0.12, 0.9, 6]} />
            <meshStandardMaterial color="#3a2f26" roughness={0.95} />
          </mesh>
          {/* three stacked cones, narrowing upward */}
          {[
            { y: 1.15, r: 0.72, h: 1.0, c: dark },
            { y: 1.78, r: 0.56, h: 0.92, c: lit },
            { y: 2.38, r: 0.36, h: 0.8, c: dark },
          ].map((c, i) => (
            <mesh key={i} position={[0, c.y, 0]} castShadow>
              <coneGeometry args={[c.r, c.h, 7]} />
              <meshStandardMaterial
                color={c.c}
                roughness={0.85}
                flatShading
                emissive={SCENE.green}
                emissiveIntensity={0.06}
              />
            </mesh>
          ))}
        </>
      ) : (
        <>
          {/* short trunk */}
          <mesh position={[0, 0.55, 0]} castShadow>
            <cylinderGeometry args={[0.1, 0.14, 1.1, 6]} />
            <meshStandardMaterial color="#3a2f26" roughness={0.95} />
          </mesh>
          {/* faceted layered crown — three offset icosahedra (detail 0 = low poly) */}
          {[
            { p: [0, 1.55, 0] as [number, number, number], r: 0.72, c: dark },
            { p: [0.34, 1.82, 0.18], r: 0.5, c: lit },
            { p: [-0.3, 1.78, -0.16], r: 0.46, c: lit },
            { p: [0.05, 2.12, 0.0], r: 0.38, c: dark },
          ].map((c, i) => (
            <mesh key={i} position={c.p as [number, number, number]} castShadow>
              <icosahedronGeometry args={[c.r, 0]} />
              <meshStandardMaterial
                color={c.c}
                roughness={0.82}
                flatShading
                emissive={SCENE.green}
                emissiveIntensity={0.06}
              />
            </mesh>
          ))}
        </>
      )}
    </group>
  );
}

/** A clustered low-poly shrub (2–3 faceted lumps) for planter fills. */
function Shrub({
  x = 0,
  z = 0,
  scale = 1,
}: {
  x?: number;
  z?: number;
  scale?: number;
}) {
  return (
    <group position={[x, 0, z]} scale={scale}>
      {[
        { p: [0, 0.16, 0] as [number, number, number], r: 0.26, c: "#3a8b52" },
        { p: [0.22, 0.12, 0.08], r: 0.19, c: "#46a35e" },
        { p: [-0.2, 0.13, -0.06], r: 0.2, c: "#2f7d4a" },
      ].map((c, i) => (
        <mesh key={i} position={c.p as [number, number, number]}>
          <icosahedronGeometry args={[c.r, 0]} />
          <meshStandardMaterial
            color={c.c}
            roughness={0.85}
            flatShading
            emissive={SCENE.green}
            emissiveIntensity={0.05}
          />
        </mesh>
      ))}
    </group>
  );
}

/** An L-shaped raised planting bed with a hedge fill + a tree. Module-scope. */
function Bed({ sx }: { sx: number }) {
  return (
    <group position={[sx * (WIDTH / 2 + 2.0), 0.06, DEPTH / 2 + 1.4]}>
      {/* L-shaped raised bed: two boxes */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[2.6, 0.18, 1.2]} />
        <meshStandardMaterial color={SCENE.navy800} roughness={0.92} />
      </mesh>
      <mesh position={[sx * -1.0, 0, -1.4]}>
        <boxGeometry args={[0.9, 0.18, 1.8]} />
        <meshStandardMaterial color={SCENE.navy800} roughness={0.92} />
      </mesh>
      {/* low hedge fill with a faceted top edge */}
      <mesh position={[0, 0.2, 0]}>
        <boxGeometry args={[2.3, 0.34, 0.95]} />
        <meshStandardMaterial color="#2f7d4a" roughness={0.92} flatShading />
      </mesh>
      {/* a feature tree + a smaller companion + shrubs along the bed */}
      <Tree x={sx * -0.8} z={-1.2} kind="deciduous" scale={1.05} rot={sx * 0.6} />
      <Tree x={sx * 0.7} z={-1.1} kind="conifer" scale={0.78} rot={sx * 1.2} />
      <Shrub x={sx * 0.3} z={0.05} scale={1.1} />
      <Shrub x={sx * -0.5} z={0.1} scale={0.9} />
      <Shrub x={sx * 0.9} z={0.0} scale={0.8} />
    </group>
  );
}

function Plaza() {
  const PLAZA = 15; // plaza tile half-extent-ish
  const upRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    // gentle breathing of the warm uplights
    if (!upRef.current) return;
    const t = clock.elapsedTime;
    upRef.current.children.forEach((c, i) => {
      const m = (c as THREE.Mesh).material as THREE.MeshBasicMaterial;
      if (m) m.opacity = 0.4 + 0.18 * Math.sin(t * 0.6 + i);
    });
  });

  return (
    <group>
      {/* paved plaza — subtly reflective (damp stone) so the lit tower base +
          warm windows smear faintly into it. Low-res + blurred for perf. */}
      <mesh position={[0, 0.01, 0.5]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[PLAZA, PLAZA]} />
        <MeshReflectorMaterial
          color="#161e2c"
          roughness={0.78}
          metalness={0.2}
          blur={[300, 80]}
          mixBlur={1.0}
          mixStrength={6}
          mixContrast={1.1}
          resolution={512}
          mirror={0}
          depthScale={0.6}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.2}
          envMapIntensity={0.4}
        />
      </mesh>
      {/* lighter sidewalk band around tower */}
      <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[WIDTH + 3.0, DEPTH + 3.0]} />
        <meshStandardMaterial color="#222d3d" roughness={0.85} metalness={0.12} envMapIntensity={0.5} />
      </mesh>

      {/* dark asphalt street wrapping the front (+z) — wet-asphalt reflection,
          the big realism lever from the reference. Stronger mirror, heavy blur
          so it reads as a damp road, not a literal mirror. */}
      <mesh position={[0, 0.008, DEPTH / 2 + 4.6]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[PLAZA + 6, 3.4]} />
        <MeshReflectorMaterial
          color="#0a0f19"
          roughness={0.6}
          metalness={0.35}
          blur={[400, 120]}
          mixBlur={1.4}
          mixStrength={10}
          mixContrast={1.2}
          resolution={512}
          mirror={0.35}
          depthScale={0.8}
          minDepthThreshold={0.3}
          maxDepthThreshold={1.4}
          envMapIntensity={0.5}
        />
      </mesh>
      {/* dashed lane markings */}
      {Array.from({ length: 9 }).map((_, i) => (
        <mesh
          key={`lane${i}`}
          position={[-8 + i * 2, 0.012, DEPTH / 2 + 4.6]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[0.9, 0.12]} />
          <meshBasicMaterial color="#46566a" toneMapped={false} />
        </mesh>
      ))}

      {/* two L-shaped corner planting beds */}
      <Bed sx={-1} />
      <Bed sx={1} />

      {/* warm ground uplights along the plaza front */}
      <group ref={upRef}>
        {[-2.4, -0.8, 0.8, 2.4].map((x, i) => (
          <mesh key={`up${i}`} position={[x, 0.03, DEPTH / 2 + 0.7]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.22, 16]} />
            <meshBasicMaterial color={SCENE.warm} transparent opacity={0.5} toneMapped={false} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

export const BUILDING_DIMS = {
  FLOORS,
  FLOOR_H,
  WIDTH,
  DEPTH,
  GROUND_H,
  BODY_TOP,
  ROOF_Y,
  PH_H,
  BODY_BASE,
};
