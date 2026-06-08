"use client";

import { Canvas } from "@react-three/fiber";
import { AdaptiveDpr, BakeShadows } from "@react-three/drei";
import { Suspense } from "react";
import * as THREE from "three";
import { SCENE } from "./palette";
import Building, { BUILDING_DIMS } from "./Building";
import RoofPV from "./RoofPV";
import HeatPump from "./HeatPump";
import TechRoom from "./TechRoom";
import MeterCabinet from "./MeterCabinet";
import Apartment from "./Apartment";
import EnergyFlow from "./EnergyFlow";
import CameraRig from "./CameraRig";
import { SECTIONS } from "@/content/sections";

const { FLOORS, FLOOR_H, WIDTH } = BUILDING_DIMS;
const ROOF_Y = FLOORS * FLOOR_H + 0.7;

/**
 * The persistent building world. Pinned full-viewport behind the scrolling
 * text. Evening, architectural, calm. Everything is darkened/vignetted by the
 * DOM overlay above it so white headlines always read.
 *
 * `interactive=false` (default) lets pointer events pass through to the DOM.
 */
function World() {
  return (
    <>
      {/* Evening ambient + cool key + warm fill from the building */}
      <ambientLight intensity={0.35} color={SCENE.navy600} />
      <hemisphereLight
        intensity={0.5}
        color={SCENE.aqua}
        groundColor={SCENE.navy900}
      />
      <directionalLight
        position={[8, 14, 6]}
        intensity={1.0}
        color="#bcd3e0"
      />
      <directionalLight
        position={[-6, 4, -8]}
        intensity={0.4}
        color={SCENE.teal}
      />

      {/* Ground plane */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[120, 120]} />
        <meshStandardMaterial color="#0a1220" roughness={1} metalness={0} />
      </mesh>

      <Building />
      <RoofPV />
      <HeatPump />
      <TechRoom />
      <MeterCabinet />
      <Apartment />

      {/* Subtle energy flows — roof→technical room, heat pump→building,
          meters→building. Calm, only visible during their chapters. */}
      <EnergyFlow
        from={[0, ROOF_Y, 0]}
        to={[-0.1, 2.4, -1.6]}
        color={SCENE.green}
        activeOn="pv"
        bow={1.6}
        speed={0.16}
      />
      <EnergyFlow
        from={[-WIDTH / 2 - 1.4, 1.2, 0.6]}
        to={[-WIDTH / 2 + 0.5, 2.4, 0.4]}
        color={SCENE.teal}
        activeOn="heatpump"
        bow={0.8}
        speed={0.2}
      />
      <EnergyFlow
        from={[1.9, 2.6, -1.6]}
        to={[1.9, 5.4, -1.4]}
        color={SCENE.aqua}
        activeOn="meters"
        bow={0.6}
        speed={0.22}
      />

      <CameraRig />

      {/* Distance fog blends the building into the navy void */}
      <fog attach="fog" args={[SCENE.navy900, 18, 52]} />
    </>
  );
}

export default function BuildingScene({
  onReady,
}: {
  onReady?: () => void;
}) {
  return (
    <Canvas
      dpr={[1, 1.8]}
      shadows={false}
      gl={{
        antialias: true,
        powerPreference: "high-performance",
        alpha: false,
      }}
      camera={{
        position: SECTIONS[0].camPos,
        fov: 42,
        near: 0.1,
        far: 120,
      }}
      onCreated={({ gl, scene }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
        scene.background = new THREE.Color(SCENE.navy900);
        // Give the first frame a beat to render, then signal ready.
        requestAnimationFrame(() => requestAnimationFrame(() => onReady?.()));
      }}
      style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
    >
      <Suspense fallback={null}>
        <World />
      </Suspense>
      <AdaptiveDpr pixelated={false} />
      <BakeShadows />
    </Canvas>
  );
}
