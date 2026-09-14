/**
 * The K&S wedding monogram, drawn as separate parts so the loader can bring
 * them in one by one: laurel branches, the K with its summit and ice axe, the
 * ampersand, and the S with its dancer.
 */

const LAURELS = 13;

function branch(side: "left" | "right") {
  const cx = 200;
  const cy = 218;
  const r = 178;
  // Angles sweep from the bottom of each side up towards the top gap.
  const from = side === "left" ? 208 : -28;
  const to = side === "left" ? 98 : 82;
  return Array.from({ length: LAURELS }, (_, i) => {
    const t = i / (LAURELS - 1);
    const angle = from + (to - from) * t;
    const rad = (angle * Math.PI) / 180;
    const x = cx + r * Math.cos(rad);
    const y = cy - r * Math.sin(rad);
    // Leaves lie along the tangent, alternating inside/outside the stem.
    const tangent = angle + (side === "left" ? -90 : 90);
    const size = 0.75 + 0.35 * Math.sin(t * Math.PI);
    return { x, y, tangent, size, key: `${side}-${i}` };
  });
}

export default function Monogram({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 400"
      className={className}
      aria-label="K and S monogram"
      role="img"
    >
      <defs>
        <linearGradient id="mono-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#a8862e" />
          <stop offset="45%" stopColor="#e6cd73" />
          <stop offset="100%" stopColor="#b08a35" />
        </linearGradient>
        <linearGradient id="mono-blue" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#12336e" />
          <stop offset="55%" stopColor="#2b62a8" />
          <stop offset="100%" stopColor="#7fb0dd" />
        </linearGradient>
        <linearGradient id="mono-pink" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#b3245f" />
          <stop offset="55%" stopColor="#dc4f8b" />
          <stop offset="100%" stopColor="#f2a9c6" />
        </linearGradient>
      </defs>

      {/* Laurel branches */}
      {(["left", "right"] as const).map((side) => (
        <g key={side} data-part={`laurel-${side}`} fill="url(#mono-gold)">
          {branch(side).map((leaf) => (
            <g
              key={leaf.key}
              data-leaf
              transform={`translate(${leaf.x.toFixed(1)} ${leaf.y.toFixed(1)}) rotate(${leaf.tangent.toFixed(1)}) scale(${leaf.size.toFixed(2)})`}
            >
              <ellipse
                cx="0"
                cy="-11"
                rx="5.5"
                ry="12"
                transform="rotate(-32)"
              />
              <ellipse cx="0" cy="11" rx="5.5" ry="12" transform="rotate(32)" />
            </g>
          ))}
        </g>
      ))}

      {/* S with the dancer — drawn first so the K's leg sits over its curve */}
      <g data-part="s">
        <text
          x="220"
          y="284"
          fontFamily="var(--font-serif)"
          fontSize="210"
          fontWeight="500"
          fill="url(#mono-pink)"
        >
          S
        </text>
      </g>
      <g data-part="dancer" fill="url(#mono-pink)" transform="translate(14 -4)">
        <circle cx="306" cy="112" r="8" />
        {/* torso, raised arm, reaching arm */}
        <path d="M306 121 c -5 10, -7 26, -6 44 l 14 2 c 2 -18, 0 -34, -6 -46 z" />
        <path d="M309 128 c 6 -8, 12 -20, 20 -34 l 5 2 c -5 16, -11 28, -19 38 z" />
        <path d="M311 145 c 12 2, 22 6, 34 12 l -2 5 c -12 -5, -22 -8, -34 -9 z" />
        {/* skirt and legs */}
        <path d="M300 165 c -18 20, -24 42, -14 68 c 18 -3, 32 -6, 42 -10 c 3 -26, -4 -42, -10 -58 z" />
        <path d="M290 232 c -6 12, -12 22, -18 34 l 6 3 c 6 -10, 12 -20, 20 -30 z" />
        <path d="M322 224 c 3 12, 6 22, 8 34 l -6 2 c -3 -10, -7 -20, -12 -30 z" />
      </g>

      {/* K with summit and ice axe */}
      <g data-part="k">
        <text
          x="74"
          y="284"
          fontFamily="var(--font-serif)"
          fontSize="210"
          fontWeight="500"
          fill="url(#mono-blue)"
        >
          K
        </text>
      </g>
      <g
        data-part="summit"
        fill="none"
        stroke="#173a75"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path data-draw d="M112 152 l 16 -26 l 11 15 l 13 -21 l 15 24" />
        <path data-draw d="M198 96 L 138 160" strokeWidth="5.5" />
        <path data-draw d="M194 92 l 22 -3 l -10 10" strokeWidth="5" />
      </g>

      {/* Ampersand */}
      <g data-part="amp">
        <text
          x="203"
          y="270"
          textAnchor="middle"
          fontFamily="var(--font-serif)"
          fontSize="44"
          fontStyle="italic"
          fill="url(#mono-gold)"
        >
          &amp;
        </text>
      </g>
    </svg>
  );
}
