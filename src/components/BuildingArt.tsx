/**
 * Lightweight SVG building illustration — used as the mobile hero "static
 * render" and as a graceful fallback when the 3D scene isn't run. Evening
 * mood: navy facade, warm lit windows, rooftop PV, brand green/teal accents.
 * Pure SVG, no JS, performs everywhere. Mirrors the 3D scene's language.
 */
export default function BuildingArt({ className = "" }: { className?: string }) {
  const lit = [
    [0, 0], [2, 0], [3, 1], [1, 2], [3, 3], [0, 3], [2, 4], [1, 4], [3, 0],
  ];
  const cols = 4;
  const rows = 5;
  return (
    <svg
      viewBox="0 0 360 420"
      className={className}
      role="img"
      aria-label="Mehrfamilienhaus mit Photovoltaik, Wärmepumpe und beleuchteten Fenstern bei Abenddämmerung"
    >
      <defs>
        <radialGradient id="sky" cx="50%" cy="20%" r="90%">
          <stop offset="0%" stopColor="#1b2a4a" />
          <stop offset="60%" stopColor="#0d1626" />
          <stop offset="100%" stopColor="#090f1a" />
        </radialGradient>
        <linearGradient id="band" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#3db36a" />
          <stop offset="100%" stopColor="#2bb6b0" />
        </linearGradient>
        <linearGradient id="pv" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#16243f" />
          <stop offset="100%" stopColor="#0a1220" />
        </linearGradient>
      </defs>

      <rect width="360" height="420" fill="url(#sky)" />

      {/* ground */}
      <rect y="370" width="360" height="50" fill="#0a1220" />

      {/* heat pump (left courtyard) */}
      <g transform="translate(40 320)">
        <rect width="46" height="40" rx="4" fill="#4a6075" />
        <circle cx="14" cy="20" r="13" fill="#0d1626" />
        <circle cx="14" cy="20" r="4" fill="#5a7184" />
        <rect x="-4" y="40" width="54" height="6" fill="#16243f" />
      </g>

      {/* building body */}
      <g transform="translate(110 90)">
        {/* roof PV */}
        <g transform="translate(6 -2)">
          {[0, 1, 2, 3].map((i) => (
            <rect
              key={i}
              x={i * 33}
              y={-8 - i * 0}
              width="30"
              height="16"
              rx="1.5"
              fill="url(#pv)"
              stroke="#43b649"
              strokeOpacity="0.5"
              strokeWidth="1"
              transform="skewX(-12)"
            />
          ))}
        </g>

        {/* facade */}
        <rect y="6" width="138" height="280" rx="3" fill="#1b2a4a" />
        {/* brand band */}
        <rect y="64" width="138" height="6" fill="url(#band)" opacity="0.9" />
        {/* base */}
        <rect y="286" width="138" height="20" fill="#16243f" />
        {/* entrance */}
        <rect x="56" y="262" width="26" height="44" rx="2" fill="#f5be75" opacity="0.55" />

        {/* windows */}
        {Array.from({ length: rows }).map((_, r) =>
          Array.from({ length: cols }).map((_, c) => {
            const isLit = lit.some(([lr, lc]) => lr === r && lc === c);
            return (
              <rect
                key={`${r}-${c}`}
                x={14 + c * 30}
                y={78 + r * 38}
                width="20"
                height="26"
                rx="1.5"
                fill={isLit ? "#f5be75" : "#20344f"}
                opacity={isLit ? 0.92 : 0.8}
              />
            );
          })
        )}
      </g>

      {/* subtle teal energy line roof→ground */}
      <path
        d="M180 88 C 150 160, 150 240, 168 360"
        stroke="#2bb6b0"
        strokeOpacity="0.35"
        strokeWidth="1.5"
        fill="none"
        strokeDasharray="3 6"
      />
    </svg>
  );
}
