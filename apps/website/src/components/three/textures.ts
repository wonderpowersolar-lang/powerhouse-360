"use client";

/**
 * Real CC0 PBR texture maps (ambientCG, public-domain) for the scene's big
 * surfaces — the concrete facade, the asphalt street and the paving plaza.
 *
 * This is the main realism lever of the texture pass: each set ships a Color,
 * NormalGL, Roughness and AO map. We load them ONCE per set (drei's `useTexture`
 * caches by URL so the building, ground-floor plinth, street and plaza all share
 * the same GPU upload) and configure them correctly:
 *
 *   • wrapS = wrapT = RepeatWrapping, so the 1 m² tile tiles across big surfaces;
 *   • `repeat` is set PER MESH from the surface's real-world size (see usePBR's
 *     `repeat` arg) so concrete/asphalt grain looks life-sized, not stretched or
 *     postage-stamp tiny;
 *   • anisotropy = renderer max, so the grazing-angle ground (seen almost
 *     edge-on in the dusk three-quarter shots) stays crisp instead of smearing;
 *   • COLOR SPACES: the color map is sRGB, every data map (normal / roughness /
 *     ao) is linear (NoColorSpace) — getting this wrong is the classic "washed
 *     out / too dark" texture bug;
 *   • mipmaps on (trilinear min filter) for clean minification + perf.
 *
 * AO note: `aoMap` samples the SECOND uv set (`uv2`). The box/plane geometries we
 * apply these to only have `uv`, so callers must copy uv → uv2 on the geometry
 * (see `ensureUv2`). We keep `aoMapIntensity` modest so the baked tile-AO adds
 * grain without crushing the surface.
 */

import { useMemo } from "react";
import { useTexture } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

export type PBRSet = "concrete" | "asphalt" | "paving";

const FILES = (set: PBRSet) => ({
  map: `/textures/${set}/color.jpg`,
  normalMap: `/textures/${set}/normal.jpg`,
  roughnessMap: `/textures/${set}/roughness.jpg`,
  aoMap: `/textures/${set}/ao.jpg`,
});

export interface PBRMaps {
  map: THREE.Texture;
  normalMap: THREE.Texture;
  roughnessMap: THREE.Texture;
  aoMap: THREE.Texture;
}

/**
 * Load + configure one PBR set. `repeat` is the tiling count for THIS usage
 * (e.g. a 6 m facade with a 1.5 m tile → repeat ≈ [4, 4]). Because `useTexture`
 * returns the cached, shared Texture objects, we clone them per-usage so two
 * surfaces sharing a set can carry different `repeat` values without fighting.
 */
export function usePBR(
  set: PBRSet,
  repeat: [number, number] = [1, 1]
): PBRMaps {
  const files = FILES(set);
  const loaded = useTexture(files) as unknown as PBRMaps;
  const maxAniso = useThree((s) => s.gl.capabilities.getMaxAnisotropy());

  return useMemo(() => {
    const setup = (
      tex: THREE.Texture,
      colorSpace: THREE.ColorSpace
    ): THREE.Texture => {
      // Clone so per-usage repeat doesn't mutate the shared cached texture.
      const t = tex.clone();
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(repeat[0], repeat[1]);
      t.anisotropy = maxAniso;
      t.colorSpace = colorSpace;
      t.generateMipmaps = true;
      t.minFilter = THREE.LinearMipmapLinearFilter;
      t.magFilter = THREE.LinearFilter;
      t.needsUpdate = true;
      return t;
    };

    return {
      map: setup(loaded.map, THREE.SRGBColorSpace),
      normalMap: setup(loaded.normalMap, THREE.NoColorSpace),
      roughnessMap: setup(loaded.roughnessMap, THREE.NoColorSpace),
      aoMap: setup(loaded.aoMap, THREE.NoColorSpace),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [set, repeat[0], repeat[1], maxAniso, loaded]);
}

/**
 * Copy a geometry's `uv` attribute into `uv2` so `aoMap` has coordinates to
 * sample. Idempotent. Call as a ref callback on the mesh that carries AO:
 *   <mesh ref={ensureUv2}> … </mesh>
 */
export function ensureUv2(mesh: THREE.Mesh | null) {
  if (!mesh) return;
  const g = mesh.geometry as THREE.BufferGeometry;
  const uv = g.getAttribute("uv");
  if (uv && !g.getAttribute("uv2")) {
    g.setAttribute("uv2", new THREE.BufferAttribute(uv.array, uv.itemSize));
  }
}

/** Texture-set URLs, exported so callers can warm the drei cache / preload. */
export const PBR_FILES = FILES;
