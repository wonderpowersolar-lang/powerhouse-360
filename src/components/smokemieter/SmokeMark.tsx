/**
 * SmokeMieter-Bildmarke (Wolke · Gebäude · Funkwellen) als Inline-SVG —
 * gleiche Geometrie wie das Favicon (/smokemieter-icon.svg), damit Tab,
 * Nav und Marke identisch zeichnen. Ersetzt später ggf. das Original-Asset
 * aus public/brand/, sobald es im Repo liegt.
 */
export default function SmokeMark({ size = 36 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      aria-hidden
      focusable="false"
    >
      <defs>
        <linearGradient id="sm-mark-cloud" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#333944" />
          <stop offset="0.5" stopColor="#8a5c33" />
          <stop offset="1" stopColor="#e8973c" />
        </linearGradient>
      </defs>
      <g fill="url(#sm-mark-cloud)">
        <circle cx="21" cy="22" r="12" />
        <circle cx="38" cy="17" r="13" />
        <circle cx="49" cy="27" r="10" />
        <rect x="9" y="22" width="50" height="18" rx="9" />
      </g>
      <g fill="#fff">
        <rect x="24" y="11" width="16" height="4.4" rx="1.2" />
        <rect x="24" y="17.2" width="16" height="4.4" rx="1.2" />
        <rect x="24" y="23.4" width="16" height="4.4" rx="1.2" />
        <rect x="24" y="29.6" width="16" height="4.4" rx="1.2" />
      </g>
      <g
        fill="none"
        stroke="#e8973c"
        strokeWidth="4.4"
        strokeLinecap="round"
      >
        <path d="M21.5 49.5a15 15 0 0 1 21 0" />
        <path d="M27.5 56.5a8 8 0 0 1 9 0" />
      </g>
    </svg>
  );
}
