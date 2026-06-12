"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Text, useTexture } from "@react-three/drei";
import * as THREE from "three";
import { SCENE } from "./palette";
import { emphasisWeight, smooth01 } from "./emphasis";

/**
 * POWERHOUSE Hub v1 — rebuilt to faithfully match the real product photo (REF-G).
 *
 * Portrait white enclosure, rounded, slightly glossy. Top→bottom:
 *  - TOP: stacked-chevron "building" logo mark (5 angled bars) + "POWERHOUSE 360"
 *    wordmark ("POWER" bold + "HOUSE 360" regular), black on white.
 *  - CENTRE: a black recessed landscape touchscreen with a live UI —
 *      status bar ("POWERHOUSE 360 · 10:42 · wifi"),
 *      a row of 4 tiles: SOLAR (yellow sun) / HAUS (orange house) /
 *      BATTERIE (green %) / NETZ (blue pylon),
 *      a bottom bar: green-check "STATUS Alles in Ordnung", VERLAUF, gear.
 *  - BOTTOM: large black "HUB v1".
 *  - RIGHT EDGE: two round metallic latches with small connector pictograms.
 *
 * Z layering: white box front face at z≈0.11; all UI sits between 0.111..0.14.
 */

/**
 * SWAP-IN POINT for the real product photo.
 * Drop the real Hub v1 photo into /public/brand/ (e.g. hub-v1.png), then set this
 * to its path (e.g. "/brand/hub-v1.png"). The photo is mapped onto a plane that
 * covers the enclosure front, replacing the stylised face — no other change
 * needed. While null, the faithful stylised model below is shown.
 * For best results use a straight-on, cropped photo of the white portrait face
 * (logo top, black landscape display centre, "HUB v1", two right-side latches).
 */
const HUB_PHOTO_SRC: string | null = null;

// Enclosure face dimensions (portrait). Front face plane at z = FACE_Z.
const W = 1.46;
const H = 2.18;
const FACE_Z = 0.11;

// UI palette to match the photo's screen.
// Dimmed toward REF-2's dark-glass look: the display reads as a black glass
// rectangle with subtle content, not a lit dashboard. Tiles/text are muted.
const UI = {
  screenBg: "#070a10",
  bar: "#0b0f16",
  tile: "#0e131c",
  text: "#b9c4d2",
  textDim: "#76869a",
  sun: "#c79f3a",
  house: "#c1742f",
  battery: "#379a55",
  grid: "#4d7ba8",
  ok: "#379a55",
};

/** Stacked-chevron "building" logo mark: 5 angled bars forming an upward arrow. */
function ChevronMark({
  x,
  y,
  z,
  s = 1,
  color = "#0d1626",
}: {
  x: number;
  y: number;
  z: number;
  s?: number;
  color?: string;
}) {
  // Each chevron = two short bars meeting at the apex (an inverted V / ^).
  const rows = [0, 1, 2, 3, 4];
  const barLen = 0.12 * s;
  const barTh = 0.028 * s;
  const stepY = 0.055 * s;
  const apexDX = 0.085 * s; // horizontal half-span of each chevron
  const tilt = 0.62; // radians, the bar's lean
  return (
    <group position={[x, y, z]}>
      {rows.map((r) => {
        // higher rows are slightly narrower → nested "building" look
        const span = apexDX * (1 - r * 0.08);
        const yy = -r * stepY;
        return (
          <group key={r} position={[0, yy, 0]}>
            <mesh position={[-span * 0.55, 0, 0]} rotation={[0, 0, tilt]}>
              <boxGeometry args={[barLen, barTh, 0.02]} />
              <meshStandardMaterial color={color} roughness={0.5} />
            </mesh>
            <mesh position={[span * 0.55, 0, 0]} rotation={[0, 0, -tilt]}>
              <boxGeometry args={[barLen, barTh, 0.02]} />
              <meshStandardMaterial color={color} roughness={0.5} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

/** A small flat pictogram tile icon drawn from primitive planes (low-poly, crisp). */
function TileIcon({ kind, color }: { kind: string; color: string }) {
  // Rendered at the tile's local origin, ~0.12 wide.
  if (kind === "sun") {
    return (
      <group>
        <mesh>
          <circleGeometry args={[0.045, 18]} />
          <meshBasicMaterial color={color} toneMapped={false} />
        </mesh>
        {Array.from({ length: 8 }).map((_, i) => {
          const a = (i / 8) * Math.PI * 2;
          return (
            <mesh
              key={i}
              position={[Math.cos(a) * 0.075, Math.sin(a) * 0.075, 0]}
              rotation={[0, 0, a]}
            >
              <planeGeometry args={[0.04, 0.014]} />
              <meshBasicMaterial color={color} toneMapped={false} />
            </mesh>
          );
        })}
      </group>
    );
  }
  if (kind === "house") {
    return (
      <group>
        <mesh position={[0, -0.02, 0]}>
          <planeGeometry args={[0.11, 0.075]} />
          <meshBasicMaterial color={color} toneMapped={false} />
        </mesh>
        <mesh position={[0, 0.045, 0]} rotation={[0, 0, Math.PI / 4]}>
          <planeGeometry args={[0.072, 0.072]} />
          <meshBasicMaterial color={color} toneMapped={false} />
        </mesh>
      </group>
    );
  }
  if (kind === "battery") {
    return (
      <group>
        <mesh>
          <planeGeometry args={[0.085, 0.12]} />
          <meshBasicMaterial color={color} toneMapped={false} />
        </mesh>
        <mesh position={[0, 0.072, 0]}>
          <planeGeometry args={[0.035, 0.018]} />
          <meshBasicMaterial color={color} toneMapped={false} />
        </mesh>
        <mesh position={[0, -0.01, 0.001]}>
          <planeGeometry args={[0.055, 0.075]} />
          <meshBasicMaterial color={UI.screenBg} toneMapped={false} />
        </mesh>
      </group>
    );
  }
  // pylon / grid
  return (
    <group>
      <mesh position={[0, 0, 0]} rotation={[0, 0, 0.18]}>
        <planeGeometry args={[0.016, 0.14]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0, 0]} rotation={[0, 0, -0.18]}>
        <planeGeometry args={[0.016, 0.14]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.03, 0]}>
        <planeGeometry args={[0.075, 0.014]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      <mesh position={[0, -0.03, 0]}>
        <planeGeometry args={[0.05, 0.014]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
    </group>
  );
}

interface TileDef {
  kind: string;
  color: string;
  label: string;
  value: string;
  hint: string;
}

const TILES: TileDef[] = [
  { kind: "sun", color: UI.sun, label: "SOLAR", value: "2.45 kW", hint: "Produktion" },
  { kind: "house", color: UI.house, label: "HAUS", value: "1.28 kW", hint: "Verbrauch" },
  { kind: "battery", color: UI.battery, label: "BATTERIE", value: "78 %", hint: "2.10 kW Laden" },
  { kind: "grid", color: UI.grid, label: "NETZ", value: "0.83 kW", hint: "Bezug" },
];

/** The black recessed touchscreen UI, rendered with planes + drei <Text>. */
function Display({
  matRef,
}: {
  matRef: React.RefObject<THREE.MeshStandardMaterial | null>;
}) {
  const DW = 1.16;
  const DH = 0.86;
  const z0 = FACE_Z + 0.004; // screen surface
  const zt = z0 + 0.004; // content layer

  // 4 tiles laid out across the screen
  const tileW = 0.26;
  const tileH = 0.46;
  const gap = (DW - 0.08 - tileW * 4) / 3;
  const startX = -DW / 2 + 0.04 + tileW / 2;
  const tileY = 0.0;

  return (
    <group position={[0, 0.2, 0]}>
      {/* screen glass */}
      <mesh position={[0, 0, z0]}>
        <planeGeometry args={[DW, DH]} />
        <meshStandardMaterial
          ref={matRef}
          color={UI.screenBg}
          emissive={UI.grid}
          emissiveIntensity={0.1}
          roughness={0.16}
          metalness={0.18}
          envMapIntensity={1.2}
        />
      </mesh>

      {/* ── top status bar ── */}
      <mesh position={[0, DH / 2 - 0.06, zt]}>
        <planeGeometry args={[DW - 0.04, 0.1]} />
        <meshBasicMaterial color={UI.bar} toneMapped={false} />
      </mesh>
      <Text
        position={[-DW / 2 + 0.07, DH / 2 - 0.06, zt + 0.002]}
        fontSize={0.05}
        color={UI.text}
        anchorX="left"
        anchorY="middle"
        letterSpacing={0.01}
      >
        POWERHOUSE 360
      </Text>
      <Text
        position={[DW / 2 - 0.21, DH / 2 - 0.06, zt + 0.002]}
        fontSize={0.05}
        color={UI.textDim}
        anchorX="right"
        anchorY="middle"
      >
        10:42
      </Text>
      {/* wifi dot */}
      <mesh position={[DW / 2 - 0.1, DH / 2 - 0.06, zt + 0.002]}>
        <circleGeometry args={[0.018, 12]} />
        <meshBasicMaterial color={UI.battery} toneMapped={false} />
      </mesh>

      {/* ── 4 tiles ── */}
      {TILES.map((t, i) => {
        const x = startX + i * (tileW + gap);
        return (
          <group key={t.label} position={[x, tileY, zt]}>
            {/* tile bg */}
            <mesh>
              <planeGeometry args={[tileW, tileH]} />
              <meshBasicMaterial color={UI.tile} toneMapped={false} />
            </mesh>
            {/* accent top strip */}
            <mesh position={[0, tileH / 2 - 0.012, 0.001]}>
              <planeGeometry args={[tileW, 0.022]} />
              <meshBasicMaterial color={t.color} toneMapped={false} />
            </mesh>
            {/* icon */}
            <group position={[0, tileH / 2 - 0.16, 0.002]} scale={0.82}>
              <TileIcon kind={t.kind} color={t.color} />
            </group>
            {/* label */}
            <Text
              position={[0, -0.02, 0.002]}
              fontSize={0.044}
              color={UI.text}
              anchorX="center"
              anchorY="middle"
              letterSpacing={0.02}
              fontWeight={700}
            >
              {t.label}
            </Text>
            {/* value */}
            <Text
              position={[0, -0.09, 0.002]}
              fontSize={0.052}
              color={t.color}
              anchorX="center"
              anchorY="middle"
              fontWeight={700}
            >
              {t.value}
            </Text>
            {/* hint */}
            <Text
              position={[0, -0.16, 0.002]}
              fontSize={0.034}
              color={UI.textDim}
              anchorX="center"
              anchorY="middle"
              maxWidth={tileW - 0.02}
            >
              {t.hint}
            </Text>
          </group>
        );
      })}

      {/* ── bottom status bar ── */}
      <mesh position={[0, -DH / 2 + 0.075, zt]}>
        <planeGeometry args={[DW - 0.04, 0.12]} />
        <meshBasicMaterial color={UI.bar} toneMapped={false} />
      </mesh>
      {/* green check chip */}
      <mesh position={[-DW / 2 + 0.1, -DH / 2 + 0.075, zt + 0.002]}>
        <circleGeometry args={[0.025, 14]} />
        <meshBasicMaterial color={UI.ok} toneMapped={false} />
      </mesh>
      <Text
        position={[-DW / 2 + 0.15, -DH / 2 + 0.075, zt + 0.002]}
        fontSize={0.04}
        color={UI.text}
        anchorX="left"
        anchorY="middle"
      >
        STATUS · Alles in Ordnung
      </Text>
      {/* VERLAUF button */}
      <mesh position={[DW / 2 - 0.3, -DH / 2 + 0.075, zt + 0.001]}>
        <planeGeometry args={[0.26, 0.07]} />
        <meshBasicMaterial color={UI.tile} toneMapped={false} />
      </mesh>
      <Text
        position={[DW / 2 - 0.3, -DH / 2 + 0.075, zt + 0.003]}
        fontSize={0.038}
        color={UI.textDim}
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.02}
      >
        VERLAUF
      </Text>
      {/* gear dot */}
      <mesh position={[DW / 2 - 0.08, -DH / 2 + 0.075, zt + 0.002]}>
        <circleGeometry args={[0.022, 8]} />
        <meshBasicMaterial color={UI.textDim} toneMapped={false} />
      </mesh>
    </group>
  );
}

export default function Hub() {
  const displayMat = useRef<THREE.MeshStandardMaterial>(null);
  const latchRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const w = smooth01(emphasisWeight("hub", 1.0));
    const t = clock.elapsedTime;
    if (displayMat.current) {
      // gentle screen breathing — kept LOW so the display reads as dark glass
      // (REF-2), only a touch livelier while the hub chapter is active
      displayMat.current.emissiveIntensity =
        0.08 + w * 0.22 + Math.sin(t * 1.2) * 0.02;
    }
  });

  return (
    <group>
      {/* mounting backplate on wall */}
      <mesh position={[0, 0, -0.06]}>
        <boxGeometry args={[W + 0.16, H + 0.16, 0.06]} />
        <meshStandardMaterial color={SCENE.slate} roughness={0.7} />
      </mesh>

      {/* white enclosure body */}
      <mesh castShadow position={[0, 0, 0.0]}>
        <boxGeometry args={[W, H, 0.2]} />
        <meshStandardMaterial color="#f4f6f8" roughness={0.4} metalness={0.04} />
      </mesh>
      {/* subtle glossy front bevel */}
      <mesh position={[0, 0, FACE_Z - 0.002]}>
        <planeGeometry args={[W - 0.03, H - 0.03]} />
        <meshStandardMaterial color="#fbfcfd" roughness={0.28} metalness={0.06} />
      </mesh>

      {/* Real product photo, when provided, mapped onto the enclosure front. */}
      {HUB_PHOTO_SRC && <HubPhoto src={HUB_PHOTO_SRC} />}

      {!HUB_PHOTO_SRC && (
        <>
          {/* ── TOP: chevron mark + wordmark ── */}
          <ChevronMark x={0} y={H / 2 - 0.18} z={FACE_Z + 0.004} s={1.0} />
          <Text
            position={[0, H / 2 - 0.5, FACE_Z + 0.004]}
            fontSize={0.085}
            color="#0d1626"
            anchorX="center"
            anchorY="middle"
            letterSpacing={0.04}
            fontWeight={800}
          >
            POWERHOUSE
          </Text>
          <Text
            position={[0, H / 2 - 0.59, FACE_Z + 0.004]}
            fontSize={0.06}
            color={SCENE.slate}
            anchorX="center"
            anchorY="middle"
            letterSpacing={0.16}
          >
            360
          </Text>

          {/* ── CENTRE: black touchscreen UI ── */}
          <Display matRef={displayMat} />

          {/* ── BOTTOM: HUB v1 ── */}
          <Text
            position={[0, -H / 2 + 0.26, FACE_Z + 0.004]}
            fontSize={0.2}
            color="#0d1626"
            anchorX="center"
            anchorY="middle"
            fontWeight={800}
            letterSpacing={0.01}
          >
            HUB v1
          </Text>
        </>
      )}

      {/* ── RIGHT EDGE: two round metallic latches + connector pictograms ── */}
      <group ref={latchRef}>
        {[0.52, -0.52].map((y, i) => (
          <group key={i} position={[W / 2 - 0.02, y, FACE_Z - 0.005]}>
            {/* metallic latch ring */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.075, 0.075, 0.03, 24]} />
              <meshStandardMaterial color="#c2ccd6" metalness={0.85} roughness={0.25} />
            </mesh>
            <mesh position={[0, 0, 0.018]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.04, 0.04, 0.02, 16]} />
              <meshStandardMaterial color="#7d8a98" metalness={0.7} roughness={0.35} />
            </mesh>
            {/* small connector/arrow pictogram beside the latch (toward centre) */}
            <mesh position={[-0.14, 0, 0.01]} rotation={[0, 0, Math.PI]}>
              <coneGeometry args={[0.028, 0.05, 3]} />
              <meshStandardMaterial color={SCENE.slate} roughness={0.5} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

/** Maps the real Hub photo onto a plane on the enclosure front (z just proud of
 * the white box). Suspends while the texture loads — caught by the scene's
 * <Suspense> boundary. Only mounted when HUB_PHOTO_SRC is set. */
function HubPhoto({ src }: { src: string }) {
  const tex = useTexture(src);
  return (
    <mesh position={[0, 0, FACE_Z + 0.006]}>
      <planeGeometry args={[W, H]} />
      <meshBasicMaterial map={tex} toneMapped={false} />
    </mesh>
  );
}
