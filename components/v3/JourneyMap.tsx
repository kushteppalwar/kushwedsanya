import type { JourneyStop } from "@/lib/content";
import {
  MAP_SIZE,
  distanceKm,
  graticule,
  project,
  type Bounds,
} from "@/lib/geo";

interface JourneyMapProps {
  from: JourneyStop;
  to: JourneyStop;
  className?: string;
}

interface Point {
  x: number;
  y: number;
}

/** Quadratic curve bowing east of the straight line, like a hand-drawn flight path. */
export function routeCurve(a: Point, b: Point, bow = 180) {
  const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const length = Math.hypot(dx, dy) || 1;
  const control = {
    x: mid.x + (dy / length) * bow,
    y: mid.y - (dx / length) * bow,
  };
  const point = (t: number) => ({
    x: (1 - t) ** 2 * a.x + 2 * (1 - t) * t * control.x + t ** 2 * b.x,
    y: (1 - t) ** 2 * a.y + 2 * (1 - t) * t * control.y + t ** 2 * b.y,
  });
  let pathLength = 0;
  let previous = a;
  for (let i = 1; i <= 80; i += 1) {
    const current = point(i / 80);
    pathLength += Math.hypot(current.x - previous.x, current.y - previous.y);
    previous = current;
  }
  return {
    d: `M ${a.x} ${a.y} Q ${control.x} ${control.y} ${b.x} ${b.y}`,
    mid: point(0.5),
    pathLength,
    point,
  };
}

/** Deterministic wobbly rings that read as terrain contours. */
function contour(cx: number, cy: number, radius: number, seed: number) {
  const points = Array.from({ length: 36 }, (_, i) => {
    const angle = (i / 36) * Math.PI * 2;
    const wobble =
      1 + 0.12 * Math.sin(angle * 3 + seed) + 0.07 * Math.cos(angle * 5 - seed);
    return `${(cx + Math.cos(angle) * radius * wobble).toFixed(1)} ${(cy + Math.sin(angle) * radius * wobble * 0.8).toFixed(1)}`;
  });
  return `M ${points.join(" L ")} Z`;
}

const contours = [
  [190, 300, 130, 1],
  [190, 300, 90, 1.4],
  [760, 720, 150, 2.2],
  [760, 720, 100, 2.6],
  [640, 250, 110, 3.1],
  [330, 860, 120, 4.3],
] as const;

/** Graticule, terrain contours and compass rose shared by the map versions. */
/** Continues an evenly spaced series of coordinates out to ±extend beyond the map. */
function extendSeries(values: number[], extend: number) {
  if (extend <= 0 || values.length < 2) return values;
  const sorted = [...values].sort((a, b) => a - b);
  const gap = sorted[1] - sorted[0];
  if (gap <= 0) return sorted;
  const out = [...sorted];
  for (let v = sorted[0] - gap; v > -extend; v -= gap) out.unshift(v);
  for (let v = sorted[sorted.length - 1] + gap; v < MAP_SIZE + extend; v += gap)
    out.push(v);
  return out;
}

export function MapDecor({
  bounds,
  step = 2,
  labels = true,
  compass = true,
  extend = 0,
}: {
  bounds?: Bounds;
  step?: number;
  labels?: boolean;
  compass?: boolean;
  /** Carry the grid this far past the map's edge so a zoomed-out camera never shows a border. */
  extend?: number;
} = {}) {
  const { meridians, parallels } = graticule(bounds, step);
  const xs = extendSeries(
    meridians.map((m) => m.x),
    extend,
  );
  const ys = extendSeries(
    parallels.map((p) => p.y),
    extend,
  );
  return (
    <>
      <g stroke="var(--jm-line)" strokeWidth="1">
        {xs.map((x) => (
          <line
            key={`m${x}`}
            x1={x}
            y1={-extend}
            x2={x}
            y2={MAP_SIZE + extend}
          />
        ))}
        {ys.map((y) => (
          <line
            key={`p${y}`}
            x1={-extend}
            y1={y}
            x2={MAP_SIZE + extend}
            y2={y}
          />
        ))}
      </g>
      {labels && (
        <g
          fill="var(--jm-muted)"
          fontFamily="var(--font-sans)"
          fontSize="15"
          letterSpacing="2"
          opacity="0.8"
        >
          {meridians.map((m) => (
            <text key={m.label} x={m.x + 6} y={MAP_SIZE - 12}>
              {m.label}
            </text>
          ))}
          {parallels.map((p) => (
            <text key={p.label} x="12" y={p.y - 6}>
              {p.label}
            </text>
          ))}
        </g>
      )}

      <g fill="none" stroke="var(--jm-ink)" strokeWidth="1" opacity="0.16">
        {contours.map(([cx, cy, r, seed]) => (
          <path key={`${cx}-${cy}-${r}`} d={contour(cx, cy, r, seed)} />
        ))}
      </g>

      {compass && (
        <g
          transform={`translate(${MAP_SIZE - 110} 110)`}
          fill="var(--jm-ink)"
          opacity="0.75"
        >
          <circle r="46" fill="none" stroke="currentColor" strokeWidth="1" />
          <circle
            r="34"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.6"
            strokeDasharray="2 4"
          />
          <path d="M0 -42 L8 0 L0 42 L-8 0 Z" fill="var(--jm-accent)" />
          <path d="M-42 0 L0 8 L42 0 L0 -8 Z" opacity="0.6" />
          <path d="M0 -42 L8 0 L-8 0 Z" fill="var(--jm-ink)" opacity="0.5" />
          <text
            y="-54"
            textAnchor="middle"
            fontFamily="var(--font-serif)"
            fontSize="20"
          >
            N
          </text>
        </g>
      )}
    </>
  );
}

export function Pin({
  point,
  stop,
  align,
}: {
  point: Point;
  stop: JourneyStop;
  align: "start" | "end";
}) {
  const dir = align === "start" ? 1 : -1;
  return (
    <g>
      <circle
        cx={point.x}
        cy={point.y}
        r="14"
        className="pin-pulse"
        fill="var(--jm-accent)"
      />
      <circle
        cx={point.x}
        cy={point.y}
        r="9"
        fill="var(--jm-bg)"
        stroke="var(--jm-accent)"
        strokeWidth="3"
      />
      <circle cx={point.x} cy={point.y} r="3.5" fill="var(--jm-accent)" />
      <line
        x1={point.x + dir * 14}
        y1={point.y}
        x2={point.x + dir * 44}
        y2={point.y}
        stroke="var(--jm-ink)"
        strokeWidth="1"
        opacity="0.6"
      />
      <text
        x={point.x + dir * 52}
        y={point.y - 6}
        textAnchor={align}
        fill="var(--jm-ink)"
        fontFamily="var(--font-serif)"
        fontSize="34"
      >
        {stop.city}
      </text>
      <text
        x={point.x + dir * 52}
        y={point.y + 20}
        textAnchor={align}
        fill="var(--jm-muted)"
        fontFamily="var(--font-sans)"
        fontSize="17"
        letterSpacing="4"
      >
        {stop.state.toUpperCase()}
      </text>
      <text
        x={point.x + dir * 52}
        y={point.y + 46}
        textAnchor={align}
        fill="var(--jm-accent)"
        fontFamily="var(--font-script)"
        fontSize="30"
      >
        {stop.person}
      </text>
    </g>
  );
}

export default function JourneyMap({
  from,
  to,
  className = "",
}: JourneyMapProps) {
  const a = project(from);
  const b = project(to);
  const route = routeCurve(a, b);
  const km = Math.round(distanceKm(from, to) / 10) * 10;
  const fromAlign = a.x <= b.x ? "end" : "start";
  const toAlign = fromAlign === "end" ? "start" : "end";

  return (
    <svg
      viewBox={`0 0 ${MAP_SIZE} ${MAP_SIZE}`}
      className={className}
      role="img"
      aria-label={`Map showing the journey from ${from.city}, ${from.state} to ${to.city}, ${to.state}`}
    >
      <defs>
        <path id="journey-route" d={route.d} />
        <radialGradient id="journey-vignette" cx="50%" cy="50%" r="70%">
          <stop offset="60%" stopColor="var(--jm-bg-deep)" stopOpacity="0" />
          <stop offset="100%" stopColor="var(--jm-bg-deep)" stopOpacity="0.9" />
        </radialGradient>
      </defs>

      <MapDecor />

      {/* Route: soft underline, then the dashed line drawing itself in */}
      <path
        d={route.d}
        fill="none"
        stroke="var(--jm-accent)"
        strokeWidth="14"
        opacity="0.08"
        strokeLinecap="round"
      />
      <path
        d={route.d}
        fill="none"
        stroke="var(--jm-accent)"
        strokeWidth="3"
        strokeLinecap="round"
        className="route-draw"
        style={{ ["--route-length" as string]: route.pathLength.toFixed(0) }}
      />

      {/* Distance callout at the apex of the curve */}
      <g
        transform={`translate(${route.mid.x} ${route.mid.y - 34})`}
        textAnchor="middle"
      >
        <rect
          x="-78"
          y="-22"
          width="156"
          height="34"
          rx="17"
          fill="var(--jm-card)"
          stroke="var(--jm-line)"
        />
        <text
          y="2"
          fill="var(--jm-ink)"
          fontFamily="var(--font-sans)"
          fontSize="19"
          letterSpacing="2"
        >
          ≈ {km.toLocaleString("en-IN")} KM
        </text>
      </g>

      <Pin point={a} stop={from} align={fromAlign} />
      <Pin point={b} stop={to} align={toAlign} />

      {/* Paper plane travelling the route once it has been drawn */}
      <g fill="var(--jm-ink)">
        <path d="M-14 -9 L14 0 L-14 9 L-7 0 Z" />
        <path d="M-7 0 L-14 9 L-10 0 Z" fill="var(--jm-accent)" />
        <animateMotion
          dur="7s"
          begin="2.2s"
          repeatCount="indefinite"
          rotate="auto"
        >
          <mpath href="#journey-route" />
        </animateMotion>
      </g>

      {/* Hearts drifting near the destination */}
      <g fill="var(--jm-accent)" opacity="0.7">
        {[
          [-70, -70, 12],
          [-32, -110, 8],
          [-105, -30, 7],
        ].map(([dx, dy, s]) => (
          <path
            key={`${dx}-${dy}`}
            transform={`translate(${b.x + dx} ${b.y + dy}) scale(${s / 10})`}
            d="M0 6 C -10 -2, -8 -12, 0 -8 C 8 -12, 10 -2, 0 6 Z"
          />
        ))}
      </g>

      {/* Cartouche */}
      <g transform={`translate(40 ${MAP_SIZE - 150})`}>
        <rect
          width="290"
          height="96"
          fill="var(--jm-card)"
          stroke="var(--jm-ink)"
          strokeWidth="1"
        />
        <rect
          x="6"
          y="6"
          width="278"
          height="84"
          fill="none"
          stroke="var(--jm-ink)"
          strokeWidth="0.6"
        />
        <text
          x="145"
          y="38"
          textAnchor="middle"
          fill="var(--jm-ink)"
          fontFamily="var(--font-serif)"
          fontSize="20"
          letterSpacing="3"
        >
          TWO STATES
        </text>
        <text
          x="145"
          y="70"
          textAnchor="middle"
          fill="var(--jm-accent)"
          fontFamily="var(--font-script)"
          fontSize="30"
        >
          one celebration
        </text>
      </g>

      <rect
        width={MAP_SIZE}
        height={MAP_SIZE}
        fill="url(#journey-vignette)"
        pointerEvents="none"
      />
    </svg>
  );
}
