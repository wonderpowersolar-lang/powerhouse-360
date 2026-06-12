/**
 * POWERHOUSE360 — motion tokens (DESIGN-DIRECTION.md §5).
 *
 * Single source of truth for the "Approach · Hold · Reveal · Explain ·
 * Transition" beat system. Consumed by the scroll core (scrollProgress.ts),
 * the ProductPanel reveal state machine, the section layout heights and any
 * CSS transition that participates in the journey.
 */

/** Easing curves. `calm` is the house ease — long, settled, no bounce. */
export const ease = {
  calm: "cubic-bezier(0.22, 1, 0.36, 1)",
} as const;

/** Durations in ms. */
export const dur = {
  /** ProductPanel reveal slide/fade (beat 3). */
  reveal: 550,
  /** ProductPanel exit (beat 5). */
  exit: 250,
} as const;

/**
 * Plateau share of a station's scroll band (0..1). The camera RESTS on the
 * station keyframe for this fraction of the band; the remaining (1 − hold)
 * is travel, split between the release out of the previous station and the
 * approach into the next (see APPROACH_SPLIT).
 */
export const hold = {
  default: 0.75,
  /** Heatmieter — the longest hold (§3). */
  heat: 0.8,
  /** Hero / Dashboard / CTA — long holds. */
  long: 0.8,
} as const;

/**
 * How the travel between two keyframes is split across the band boundary:
 * this share lands at the START of the next band (the Approach beat), the
 * rest at the END of the current band (the Transition/release beat). 0.75 →
 * most of the flight happens INSIDE the incoming band, so at ~10% band depth
 * the camera is still visibly arriving (beat 1), while the short release tail
 * lets the panel finish its 250ms exit before the camera leaves (beat 5).
 */
export const APPROACH_SPLIT = 0.75;

/**
 * Section band heights (vh). Taller bands = longer perceived holds.
 * Hero, Heatmieter and the platform Dashboard get the longest stages.
 */
const TALL_SECTIONS = new Set(["hero", "heatmieter", "dashboard"]);

export function sectionHeightVh(id: string): number {
  return TALL_SECTIONS.has(id) ? 220 : 190;
}
