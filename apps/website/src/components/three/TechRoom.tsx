"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { SCENE } from "./palette";
import { emphasisWeight, smooth01 } from "./emphasis";
import { usePBR, ensureUv2 } from "./textures";
import Hub from "./Hub";

/**
 * The technical / metering room (Hausanschlussraum) — ONE coherent plant room
 * on a lower floor that hosts BOTH station moments:
 *
 *  REF-3 (powermieter): a bright German Zählerwand on the LEFT — a tall white
 *  cabinet door with a black handle, then five identical white meter columns,
 *  each with a breaker (Sicherungs-) band ABOVE, a digital meter (LCD +
 *  barcode label) at mid-height and a blank white panel door below; a cable
 *  tray with cables runs along the ceiling.
 *
 *  REF-2 (hub): to the RIGHT of the meter wall the bare light-grey concrete
 *  wall carries the white POWERHOUSE Hub v1 — THREE grey conduits enter the
 *  enclosure from the TOP (ceiling), a galvanized vertical conduit runs down
 *  the wall beside it, a white sub-panel hangs further right, and a dark
 *  server rack with blinking LEDs stands in the left background.
 *
 * Both chapter cameras (sections.ts: powermieter + hub) sit OUTSIDE the open
 * room front (+z) looking in, so all walls stay simple Front-facing volumes
 * and the interior-camera rules hold.
 */
const ROOM_POS: [number, number, number] = [0, 3.0, -2.7];

// room shell (relative units)
const RW = 5.9; // x width
const RH = 3.7; // y height
const RD = 2.6; // z depth of floor/ceiling (front edge at rel z 2.3)
const WALL_FRONT_Z = -0.08; // front face of the back wall

const WHITE_PANEL = "#e6e9ec";
const WHITE_DOOR = "#dde1e5";
const DARK_HOUSING = "#22262c";

/** One white meter column: breaker band above, LCD meter middle, door below. */
function MeterColumn({ x }: { x: number }) {
  return (
    <group position={[x, -0.15, -0.03]}>
      {/* column body, slightly proud of the wall */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.52, 2.7, 0.1]} />
        <meshStandardMaterial color={WHITE_PANEL} roughness={0.55} metalness={0.04} />
      </mesh>

      {/* ── breaker band ABOVE the meter ── */}
      <mesh position={[0, 1.0, 0.052]}>
        <planeGeometry args={[0.44, 0.34]} />
        <meshStandardMaterial color="#2a2f36" roughness={0.6} />
      </mesh>
      {[-0.15, -0.05, 0.05, 0.15].map((bx, i) => (
        <group key={`brk${i}`} position={[bx, 1.0, 0.058]}>
          <mesh>
            <boxGeometry args={[0.075, 0.2, 0.02]} />
            <meshStandardMaterial color="#cfd4d9" roughness={0.5} />
          </mesh>
          {/* toggle */}
          <mesh position={[0, i % 2 ? 0.045 : -0.045, 0.012]}>
            <boxGeometry args={[0.045, 0.06, 0.012]} />
            <meshStandardMaterial color={i % 3 === 2 ? "#3b4754" : "#1d232b"} roughness={0.45} />
          </mesh>
        </group>
      ))}

      {/* ── digital meter at mid-height ── */}
      <group position={[0, 0.18, 0.055]}>
        <mesh castShadow>
          <boxGeometry args={[0.3, 0.44, 0.06]} />
          <meshStandardMaterial color={DARK_HOUSING} roughness={0.5} metalness={0.15} />
        </mesh>
        {/* small LCD */}
        <mesh position={[0, 0.1, 0.033]}>
          <planeGeometry args={[0.2, 0.07]} />
          <meshBasicMaterial color="#a9bba4" toneMapped={false} />
        </mesh>
        <Text
          position={[0, 0.1, 0.04]}
          fontSize={0.038}
          color="#2c3530"
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.06}
        >
          04217.8
        </Text>
        {/* barcode label */}
        <mesh position={[0, -0.05, 0.033]}>
          <planeGeometry args={[0.18, 0.1]} />
          <meshBasicMaterial color="#f2f4f6" toneMapped={false} />
        </mesh>
        {[-0.06, -0.035, -0.005, 0.025, 0.055].map((lx, i) => (
          <mesh key={`bc${i}`} position={[lx, -0.04, 0.035]}>
            <planeGeometry args={[i % 2 ? 0.006 : 0.012, 0.05]} />
            <meshBasicMaterial color="#23282e" toneMapped={false} />
          </mesh>
        ))}
        {/* comms LED */}
        <mesh position={[0.1, -0.16, 0.033]}>
          <circleGeometry args={[0.012, 10]} />
          <meshBasicMaterial color={SCENE.green} toneMapped={false} />
        </mesh>
      </group>

      {/* ── blank panel door below ── */}
      <mesh position={[0, -0.85, 0.052]}>
        <planeGeometry args={[0.44, 1.0]} />
        <meshStandardMaterial color={WHITE_DOOR} roughness={0.5} />
      </mesh>
      {/* door lock */}
      <mesh position={[0.16, -0.85, 0.056]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.022, 0.022, 0.012, 10]} />
        <meshStandardMaterial color="#9aa2aa" metalness={0.6} roughness={0.4} />
      </mesh>
    </group>
  );
}

/** Dark server rack with blinking LED dots (left background, REF-2). */
function ServerRack({ pos }: { pos: [number, number, number] }) {
  const ledsRef = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    ledsRef.current?.children.forEach((c, i) => {
      const m = (c as THREE.Mesh).material as THREE.MeshBasicMaterial;
      m.opacity = 0.35 + 0.55 * (Math.sin(t * (1.4 + (i % 5) * 0.7) + i * 2.1) > 0.2 ? 1 : 0.15);
    });
  });
  const ledColors = [SCENE.green, SCENE.teal, SCENE.green, SCENE.amber, SCENE.teal];
  return (
    <group position={pos}>
      {/* cabinet */}
      <mesh castShadow>
        <boxGeometry args={[0.7, 2.1, 0.75]} />
        <meshStandardMaterial color="#15181d" roughness={0.55} metalness={0.25} />
      </mesh>
      {/* rack unit seams on the front (+x) */}
      {[-0.75, -0.45, -0.15, 0.15, 0.45, 0.75].map((y, i) => (
        <mesh key={`ru${i}`} position={[0.352, y, 0]}>
          <boxGeometry args={[0.004, 0.012, 0.66]} />
          <meshStandardMaterial color="#262b32" roughness={0.5} />
        </mesh>
      ))}
      {/* blinking LEDs */}
      <group ref={ledsRef}>
        {Array.from({ length: 10 }).map((_, i) => (
          <mesh
            key={`led${i}`}
            position={[0.356, 0.78 - (i % 5) * 0.3, i < 5 ? -0.2 : 0.16]}
            rotation={[0, Math.PI / 2, 0]}
          >
            <circleGeometry args={[0.014, 8]} />
            <meshBasicMaterial
              color={ledColors[i % 5]}
              transparent
              opacity={0.6}
              toneMapped={false}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}

export default function TechRoom() {
  const meterLight = useRef<THREE.PointLight>(null);
  const meterFill = useRef<THREE.PointLight>(null);
  const hubLight = useRef<THREE.PointLight>(null);
  const hubFill = useRef<THREE.PointLight>(null);

  // Light-grey concrete on the back wall (REF-2/REF-3): real grain, tinted
  // light so the room reads bright + clean once the task lights ramp.
  const wallTex = usePBR("concrete", [3, 2]);

  useFrame(() => {
    const wHub = smooth01(emphasisWeight("hub", 1.1));
    const wPv = smooth01(emphasisWeight("pv", 1.1));
    // meter wall side (powermieter chapter) — bright, white-room feel
    if (meterLight.current) meterLight.current.intensity = 1.6 + wPv * 14;
    if (meterFill.current) meterFill.current.intensity = 0.8 + wPv * 6.5;
    // hub side (hub chapter)
    if (hubLight.current) hubLight.current.intensity = 1.8 + wHub * 9;
    if (hubFill.current) hubFill.current.intensity = 1.0 + wHub * 4.5;
  });

  return (
    <group position={ROOM_POS}>
      {/* ── room shell ── */}
      {/* back wall — light-grey concrete (REF-2) */}
      <mesh position={[0, 0, -0.18]} ref={ensureUv2} receiveShadow>
        <boxGeometry args={[RW, RH, 0.2]} />
        <meshStandardMaterial
          color="#b9bfc5"
          map={wallTex.map}
          normalMap={wallTex.normalMap}
          roughnessMap={wallTex.roughnessMap}
          aoMap={wallTex.aoMap}
          aoMapIntensity={0.5}
          normalScale={new THREE.Vector2(0.5, 0.5)}
          roughness={0.85}
          metalness={0.02}
        />
      </mesh>
      {/* floor — grey screed */}
      <mesh position={[0, -RH / 2, 1.0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[RW, RD + 0.1]} />
        <meshStandardMaterial color="#6f7780" roughness={0.9} side={THREE.FrontSide} />
      </mesh>
      {/* ceiling */}
      <mesh position={[0, RH / 2, 1.0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[RW, RD + 0.1]} />
        <meshStandardMaterial color="#9aa0a8" roughness={0.9} side={THREE.FrontSide} />
      </mesh>
      {/* side walls (stay INSIDE the tower envelope: outer face ≤ ±2.95) */}
      <mesh position={[-2.85, 0, 1.0]}>
        <boxGeometry args={[0.2, RH, RD + 0.1]} />
        <meshStandardMaterial color="#aab0b6" roughness={0.9} side={THREE.FrontSide} />
      </mesh>
      <mesh position={[2.85, 0, 1.0]}>
        <boxGeometry args={[0.2, RH, RD + 0.1]} />
        <meshStandardMaterial color="#aab0b6" roughness={0.9} side={THREE.FrontSide} />
      </mesh>

      {/* ── REF-3: the Zählerwand (left section of the back wall) ── */}
      {/* tall white cabinet door with black handle, far left */}
      <group position={[-2.45, -0.15, -0.03]}>
        <mesh castShadow>
          <boxGeometry args={[0.55, 2.7, 0.1]} />
          <meshStandardMaterial color={WHITE_PANEL} roughness={0.55} metalness={0.04} />
        </mesh>
        <mesh position={[0.2, 0, 0.058]}>
          <boxGeometry args={[0.03, 0.34, 0.025]} />
          <meshStandardMaterial color="#15181d" roughness={0.4} metalness={0.3} />
        </mesh>
        {/* door seam */}
        <mesh position={[-0.26, 0, 0.052]}>
          <boxGeometry args={[0.006, 2.6, 0.004]} />
          <meshStandardMaterial color="#c2c8cd" roughness={0.6} />
        </mesh>
      </group>

      {/* five identical white meter columns */}
      {[-1.86, -1.32, -0.78, -0.24, 0.3].map((x) => (
        <MeterColumn key={`col${x}`} x={x} />
      ))}

      {/* cable tray with cables along the ceiling */}
      <group position={[0, 1.52, 0.14]}>
        <mesh castShadow>
          <boxGeometry args={[5.5, 0.06, 0.3]} />
          <meshStandardMaterial color="#838b93" metalness={0.55} roughness={0.45} />
        </mesh>
        {[-0.09, 0, 0.09].map((dz, i) => (
          <mesh key={`cb${i}`} position={[0, 0.05, dz]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.018, 0.018, 5.4, 8]} />
            <meshStandardMaterial
              color={["#1d2126", "#3c444e", "#2a3038"][i]}
              roughness={0.7}
            />
          </mesh>
        ))}
      </group>

      {/* ── REF-2: the Hub on the bare concrete section, right ── */}
      <group position={[1.62, -0.12, 0]}>
        <Hub />
      </group>

      {/* THREE grey conduits entering the Hub from the TOP (ceiling) */}
      {[-0.28, 0, 0.28].map((dx, i) => (
        <group key={`cond${i}`}>
          <mesh position={[1.62 + dx, 1.41, WALL_FRONT_Z + 0.06]}>
            <cylinderGeometry args={[0.038, 0.038, 0.88, 12]} />
            <meshStandardMaterial color="#8b9199" metalness={0.35} roughness={0.5} />
          </mesh>
          {/* clamp */}
          <mesh position={[1.62 + dx, 1.26, WALL_FRONT_Z + 0.06]}>
            <boxGeometry args={[0.1, 0.04, 0.1]} />
            <meshStandardMaterial color="#6e757d" metalness={0.4} roughness={0.5} />
          </mesh>
        </group>
      ))}

      {/* galvanized vertical conduit beside the Hub (right) */}
      <mesh position={[2.52, 0, WALL_FRONT_Z + 0.07]}>
        <cylinderGeometry args={[0.05, 0.05, RH - 0.1, 12]} />
        <meshStandardMaterial color="#aeb6bd" metalness={0.75} roughness={0.32} />
      </mesh>
      {[0.9, -0.6].map((y, i) => (
        <mesh key={`clp${i}`} position={[2.52, y, WALL_FRONT_Z + 0.05]}>
          <boxGeometry args={[0.14, 0.05, 0.08]} />
          <meshStandardMaterial color="#7d858d" metalness={0.5} roughness={0.45} />
        </mesh>
      ))}

      {/* white sub-panel box, between Hub and conduit, lower */}
      <group position={[2.22, -0.85, WALL_FRONT_Z + 0.07]}>
        <mesh castShadow>
          <boxGeometry args={[0.42, 0.58, 0.12]} />
          <meshStandardMaterial color="#eef0f2" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0, 0.062]}>
          <planeGeometry args={[0.34, 0.48]} />
          <meshStandardMaterial color="#dfe3e7" roughness={0.55} />
        </mesh>
        <mesh position={[0.13, 0, 0.07]}>
          <boxGeometry args={[0.02, 0.1, 0.02]} />
          <meshStandardMaterial color="#3c444e" roughness={0.5} />
        </mesh>
      </group>

      {/* room door with steel handle on the right side wall (REF-3) */}
      <group position={[2.72, -0.78, 1.1]}>
        <mesh>
          <boxGeometry args={[0.06, 2.1, 0.92]} />
          <meshStandardMaterial color="#c6ccd1" roughness={0.6} side={THREE.FrontSide} />
        </mesh>
        <mesh position={[-0.05, 0, 0.32]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.018, 0.018, 0.18, 8]} />
          <meshStandardMaterial color="#8e979f" metalness={0.8} roughness={0.25} />
        </mesh>
      </group>

      {/* dark server rack with blinking LEDs, left background (REF-2) — kept
          deep against the left wall so it reads as background, not foreground */}
      <ServerRack pos={[-2.38, -0.7, 0.45]} />

      {/* ── ceiling strip lights (always-on fixtures) ── */}
      {[-1.3, 1.4].map((x, i) => (
        <mesh key={`strip${i}`} position={[x, RH / 2 - 0.03, 0.55]}>
          <boxGeometry args={[1.5, 0.05, 0.16]} />
          <meshBasicMaterial color="#dfe9ee" toneMapped={false} />
        </mesh>
      ))}

      {/* ── task lighting ── */}
      {/* meter wall side (powermieter) — bright clean white-room ramp */}
      <pointLight
        ref={meterLight}
        position={[-0.9, 0.8, 1.5]}
        intensity={1.6}
        color="#edf3f6"
        distance={10}
        decay={2}
      />
      <pointLight
        ref={meterFill}
        position={[-1.3, -0.1, 2.4]}
        intensity={0.8}
        color="#dbe6ec"
        distance={11}
        decay={2}
      />
      {/* hub side */}
      <pointLight
        ref={hubLight}
        position={[1.6, 0.9, 1.4]}
        intensity={1.8}
        color="#eaf4f6"
        distance={9}
        decay={2}
      />
      <pointLight
        ref={hubFill}
        position={[1.7, 0.2, 2.4]}
        intensity={1.0}
        color="#dbe9ef"
        distance={11}
        decay={2}
      />
      {/* steady warm fill so the room never reads black between chapters */}
      <pointLight
        position={[0.2, -0.2, 1.2]}
        intensity={0.9}
        color={SCENE.warm}
        distance={7}
        decay={2}
      />
    </group>
  );
}
