/* eslint-disable @next/next/no-img-element */
/**
 * SmokeMieter-Bildmarke — rendert das Original-Asset aus public/brand/
 * (Design-Export als SVG, identisch mit dem Favicon der Route).
 */
export default function SmokeMark({ size = 36 }: { size?: number }) {
  return (
    <img
      src="/brand/smokemieter-mark.svg"
      width={size}
      height={size}
      alt=""
      aria-hidden
      draggable={false}
      style={{ display: "block" }}
    />
  );
}
