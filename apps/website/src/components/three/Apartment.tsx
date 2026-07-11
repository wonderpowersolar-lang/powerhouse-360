"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { SCENE } from "./palette";
import { emphasisWeight, smooth01 } from "./emphasis";

/**
 * Apartment interior (Bewohnerportal with Paula). A warm, high-end room:
 *  - sofa with two cushions, a soft rug, a floor lamp with a warm glow
 *  - a window with warm dusk light to the side
 *  - a wall-mounted display showing solar share, an animated bar chart and a
 *    savings line, plus the subtle "Paula" assistant card
 *
 * Positioned at world ≈ (1.2, 8.6, -2.2) to match the residents camera target.
 */
const POS: [number, number, number] = [1.2, 8.6, -2.2];

export default function Apartment() {
  const screenMat = useRef<THREE.MeshStandardMaterial>(null);
  const barsRef = useRef<THREE.Group>(null);
  const paulaMat = useRef<THREE.MeshStandardMaterial>(null);
  const warmLight = useRef<THREE.PointLight>(null);
  const lampMat = useRef<THREE.MeshBasicMaterial>(null);

  useFrame(({ clock }) => {
    const w = smooth01(emphasisWeight("apartment", 1.0));
    const t = clock.elapsedTime;
    if (screenMat.current) screenMat.current.emissiveIntensity = 0.25 + w * 0.9;
    if (paulaMat.current) paulaMat.current.emissiveIntensity = 0.2 + w * 0.7;
    if (warmLight.current) warmLight.current.intensity = 0.6 + w * 3.2;
    if (lampMat.current) lampMat.current.opacity = 0.4 + w * 0.5;
    if (barsRef.current) {
      barsRef.current.children.forEach((c, i) => {
        const mesh = c as THREE.Mesh;
        const h = 0.25 + 0.45 * (0.5 + 0.5 * Math.sin(t * 0.8 + i * 1.1));
        mesh.scale.y = h * (0.4 + w * 0.6);
        mesh.position.y = (h * (0.4 + w * 0.6)) / 2 - 0.18;
      });
    }
  });

  return (
    <group position={POS}>
      {/* back wall */}
      <mesh position={[0, 0, -0.25]}>
        <boxGeometry args={[4.4, 3.4, 0.2]} />
        <meshStandardMaterial color={SCENE.navy600} roughness={0.85} />
      </mesh>
      {/* warm accent wall panel behind the lounge */}
      <mesh position={[-1.3, -0.1, -0.14]}>
        <boxGeometry args={[1.7, 2.6, 0.04]} />
        <meshStandardMaterial color="#2c3a4f" roughness={0.8} />
      </mesh>
      {/* floor */}
      <mesh position={[0, -1.6, 0.8]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[4.4, 2.4]} />
        <meshStandardMaterial color="#26384f" roughness={0.7} />
      </mesh>
      {/* soft rug */}
      <mesh position={[-1.0, -1.58, 0.85]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.0, 1.3]} />
        <meshStandardMaterial color="#3a4a60" roughness={0.95} />
      </mesh>
      <mesh position={[-1.0, -1.575, 0.85]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.7, 1.0]} />
        <meshStandardMaterial color={SCENE.slate} roughness={0.95} />
      </mesh>

      {/* window with warm dusk light (left wall) */}
      <group position={[-2.1, 0.2, 0.4]}>
        <mesh>
          <planeGeometry args={[0.9, 1.6]} />
          <meshBasicMaterial color={SCENE.warm} transparent opacity={0.45} toneMapped={false} />
        </mesh>
        {/* mullions */}
        <mesh position={[0, 0, 0.01]}>
          <boxGeometry args={[0.04, 1.6, 0.02]} />
          <meshStandardMaterial color={SCENE.navy800} />
        </mesh>
        <mesh position={[0, 0, 0.01]}>
          <boxGeometry args={[0.9, 0.04, 0.02]} />
          <meshStandardMaterial color={SCENE.navy800} />
        </mesh>
      </group>

      {/* warm interior light */}
      <pointLight
        ref={warmLight}
        position={[0.4, 0.6, 1.2]}
        intensity={0.6}
        color={SCENE.warm}
        distance={6}
        decay={2}
      />

      {/* sofa with cushions */}
      <group position={[-1.1, -1.0, 0.75]}>
        {/* base */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[1.7, 0.45, 0.75]} />
          <meshStandardMaterial color={SCENE.slate} roughness={0.92} />
        </mesh>
        {/* back */}
        <mesh position={[0, 0.35, -0.28]}>
          <boxGeometry args={[1.7, 0.5, 0.2]} />
          <meshStandardMaterial color={SCENE.slateLight} roughness={0.92} />
        </mesh>
        {/* armrests */}
        {[-0.78, 0.78].map((x, i) => (
          <mesh key={i} position={[x, 0.2, 0]}>
            <boxGeometry args={[0.16, 0.35, 0.75]} />
            <meshStandardMaterial color={SCENE.slate} roughness={0.92} />
          </mesh>
        ))}
        {/* cushions */}
        {[-0.42, 0.42].map((x, i) => (
          <mesh key={`cu${i}`} position={[x, 0.32, 0.05]} rotation={[0.25, 0, 0]}>
            <boxGeometry args={[0.5, 0.42, 0.16]} />
            <meshStandardMaterial color={i ? SCENE.teal : SCENE.warm} roughness={0.9} />
          </mesh>
        ))}
      </group>

      {/* floor lamp with warm shade glow */}
      <group position={[0.0, -0.7, 0.4]}>
        <mesh position={[0, -0.55, 0]}>
          <cylinderGeometry args={[0.18, 0.22, 0.04, 16]} />
          <meshStandardMaterial color={SCENE.navy800} metalness={0.4} roughness={0.5} />
        </mesh>
        <mesh>
          <cylinderGeometry args={[0.02, 0.02, 1.1, 8]} />
          <meshStandardMaterial color={SCENE.slateLight} metalness={0.6} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.62, 0]}>
          <coneGeometry args={[0.2, 0.28, 20, 1, true]} />
          <meshBasicMaterial ref={lampMat} color={SCENE.warm} transparent opacity={0.5} side={THREE.DoubleSide} toneMapped={false} />
        </mesh>
      </group>

      {/* wall display (energy dashboard) */}
      <group position={[0.9, 0.4, 0.12]}>
        <mesh>
          <boxGeometry args={[1.9, 1.2, 0.05]} />
          <meshStandardMaterial color="#0a121d" roughness={0.4} metalness={0.2} />
        </mesh>
        <mesh position={[0, 0, 0.031]}>
          <planeGeometry args={[1.78, 1.08]} />
          <meshStandardMaterial
            ref={screenMat}
            color="#0c1726"
            emissive={SCENE.teal}
            emissiveIntensity={0.25}
            roughness={0.25}
          />
        </mesh>

        <Text
          position={[-0.78, 0.42, 0.04]}
          fontSize={0.1}
          color={SCENE.aqua}
          anchorX="left"
          anchorY="middle"
        >
          Mein Verbrauch
        </Text>
        <Text
          position={[0.55, 0.42, 0.04]}
          fontSize={0.16}
          color={SCENE.green}
          anchorX="left"
          anchorY="middle"
          fontWeight={700}
        >
          68%
        </Text>
        <Text
          position={[0.55, 0.25, 0.04]}
          fontSize={0.055}
          color="#aebccb"
          anchorX="left"
          anchorY="middle"
        >
          Solaranteil
        </Text>

        {/* bar chart */}
        <group ref={barsRef} position={[-0.55, -0.18, 0.04]}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <mesh key={i} position={[i * 0.2, 0, 0]}>
              <boxGeometry args={[0.12, 0.5, 0.02]} />
              <meshStandardMaterial
                color={i % 2 ? SCENE.teal : SCENE.green}
                emissive={i % 2 ? SCENE.teal : SCENE.green}
                emissiveIntensity={0.4}
                toneMapped={false}
              />
            </mesh>
          ))}
        </group>

        {/* Paula assistant card (subtle) */}
        <group position={[0.5, -0.28, 0.04]}>
          <mesh>
            <planeGeometry args={[0.82, 0.44]} />
            <meshStandardMaterial
              ref={paulaMat}
              color={SCENE.navy700}
              emissive={SCENE.teal}
              emissiveIntensity={0.2}
              transparent
              opacity={0.94}
              roughness={0.4}
            />
          </mesh>
          <mesh position={[-0.28, 0.08, 0.01]}>
            <circleGeometry args={[0.07, 24]} />
            <meshBasicMaterial color={SCENE.teal} toneMapped={false} />
          </mesh>
          <Text
            position={[0.02, 0.1, 0.01]}
            fontSize={0.06}
            color={SCENE.white}
            anchorX="left"
            anchorY="middle"
            fontWeight={600}
          >
            Paula
          </Text>
          <Text
            position={[-0.34, -0.08, 0.01]}
            fontSize={0.046}
            color={SCENE.aqua}
            anchorX="left"
            anchorY="middle"
            maxWidth={0.74}
          >
            Du sparst diesen Monat 31 €.
          </Text>
        </group>
      </group>
    </group>
  );
}
