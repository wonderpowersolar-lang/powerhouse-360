/**
 * Interactive Building Explorer — focus store (NRG "click a zone → fly in").
 *
 * A module-level singleton, same pattern as `scrollProgress.ts`: the R3F render
 * loop reads `focusBlend` every frame (no React state → no per-frame
 * re-renders), while DOM components (hotspot pins, the focus overlay, the back
 * button, the module rail) subscribe through `useSyncExternalStore` and only
 * re-render when the discrete `focusId` actually changes.
 *
 * ── How the camera handoff works ────────────────────────────────────────────
 * `focusId` is the explorer module currently flown-into (or null on the
 * overview). `focusBlend` is a GSAP-tweened 0..1 the CameraRig blends OVER the
 * scroll-driven pose: 0 = pure scroll journey (nothing focused), 1 = fully
 * parked on the focused module's keyframe. The tween (set up in CameraRig via
 * registerBlendTween) eases blend → 1 on setFocus and → 0 on clearFocus, so the
 * fly-in/out is a deliberate-but-calm glide and the scroll story is byte-for-
 * byte unchanged whenever blend returns to 0.
 *
 * The store is UI-framework-agnostic: it never imports React-DOM-only APIs at
 * module scope, only the `useSyncExternalStore` hook for the subscribe helper.
 */

import { useSyncExternalStore } from "react";
import { SECTIONS } from "@/content/sections";

/** A clickable building zone: a labelled pin anchored to a real 3D point. */
export interface Hotspot {
  /** explorer id, also the section id it focuses */
  id: string;
  /** "01".."06" — the Razorpay numeral */
  number: string;
  /** short module name shown on the chip */
  name: string;
  /** German micro-label under the name ("Dach / PV") */
  zone: string;
  /** world-space anchor the pin projects from (on a VISIBLE exterior face so
   *  it is never occluded in the overview three-quarter framing) */
  anchor: [number, number, number];
  /** index into SECTIONS — the keyframe the camera flies to on click */
  sectionIndex: number;
  /** brand accent for this module */
  accent: "green" | "teal" | "aqua" | "amber" | "blue";
}

/**
 * The six product zones, in walk order. Anchors sit on the +z front facade
 * (z≈3.06), the roof, or the right plaza — all visible from the hero camera
 * (≈ [16,13,21] → [0,7.4,0]), so pins read like NRG's building-skin markers and
 * the building never hides them. Each `sectionIndex` reuses the existing
 * section camPos/camTarget keyframe, so the fly-in needs no new camera data.
 */
export const HOTSPOTS: Hotspot[] = [
  {
    id: "powermieter",
    number: "01",
    name: "Powermieter",
    zone: "Dach / PV",
    anchor: [0, 16.25, 1.6],
    sectionIndex: 1,
    accent: "green",
  },
  {
    id: "heatmieter",
    number: "02",
    name: "Heatmieter",
    zone: "Wärmepumpe",
    anchor: [4.7, 1.7, 1.5],
    sectionIndex: 2,
    accent: "teal",
  },
  {
    id: "hub",
    number: "03",
    name: "POWERHOUSE Hub",
    zone: "Technikraum",
    // ground-floor tech facade, front-left low — spread from the garage pin
    anchor: [-1.55, 2.0, 3.06],
    sectionIndex: 3,
    accent: "blue",
  },
  {
    id: "chargemieter",
    number: "04",
    name: "Chargemieter",
    zone: "Stellplätze",
    // garage is sub-grade; anchor at the ramp edge, front-right low
    anchor: [2.2, 0.45, 3.06],
    sectionIndex: 4,
    accent: "aqua",
  },
  {
    id: "smokemieter",
    number: "05",
    name: "Smokemieter",
    zone: "Treppenhaus",
    // a stairwell window, front-right upper-mid
    anchor: [2.2, 7.4, 3.06],
    sectionIndex: 5,
    accent: "amber",
  },
  {
    id: "residents",
    number: "06",
    name: "Bewohnerportal",
    zone: "Wohnung",
    // a lit apartment window, front-left upper
    anchor: [-2.2, 9.8, 3.06],
    sectionIndex: 6,
    accent: "green",
  },
];

/** Fast id → hotspot lookup. */
const BY_ID = new Map(HOTSPOTS.map((h) => [h.id, h] as const));

export function getHotspot(id: string | null): Hotspot | null {
  return id ? BY_ID.get(id) ?? null : null;
}

/* ────────────────────────────────────────────────────────────── state ──── */

const state = {
  /** Currently focused explorer id, or null on the overview. */
  focusId: null as string | null,
  /**
   * Camera focus blend 0..1, owned by the GSAP tween in CameraRig. Read every
   * frame by the rig — NEVER pushed through React. 0 = pure scroll journey,
   * 1 = parked on the focused keyframe.
   */
  focusBlend: 0,
};

/** DOM subscribers (pins / overlay / rail). Notified only on focusId change. */
const listeners = new Set<() => void>();
function emit() {
  for (const l of listeners) l();
}

/* ─────────────────────────────────────────────── blend target bridge ───── */

/**
 * The blend is eased toward this TARGET (0 = overview, 1 = parked on the zone)
 * inside the CameraRig's per-frame loop, using the real frame delta. We do NOT
 * use a GSAP/rAF ticker for it: in an R3F app the render FPS (and therefore any
 * rAF-driven ticker) can drop under SwiftShader / heavy first frames, which
 * would stall or slow the fly-in. Driving the blend from `useFrame` with the
 * frame delta keeps the fly-in duration tied to WALL-CLOCK time regardless of
 * frame rate — the camera glide is always ~1.2s.
 */
let blendTarget = 0;

export function getBlendTarget() {
  return blendTarget;
}

/** Set the blend destination (the rig eases `focusBlend` toward it per frame). */
function setBlendTarget(to: 0 | 1) {
  blendTarget = to;
}

export function getFocusBlend() {
  return state.focusBlend;
}

/** Written by the rig each frame as it eases toward the target. Not React-visible. */
export function setFocusBlend(v: number) {
  state.focusBlend = Math.min(1, Math.max(0, v));
}

/* ──────────────────────────────────────────────────────── actions ──────── */

/**
 * Fly into a module. Sets `focusId` (notifies DOM) and tweens blend → 1. Going
 * module → module just retargets the keyframe while staying parked (blend held
 * at 1), so there is no detour out through the overview.
 */
export function setFocus(id: string) {
  if (!BY_ID.has(id)) return;
  if (state.focusId === id) return;
  state.focusId = id;
  emit();
  // Target blend 1. On ENTER from the overview the rig eases 0→1 (the fly-in);
  // module→module keeps the target at 1 and the rig simply glides between the
  // two keyframes (no detour out through the overview).
  setBlendTarget(1);
}

/** Fly back out to the overview. Eases blend → 0; the rig hands back to scroll. */
export function clearFocus() {
  if (state.focusId === null) return;
  state.focusId = null;
  emit();
  setBlendTarget(0);
}

export function getFocusId() {
  return state.focusId;
}

/** Resolved focused SECTION INDEX, or -1 on the overview (used by the rig). */
export function getFocusSectionIndex(): number {
  const h = getHotspot(state.focusId);
  return h ? h.sectionIndex : -1;
}

/* ───────────────────────────────────────────── React subscription ──────── */

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/** Subscribe a DOM component to the discrete focusId (re-renders on change). */
export function useFocusId(): string | null {
  return useSyncExternalStore(
    subscribe,
    () => state.focusId,
    () => null
  );
}

/** Subscribe and resolve straight to the focused hotspot (or null). */
export function useFocusHotspot(): Hotspot | null {
  const id = useFocusId();
  return getHotspot(id);
}

/** Guard so a section index that has no hotspot is treated as non-focusable. */
export function isFocusable(sectionIndex: number): boolean {
  return HOTSPOTS.some((h) => h.sectionIndex === sectionIndex);
}

/** Map a section id → hotspot id (for the rail), or null if not a product zone. */
export function hotspotIdForSection(sectionId: string): string | null {
  const sec = SECTIONS.find((s) => s.id === sectionId);
  if (!sec) return null;
  return HOTSPOTS.find((h) => h.sectionIndex === sec.index)?.id ?? null;
}
