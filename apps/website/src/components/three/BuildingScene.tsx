"use client";

import { Canvas } from "@react-three/fiber";
import {
  AdaptiveDpr,
  Environment,
  Lightformer,
  ContactShadows,
  BakeShadows,
} from "@react-three/drei";
import { Suspense } from "react";
import * as THREE from "three";
import { SCENE } from "./palette";
import Building, { BUILDING_DIMS } from "./Building";
import RoofPV from "./RoofPV";
import HeatPump from "./HeatPump";
import TechRoom from "./TechRoom";
import Apartment from "./Apartment";
import EnergyFlow from "./EnergyFlow";
import { Garage } from "./Wallbox";
import { Stairwell } from "./SmokeDetector";
import CameraRig from "./CameraRig";
import HotspotProjector from "./HotspotProjector";
import Effects from "./Effects";
import { SECTIONS } from "@/content/sections";

const { WIDTH, DEPTH, ROOF_Y } = BUILDING_DIMS;
const DEPTH_HALF = DEPTH / 2;

/**
 * Offline image-based lighting built entirely from in-scene Lightformers, so
 * there is NO CDN/.hdr fetch. The Environment renders these emissive planes to
 * a cubemap that every MeshStandard/MeshPhysicalMaterial samples for real glass
 * + metal reflections. `background={false}` → it lights the materials but does
 * NOT overwrite the dark navy scene background.
 *
 *  • a large soft COOL sky panel high above (the dominant reflection),
 *  • two warm low RECTs at street level (window / lobby bounce, dusk warmth),
 *  • two teal RIM strips far back to give edges a cold reflective sheen.
 *
 * `resolution` kept modest (128) — these are soft sources, high res is wasted.
 */
function IBL() {
  return (
    <Environment resolution={128} frames={1} background={false}>
      {/* cool soft sky dome above */}
      <Lightformer
        form="rect"
        intensity={1.4}
        color="#aac4dc"
        scale={[40, 40, 1]}
        position={[0, 22, 0]}
        rotation={[Math.PI / 2, 0, 0]}
      />
      {/* warm low bounce, front-left (window/lobby glow) */}
      <Lightformer
        form="rect"
        intensity={1.1}
        color="#f6c178"
        scale={[16, 6, 1]}
        position={[-10, 3, 12]}
        rotation={[0, Math.PI / 6, 0]}
      />
      {/* warm low bounce, front-right */}
      <Lightformer
        form="rect"
        intensity={0.8}
        color="#f3b25e"
        scale={[14, 5, 1]}
        position={[11, 2.5, 10]}
        rotation={[0, -Math.PI / 6, 0]}
      />
      {/* teal rim, back-left */}
      <Lightformer
        form="rect"
        intensity={0.9}
        color="#2bb6b0"
        scale={[6, 20, 1]}
        position={[-16, 8, -10]}
        rotation={[0, Math.PI / 2, 0]}
      />
      {/* teal rim, back-right */}
      <Lightformer
        form="rect"
        intensity={0.7}
        color="#3aa8a0"
        scale={[6, 20, 1]}
        position={[16, 8, -10]}
        rotation={[0, -Math.PI / 2, 0]}
      />
    </Environment>
  );
}

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
      {/* In-scene IBL for reflections (offline, no HDR fetch). */}
      <IBL />

      {/* Evening three-point rig: cool key + warm-ish fill + teal rim, over a
          soft sky/ground hemisphere. Tuned to keep the calm dark mood while
          giving PBR surfaces (PV glass, Hub latches, window mullions) believable
          falloff and edge definition. */}
      <ambientLight intensity={0.42} color={SCENE.navy600} />
      <hemisphereLight
        intensity={0.62}
        color={SCENE.aqua}
        groundColor={SCENE.navy900}
      />
      {/* KEY — cool moonlight from upper-front-right. NOW the single
          shadow-caster: soft PCSS-ish shadows ground the tower + trees. */}
      <directionalLight
        position={[9, 17, 8]}
        intensity={1.15}
        color="#c3d6e2"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={1}
        shadow-camera-far={60}
        shadow-camera-left={-18}
        shadow-camera-right={18}
        shadow-camera-top={28}
        shadow-camera-bottom={-6}
        shadow-bias={-0.0004}
        shadow-normalBias={0.04}
        shadow-radius={6}
      />
      {/* FILL — soft warm bounce from lower-left so shadow sides don't crush */}
      <directionalLight
        position={[-7, 3, 5]}
        intensity={0.34}
        color={SCENE.warm}
      />
      {/* RIM — teal back-light to separate the tower from the navy void */}
      <directionalLight
        position={[-6, 6, -9]}
        intensity={0.5}
        color={SCENE.teal}
      />

      {/* Ground plane (receives the soft key shadow) */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[120, 120]} />
        <meshStandardMaterial color="#0a1220" roughness={1} metalness={0} />
      </mesh>

      {/* Soft contact shadow that GROUNDS the tower + plaza planting on the
          plaza tile. Sits just above the reflective street so the building reads
          as planted, not floating. Cheap (single render, blurred). */}
      <ContactShadows
        position={[0, 0.02, 0.5]}
        scale={26}
        far={9}
        blur={2.6}
        opacity={0.55}
        resolution={512}
        color="#04070d"
        frames={1}
      />

      <Building />
      <RoofPV />
      <HeatPump />
      <TechRoom />
      <Apartment />

      {/* Chargemieter — underground garage with wallbox wall + parked car. Sits
          below grade so it never intrudes on the exterior shots. */}
      <Garage pos={[0, -2.0, -1.0]} />

      {/* Smokemieter — mid-floor stairwell landing with ceiling detector. */}
      <Stairwell pos={[0, 6.4, -2.4]} />

      {/* Subtle energy flows — roof PV → building riser, heat pump → wall.
          Calm, only visible during their chapters. */}
      <EnergyFlow
        from={[0, ROOF_Y + 0.4, DEPTH_HALF - 1.4]}
        to={[-0.2, 4.0, -2.4]}
        color={SCENE.green}
        activeOn="pv"
        bow={2.2}
        speed={0.16}
      />
      <EnergyFlow
        from={[WIDTH / 2 + 1.55, 1.42, 1.5]}
        to={[WIDTH / 2 - 0.05, 1.0, 1.45]}
        color={SCENE.teal}
        activeOn="heatpump"
        bow={0.45}
        speed={0.2}
      />
      {/* FINALE — when everything is connected (emphasis "all"), one calm
          riser line climbs the front facade from the ground systems to the
          roof: the building reads as a single connected system before the CTA. */}
      <EnergyFlow
        from={[WIDTH / 2 - 0.6, 0.6, DEPTH_HALF + 0.28]}
        to={[-1.2, ROOF_Y - 0.3, DEPTH_HALF + 0.28]}
        color={SCENE.green}
        activeOn="all"
        bow={0.4}
        speed={0.12}
        dots={3}
      />

      <CameraRig />

      {/* Projects the explorer hotspot anchors to screen space each frame for
          the DOM pin layer (HotspotPins). Renders nothing. */}
      <HotspotProjector />

      {/* Distance fog blends the building into the navy void */}
      <fog attach="fog" args={[SCENE.navy900, 18, 52]} />

      {/* Cinematic post: AO, selective bloom, chapter-aware tilt-shift DoF,
          vignette. Interiors stay sharp (see Effects.tsx). */}
      <Effects />
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
      dpr={[1, 1.5]}
      shadows="soft"
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
        gl.toneMappingExposure = 1.0;
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
      {/* Light + geometry are static → bake the directional shadow map after
          the first frames so the per-frame shadow cost drops to ~0 while the
          camera keeps moving. */}
      <BakeShadows />
    </Canvas>
  );
}
