"use client";

import { useEffect, useMemo, useRef, type ReactNode } from "react";
import { Pin, routeCurve } from "@/components/v3/JourneyMap";
import type { JourneyStop } from "@/lib/content";
import { MAP_SIZE } from "@/lib/geo";

export interface Point {
  x: number;
  y: number;
}

export interface AtlasRoute {
  id: string;
  from: Point;
  to: Point;
  /** Scroll-progress window during which this route draws itself. */
  window: [number, number];
  head?: "plane" | "dot";
  bow?: number;
  width?: number;
  /** Opacity of the route before it is drawn. */
  ghost?: number;
}

export interface AtlasStop {
  key: string;
  /** Scroll-progress window during which the card is shown. */
  from: number;
  to: number;
  content: ReactNode;
}

export interface AtlasMilestone {
  point: Point;
  label: string;
  /** Scroll progress at which the milestone lights up. */
  at: number;
}

export interface AtlasPlace {
  point: Point;
  label: string;
}

export interface AtlasCameraKeyframe {
  at: number;
  point: Point;
  zoom: number;
}

export interface AtlasProgress {
  progress: number;
  head: Point;
  activeRoute?: AtlasRoute;
}

interface ScrollAtlasProps {
  routes: AtlasRoute[];
  stops: AtlasStop[];
  pins: { point: Point; stop: JourneyStop; align: "start" | "end" }[];
  places?: AtlasPlace[];
  milestones?: AtlasMilestone[];
  rail: { from: string; to: string };
  decor: ReactNode;
  zoom?: number;
  /** Optional explicit camera path; without it the camera follows the active route's head. */
  camera?: AtlasCameraKeyframe[];
  /** Portrait / landscape focal points, in map units. */
  focus?: { portrait: Point; landscape: Point };
  glow?: boolean;
  cardsSide?: "left" | "right";
  stageClassName?: string;
  /** Extra overlay rendered inside the pinned stage (position it absolutely). */
  hud?: ReactNode;
  onProgress?: (info: AtlasProgress) => void;
  ariaLabel: string;
}

const FADE = 0.05;

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function windowOpacity(progress: number, from: number, to: number) {
  if (progress <= from || progress >= to) return 0;
  return Math.min(1, (progress - from) / FADE, (to - progress) / FADE);
}

export default function ScrollAtlas({
  routes,
  stops,
  pins,
  places = [],
  milestones = [],
  rail,
  decor,
  zoom = 1.35,
  camera,
  focus = { portrait: { x: 500, y: 430 }, landscape: { x: 400, y: 520 } },
  glow = false,
  cardsSide = "right",
  stageClassName = "bg-(--jm-bg)",
  hud,
  onProgress,
  ariaLabel,
}: ScrollAtlasProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef<SVGGElement>(null);
  const railRef = useRef<HTMLSpanElement>(null);
  const routeRefs = useRef<(SVGPathElement | null)[]>([]);
  const revealRefs = useRef<(SVGPathElement | null)[]>([]);
  const headRefs = useRef<(SVGGElement | null)[]>([]);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const milestoneRefs = useRef<(SVGGElement | null)[]>([]);
  const onProgressRef = useRef(onProgress);
  useEffect(() => {
    onProgressRef.current = onProgress;
  }, [onProgress]);

  const curves = useMemo(() => routes.map((route) => routeCurve(route.from, route.to, route.bow)), [routes]);

  useEffect(() => {
    const track = trackRef.current;
    const stage = stageRef.current;
    if (!track || !stage) return;

    const lengths = routeRefs.current.map((path) => path?.getTotalLength() ?? 0);
    // Landscape orientation puts the focal point on the side away from the cards.
    const landscapeFocus = cardsSide === "right" ? focus.landscape : { x: MAP_SIZE - focus.landscape.x, y: focus.landscape.y };

    const render = () => {
      const rect = track.getBoundingClientRect();
      const progress = clamp01(-rect.top / (rect.height - window.innerHeight));

      let head: Point = routes[0]?.from ?? { x: MAP_SIZE / 2, y: MAP_SIZE / 2 };
      let activeRoute: AtlasRoute | undefined;

      routes.forEach((route, index) => {
        const [start, end] = route.window;
        const local = clamp01((progress - start) / (end - start));
        const path = routeRefs.current[index];
        const length = lengths[index];
        revealRefs.current[index]?.setAttribute("stroke-dashoffset", String(1 - local));

        if (path && length) {
          const distance = local * length;
          const point = path.getPointAtLength(distance);
          const ahead = path.getPointAtLength(Math.min(length, distance + 2));
          const angle = (Math.atan2(ahead.y - point.y, ahead.x - point.x) * 180) / Math.PI;
          const headEl = headRefs.current[index];
          if (headEl) {
            headEl.setAttribute("transform", `translate(${point.x} ${point.y}) rotate(${angle})`);
            headEl.style.opacity = local > 0 && local < 1 ? "1" : local >= 1 && route.head === "plane" ? "1" : "0";
          }
          if (progress >= start && progress <= end) {
            head = point;
            activeRoute = route;
          } else if (progress > end) {
            head = route.to;
          }
        }
      });

      let look = head;
      let scale = zoom;
      if (camera && camera.length > 0) {
        const next = camera.findIndex((frame) => frame.at >= progress);
        if (next <= 0) {
          ({ point: look, zoom: scale } = camera[next === 0 ? 0 : camera.length - 1]);
        } else {
          const a = camera[next - 1];
          const b = camera[next];
          const t = (progress - a.at) / (b.at - a.at || 1);
          look = { x: a.point.x + (b.point.x - a.point.x) * t, y: a.point.y + (b.point.y - a.point.y) * t };
          scale = a.zoom + (b.zoom - a.zoom) * t;
        }
      }

      const portrait = stage.clientWidth < stage.clientHeight;
      const target = portrait ? focus.portrait : landscapeFocus;
      const min = MAP_SIZE - MAP_SIZE * scale;
      const tx = Math.min(0, Math.max(min, target.x - scale * look.x));
      const ty = Math.min(0, Math.max(min, target.y - scale * look.y));
      cameraRef.current?.setAttribute("transform", `translate(${tx} ${ty}) scale(${scale})`);

      if (railRef.current) railRef.current.style.left = `${progress * 100}%`;

      milestoneRefs.current.forEach((milestone, index) => {
        if (milestone) milestone.style.opacity = progress >= milestones[index].at - 0.02 ? "1" : "0.35";
      });

      stops.forEach((stop, index) => {
        const card = cardRefs.current[index];
        if (!card) return;
        const opacity = windowOpacity(progress, stop.from, stop.to);
        card.style.opacity = String(opacity);
        card.style.visibility = opacity === 0 ? "hidden" : "visible";
        (card.firstElementChild as HTMLElement | null)?.style.setProperty(
          "transform",
          `translateY(${(1 - opacity) * 24}px)`
        );
      });

      onProgressRef.current?.({ progress, head, activeRoute });
    };

    render();
    window.addEventListener("scroll", render, { passive: true });
    window.addEventListener("resize", render);
    return () => {
      window.removeEventListener("scroll", render);
      window.removeEventListener("resize", render);
    };
  }, [routes, stops, milestones, zoom, camera, focus, cardsSide]);

  const cardColumn =
    cardsSide === "right"
      ? "lg:inset-y-0 lg:right-8 lg:left-auto lg:w-[26rem]"
      : "lg:inset-y-0 lg:left-8 lg:right-auto lg:w-[26rem]";

  return (
    <div ref={trackRef} className="relative" style={{ height: `${(stops.length + 1) * 100}vh` }}>
      <div ref={stageRef} className={`sticky top-0 h-svh overflow-hidden ${stageClassName}`}>
        <svg
          viewBox={`0 0 ${MAP_SIZE} ${MAP_SIZE}`}
          preserveAspectRatio="xMidYMid slice"
          className="absolute inset-0 h-full w-full"
          role="img"
          aria-label={ariaLabel}
        >
          <defs>
            {routes.map((route, index) => (
              <mask key={route.id} id={`atlas-reveal-${route.id}`}>
                <path
                  ref={(el) => {
                    revealRefs.current[index] = el;
                  }}
                  d={curves[index].d}
                  pathLength={1}
                  fill="none"
                  stroke="white"
                  strokeWidth="60"
                  strokeLinecap="round"
                  strokeDasharray="1"
                  strokeDashoffset="1"
                />
              </mask>
            ))}
            {glow && (
              <filter id="atlas-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="6" />
              </filter>
            )}
            <radialGradient id="atlas-vignette" cx="50%" cy="50%" r="70%">
              <stop offset="55%" stopColor="var(--jm-bg-deep)" stopOpacity="0" />
              <stop offset="100%" stopColor="var(--jm-bg-deep)" stopOpacity="0.85" />
            </radialGradient>
          </defs>

          <g ref={cameraRef}>
            {decor}

            {places.map((place) => (
              <g key={place.label} opacity="0.7">
                <circle cx={place.point.x} cy={place.point.y} r="4" fill="var(--jm-ink)" />
                <text
                  x={place.point.x + 9}
                  y={place.point.y + 4}
                  fill="var(--jm-muted)"
                  fontFamily="var(--font-sans)"
                  fontSize="13"
                  letterSpacing="2"
                >
                  {place.label.toUpperCase()}
                </text>
              </g>
            ))}

            {routes.map((route, index) => (
              <g key={route.id}>
                <path
                  ref={(el) => {
                    routeRefs.current[index] = el;
                  }}
                  d={curves[index].d}
                  fill="none"
                  stroke="var(--jm-ink)"
                  strokeWidth="1.2"
                  strokeDasharray="3 9"
                  opacity={route.ghost ?? 0.3}
                />
                <g mask={`url(#atlas-reveal-${route.id})`}>
                  {glow && (
                    <path
                      d={curves[index].d}
                      fill="none"
                      stroke="var(--jm-accent)"
                      strokeWidth={(route.width ?? 3.5) * 4}
                      strokeLinecap="round"
                      opacity="0.45"
                      filter="url(#atlas-glow)"
                    />
                  )}
                  <path
                    d={curves[index].d}
                    fill="none"
                    stroke="var(--jm-accent)"
                    strokeWidth={(route.width ?? 3.5) * 4}
                    opacity="0.1"
                    strokeLinecap="round"
                  />
                  <path
                    d={curves[index].d}
                    fill="none"
                    stroke="var(--jm-accent)"
                    strokeWidth={route.width ?? 3.5}
                    strokeLinecap="round"
                    strokeDasharray="10 9"
                  />
                </g>
              </g>
            ))}

            {milestones.map((milestone, index) => (
              <g
                key={milestone.label}
                ref={(el) => {
                  milestoneRefs.current[index] = el;
                }}
                style={{ opacity: 0.35, transition: "opacity 0.4s" }}
              >
                <circle cx={milestone.point.x} cy={milestone.point.y} r="8" fill="var(--jm-bg)" stroke="var(--jm-accent)" strokeWidth="2.5" />
                <text
                  x={milestone.point.x + 16}
                  y={milestone.point.y + 5}
                  fill="var(--jm-ink)"
                  fontFamily="var(--font-sans)"
                  fontSize="15"
                  letterSpacing="3"
                >
                  {milestone.label.toUpperCase()}
                </text>
              </g>
            ))}

            {pins.map((pin) => (
              <Pin key={pin.stop.city} point={pin.point} stop={pin.stop} align={pin.align} />
            ))}

            {routes.map((route, index) => (
              <g
                key={`head-${route.id}`}
                ref={(el) => {
                  headRefs.current[index] = el;
                }}
                fill="var(--jm-ink)"
                transform={`translate(${route.from.x} ${route.from.y})`}
                style={{ opacity: 0 }}
              >
                {route.head === "dot" ? (
                  <>
                    <circle r="9" fill="var(--jm-accent)" opacity="0.35" />
                    <circle r="4.5" fill="var(--jm-accent)" />
                  </>
                ) : (
                  <>
                    <path d="M-16 -10 L16 0 L-16 10 L-8 0 Z" />
                    <path d="M-8 0 L-16 10 L-11 0 Z" fill="var(--jm-accent)" />
                  </>
                )}
              </g>
            ))}
          </g>

          <rect width={MAP_SIZE} height={MAP_SIZE} fill="url(#atlas-vignette)" pointerEvents="none" />
        </svg>

        <div className="pointer-events-none absolute inset-x-5 top-5 flex items-center gap-3 text-[0.62rem] tracking-[0.3em] text-(--jm-ink) uppercase sm:inset-x-8 sm:top-7">
          <span>{rail.from}</span>
          <span className="relative h-px flex-1 bg-(--jm-ink)/25">
            <span
              ref={railRef}
              className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-(--jm-accent)"
              style={{ left: 0 }}
            />
          </span>
          <span>{rail.to}</span>
        </div>

        <div className={`pointer-events-none absolute inset-x-4 bottom-4 sm:inset-x-8 sm:bottom-8 lg:flex lg:items-center ${cardColumn}`}>
          <div className="relative w-full">
            {stops.map((stop, index) => (
              <div
                key={stop.key}
                ref={(el) => {
                  cardRefs.current[index] = el;
                }}
                className="absolute inset-x-0 bottom-0 lg:top-1/2 lg:bottom-auto lg:-translate-y-1/2"
                style={{ opacity: 0, visibility: "hidden" }}
              >
                <div className="rounded-[1.4rem] border border-(--jm-line) bg-(--jm-card) p-6 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.5)] backdrop-blur-sm sm:p-8">
                  {stop.content}
                </div>
              </div>
            ))}
          </div>
        </div>

        {hud}
      </div>
    </div>
  );
}
