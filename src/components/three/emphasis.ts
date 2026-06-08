import { SECTIONS, type Emphasis } from "@/content/sections";
import { getSectionFloat } from "@/lib/scrollProgress";

/**
 * Per-frame emphasis weight for a given scene element, in [0,1].
 *
 * Each chapter "emphasises" one element (see sections.ts). As the user scrolls
 * we want that element to glow/brighten and fade back out. We compute a soft
 * triangular falloff around every section whose `emphasis` matches, so an
 * element that is highlighted in multiple chapters stays lit across them.
 *
 * `falloff` controls how wide (in section-units) the glow ramp is.
 */
export function emphasisWeight(target: Emphasis, falloff = 0.85): number {
  const s = getSectionFloat();
  let w = 0;
  for (const sec of SECTIONS) {
    if (sec.emphasis !== target && !(target !== "all" && sec.emphasis === "all"))
      continue;
    // "all" chapter lights everything a little.
    const base = sec.emphasis === "all" && target !== "all" ? 0.55 : 1;
    const d = Math.abs(s - sec.index);
    if (d < falloff) {
      w = Math.max(w, base * (1 - d / falloff));
    }
  }
  return w;
}

/** Smoothstep easing for nicer ramps. */
export function smooth01(t: number) {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
}
