/**
 * Scene color constants — mirror the brand tokens in globals.css.
 * Kept as plain hex so three.Color can consume them directly.
 */
export const SCENE = {
  navy900: "#0d1626",
  navy800: "#16243f",
  navy700: "#1b2a4a",
  navy600: "#20344f",
  slate: "#4a6075",
  slateLight: "#5a7184",
  green: "#43b649",
  greenSoft: "#3db36a",
  teal: "#2bb6b0",
  tealSoft: "#3aa8a0",
  aqua: "#80cec1",
  warm: "#f5be75",
  amber: "#ec7b13",
  white: "#eef3f8",
} as const;
