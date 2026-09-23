interface GardenArchProps {
  className?: string;
}

/**
 * A jharokha-style scalloped arch, traced as line art — the recurring frame
 * every version 14 scene sits inside, echoing a garden pavilion without
 * depending on any photographic or AI-generated artwork.
 */
export function GardenArch({ className = "" }: GardenArchProps) {
  return (
    <svg
      viewBox="0 0 400 520"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      {/* Outer scalloped arch */}
      <path
        d="M20 520 V180 Q20 40 200 20 Q380 40 380 180 V520"
        stroke="currentColor"
        strokeWidth="2"
      />
      {/* Inner arch, a little in from the outer line */}
      <path
        d="M46 520 V182 Q46 64 200 46 Q354 64 354 182 V520"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.6"
      />
      {/* Cusps along the crown of the arch */}
      {[-120, -80, -40, 0, 40, 80, 120].map((offset) => (
        <path
          key={offset}
          d={`M${200 + offset - 18} ${52 + Math.abs(offset) * 0.28} q18 -22 36 0`}
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.5"
          transform={`translate(0 ${Math.abs(offset) > 80 ? 6 : 0})`}
        />
      ))}
      {/* Finial */}
      <path d="M200 20 V4 M192 10 h16" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="200" cy="4" r="3" fill="currentColor" />
    </svg>
  );
}

/** A single trailing garland leaf, for scattering along an arch or a border. */
function GarlandSprig({ x, y, scale = 1, rotate = 0 }: { x: number; y: number; scale?: number; rotate?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`}>
      <path
        d="M0 0 C -8 10, -6 24, 0 34 C 6 24, 8 10, 0 0Z"
        fill="currentColor"
        opacity="0.85"
      />
      <path d="M0 4 V30" stroke="var(--color-cream-v2)" strokeWidth="0.6" opacity="0.5" />
    </g>
  );
}

/** A garland draped along the top of a scene, in the sage foliage tone. */
export function GardenGarland({ className = "" }: GardenArchProps) {
  const sprigs = Array.from({ length: 11 }, (_, i) => ({
    x: 40 + i * 32,
    y: 6 + Math.sin(i * 0.9) * 10,
    scale: 0.7 + (i % 3) * 0.15,
    rotate: (i % 2 === 0 ? -1 : 1) * (8 + (i % 4) * 6),
  }));
  return (
    <svg viewBox="0 0 400 60" fill="none" className={className} aria-hidden="true">
      <path d="M0 8 Q200 44 400 8" stroke="currentColor" strokeWidth="1" opacity="0.4" />
      {sprigs.map((sprig, i) => (
        <GarlandSprig key={i} {...sprig} />
      ))}
    </svg>
  );
}
