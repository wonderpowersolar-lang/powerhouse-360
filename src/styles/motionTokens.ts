/**
 * POWERHOUSE 360 — motion tokens.
 *
 * Single source of truth for the "Approach · Hold · Reveal · Explain ·
 * Transition" beat system. Consumed by the scroll core (scrollProgress.ts),
 * the section layout heights and any CSS transition that participates in
 * the journey.
 */

/** Easing curves. `calm` is the house ease — long, settled, no bounce. */
export const ease = {
  calm: "cubic-bezier(0.22, 1, 0.36, 1)",
} as const;

/** Durations in ms. */
export const dur = {
  /** copy/card reveal slide/fade (beat 3). */
  reveal: 550,
  /** copy/card exit (beat 5). */
  exit: 250,
} as const;

/**
 * Plateau share of a station's scroll band (0..1). The stage RESTS on the
 * station keyframe for this fraction of the band; the remaining (1 − hold)
 * is travel, split between the release out of the previous station and the
 * approach into the next (see APPROACH_SPLIT).
 */
export const hold = {
  default: 0.75,
  /** Hero / Platform / CTA — long holds. */
  long: 0.8,
} as const;

/**
 * How the travel between two keyframes is split across the band boundary:
 * this share lands at the START of the next band (the Approach beat), the
 * rest at the END of the current band (the Transition/release beat).
 */
export const APPROACH_SPLIT = 0.75;

/**
 * Section band heights (vh). Taller bands = longer perceived holds.
 * The hero gets the longest runway — its band drives the scrubbed 360°
 * orbit, and more height means finer scrub granularity per wheel tick.
 */
const BAND_HEIGHT: Record<string, number> = {
  hero: 300, // scrubbed orbit runway
  system: 210,
  exploded: 210,
  dashboard: 220,
  cta: 190,
};

export function sectionHeightVh(id: string): number {
  return BAND_HEIGHT[id] ?? 190;
}
