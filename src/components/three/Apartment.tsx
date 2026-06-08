"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { SCENE } from "./palette";
import { emphasisWeight, smooth01 } from "./emphasis";

/**
 * Apartment interior (Bewohnerportal with Paula). A warm, high-end room with
 * a wall-mounted display showing energy use, solar share and savings. "Paula"
 * appears only as a subtle assistant card inside the interface — not a figure.
 *
 * Positioned at world ≈ (1.4, 6.2, -1.6) to match the residents camera target.
 */
const POS: [number, number, number] = [1.4, 6.2, -1.6];

export default function Apartment() {
  const screenMat = useRef<THREE.MeshStandardMaterial>(null);
  const barsRef = useRef<THREE.Group>(null);
  const paulaMat = useRef<THREE.MeshStandardMaterial>(null);
  const warmLight = useRef<THREE.PointLight>(null);

  useFrame(({ clock }) => {
    const w = smooth01(emphasisWeight("apartment", 1.0));
    const t = clock.elapsedTime;
    if (screenMat.current) screenMat.current.emissiveIntensity = 0.2 + w * 0.9;
    if (paulaMat.current) paulaMat.current.emissiveIntensity = 0.2 + w * 0.7;
    if (warmLight.current) warmLight.current.intensity = 0.4 + w * 3.5;
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
        <boxGeometry args={[4.2, 3.4, 0.2]} />
        <meshStandardMaterial color={SCENE.navy600} roughness={0.85} />
      </mesh>
      {/* floor */}
      <mesh position={[0, -1.6, 0.8]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[4.2, 2.2]} />
        <meshStandardMaterial color="#26384f" roughness={0.7} />
      </mesh>

      {/* warm interior light */}
      <pointLight
        ref={warmLight}
        position={[1.0, 0.8, 1.2]}
        intensity={0.4}
        color={SCENE.warm}
        distance={6}
        decay={2}
      />

      {/* sofa hint */}
      <mesh position={[-1.1, -1.05, 0.7]}>
        <boxGeometry args={[1.6, 0.5, 0.7]} />
        <meshStandardMaterial color={SCENE.slate} roughness={0.9} />
      </mesh>
      <mesh position={[-1.1, -0.7, 0.45]}>
        <boxGeometry args={[1.6, 0.4, 0.2]} />
        <meshStandardMaterial color={SCENE.slateLight} roughness={0.9} />
      </mesh>

      {/* wall display (energy dashboard) */}
      <group position={[0.7, 0.35, 0.12]}>
        <mesh>
          <boxGeometry args={[1.9, 1.2, 0.05]} />
          <meshStandardMaterial color="#0a121d" roughness={0.4} />
        </mesh>
        <mesh position={[0, 0, 0.031]}>
          <planeGeometry args={[1.78, 1.08]} />
          <meshStandardMaterial
            ref={screenMat}
            color="#0c1726"
            emissive={SCENE.teal}
            emissiveIntensity={0.2}
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
          fontSize={0.14}
          color={SCENE.green}
          anchorX="left"
          anchorY="middle"
          fontWeight={700}
        >
          68%
        </Text>
        <Text
          position={[0.55, 0.27, 0.04]}
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
              />
            </mesh>
          ))}
        </group>

        {/* Paula assistant card (subtle) */}
        <group position={[0.5, -0.28, 0.04]}>
          <mesh ref={undefined}>
            <planeGeometry args={[0.78, 0.42]} />
            <meshStandardMaterial
              ref={paulaMat}
              color={SCENE.navy700}
              emissive={SCENE.teal}
              emissiveIntensity={0.2}
              transparent
              opacity={0.92}
              roughness={0.4}
            />
          </mesh>
          <mesh position={[-0.27, 0.08, 0.01]}>
            <circleGeometry args={[0.07, 24]} />
            <meshBasicMaterial color={SCENE.teal} toneMapped={false} />
          </mesh>
          <Text
            position={[0.02, 0.09, 0.01]}
            fontSize={0.06}
            color={SCENE.white}
            anchorX="left"
            anchorY="middle"
            fontWeight={600}
          >
            Paula
          </Text>
          <Text
            position={[-0.32, -0.08, 0.01]}
            fontSize={0.045}
            color={SCENE.aqua}
            anchorX="left"
            anchorY="middle"
            maxWidth={0.7}
          >
            Du sparst diesen Monat 31 €.
          </Text>
        </group>
      </group>
    </group>
  );
}
