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
  /** Scroll progress after which the drawn route dims, so later routes stand out. */
  fadeAfter?: number;
  /** Opacity the route dims to (default 0.3). */
  fadeTo?: number;
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
  /** Camera zoom below which the label fades out, so crowded regions stay legible when zoomed out. */
  minZoom?: number;
}

export interface AtlasCameraKeyframe {
  at: number;
  point: Point;
  zoom: number;
  /** Zoom to use instead when the stage is taller than it is wide. */
  portraitZoom?: number;
  /** Look-at point to use instead when the stage is taller than it is wide. */
  portraitPoint?: Point;
}

export interface AtlasProgress {
  progress: number;
  head: Point;
  activeRoute?: AtlasRoute;
}

interface ScrollAtlasProps {
  routes: AtlasRoute[];
  stops: AtlasStop[];
  pins: {
    point: Point;
    stop: JourneyStop;
    align: "start" | "end";
    /** Camera zoom below which the pin fades out. */
    minZoom?: number;
  }[];
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
  /** Keep pins, labels, heads and stroke widths the same size on screen at every zoom. */
  constantScale?: boolean;
  cardsSide?: "left" | "right";
  stageClassName?: string;
  /** Extra overlay rendered inside the pinned stage (position it absolutely). */
  hud?: ReactNode;
  /** Scroll prompt shown at the start: above the card on phones, bottom-centre on wide screens (or on the intro, if there is one). */
  hint?: ReactNode;
  /**
   * Full-screen opening panel that covers the map until the reader scrolls: its
   * text lifts away first, then the panel dissolves to reveal the map by `until`.
   */
  intro?: { content: ReactNode; until: number };
  /** Previous / next stop buttons that glide the page to the neighbouring stop. */
  stepper?: boolean;
  /** Track length in `--atlas-stop` units (default: one per stop, plus one). */
  trackLength?: number;
  railClassName?: string;
  /** Font size of the place labels, in map units. */
  labelSize?: number;
  /** 0–1 share of the remaining distance covered per frame; 1 disables smoothing. */
  smoothing?: number;
  onProgress?: (info: AtlasProgress) => void;
  ariaLabel: string;
}

const stepButton =
  "pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full border border-(--jm-line) bg-(--jm-bg)/90 text-(--jm-ink) shadow-[0_12px_30px_-18px_rgba(0,0,0,0.5)] transition-[opacity,background-color,transform] duration-300 hover:bg-(--jm-bg) active:scale-95 data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-30";

const FADE = 0.05;
const HINT_FADE = 0.03;
const PLACE_OPACITY = 0.7;
const DIM_SPAN = 0.05;
const DIMMED = 0.3;

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function smoothstep(t: number) {
  return t * t * (3 - 2 * t);
}

/** 1 at or above the zoom, fading out to 0 a little below it. */
function zoomVisibility(scale: number, minZoom?: number) {
  if (minZoom === undefined) return 1;
  return smoothstep(clamp01((scale - minZoom * 0.75) / (minZoom * 0.5)));
}

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
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
  constantScale = false,
  cardsSide = "right",
  stageClassName = "bg-(--jm-bg)",
  hud,
  hint,
  intro,
  stepper = false,
  trackLength = stops.length + 1,
  railClassName = "text-[0.62rem] tracking-[0.3em] text-(--jm-ink) uppercase",
  labelSize = 13,
  smoothing = 0.16,
  onProgress,
  ariaLabel,
}: ScrollAtlasProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef<SVGGElement>(null);
  const railRef = useRef<HTMLSpanElement>(null);
  const routeRefs = useRef<(SVGPathElement | null)[]>([]);
  const revealRefs = useRef<(SVGPathElement | null)[]>([]);
  const drawnRefs = useRef<(SVGGElement | null)[]>([]);
  const headRefs = useRef<(SVGGElement | null)[]>([]);
  const pinRefs = useRef<(SVGGElement | null)[]>([]);
  const placeRefs = useRef<(SVGGElement | null)[]>([]);
  const milestoneRefs = useRef<(SVGGElement | null)[]>([]);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const hintRefs = useRef<(HTMLDivElement | null)[]>([]);
  const introRef = useRef<HTMLDivElement>(null);
  const introTextRef = useRef<HTMLDivElement>(null);
  const stepRef = useRef<(direction: 1 | -1) => void>(null);
  const onProgressRef = useRef(onProgress);
  useEffect(() => {
    onProgressRef.current = onProgress;
  }, [onProgress]);

  const curves = useMemo(
    () => routes.map((route) => routeCurve(route.from, route.to, route.bow)),
    [routes],
  );
  const strokeEffect = constantScale ? "non-scaling-stroke" : undefined;

  useEffect(() => {
    const track = trackRef.current;
    const stage = stageRef.current;
    if (!track || !stage) return;

    const lengths = routeRefs.current.map(
      (path) => path?.getTotalLength() ?? 0,
    );
    // Landscape orientation puts the focal point on the side away from the cards.
    const landscapeFocus =
      cardsSide === "right"
        ? focus.landscape
        : { x: MAP_SIZE - focus.landscape.x, y: focus.landscape.y };

    const portrait = () => stage.clientWidth < stage.clientHeight;

    const render = (progress: number) => {
      const isPortrait = portrait();
      let head: Point = routes[0]?.from ?? { x: MAP_SIZE / 2, y: MAP_SIZE / 2 };
      let activeRoute: AtlasRoute | undefined;
      const headPoints: { point: Point; angle: number; visible: boolean }[] =
        [];

      routes.forEach((route, index) => {
        const [start, end] = route.window;
        const local = clamp01((progress - start) / (end - start));
        const path = routeRefs.current[index];
        const length = lengths[index];
        revealRefs.current[index]?.setAttribute(
          "stroke-dashoffset",
          String(1 - local),
        );

        const drawn = drawnRefs.current[index];
        if (drawn) {
          const dim =
            route.fadeAfter === undefined
              ? 0
              : clamp01((progress - route.fadeAfter) / DIM_SPAN);
          drawn.style.opacity = String(
            1 - dim * (1 - (route.fadeTo ?? DIMMED)),
          );
        }

        if (path && length) {
          const distance = local * length;
          const point = path.getPointAtLength(distance);
          const ahead = path.getPointAtLength(Math.min(length, distance + 2));
          const angle =
            (Math.atan2(ahead.y - point.y, ahead.x - point.x) * 180) / Math.PI;
          const visible =
            (local > 0 && local < 1) ||
            (local >= 1 &&
              route.head === "plane" &&
              route.fadeAfter === undefined);
          headPoints[index] = { point, angle, visible };
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
        const zoomOf = (frame: AtlasCameraKeyframe) =>
          isPortrait && frame.portraitZoom !== undefined
            ? frame.portraitZoom
            : frame.zoom;
        const pointOf = (frame: AtlasCameraKeyframe) =>
          isPortrait && frame.portraitPoint ? frame.portraitPoint : frame.point;
        const next = camera.findIndex((frame) => frame.at >= progress);
        if (next <= 0) {
          const frame = camera[next === 0 ? 0 : camera.length - 1];
          look = pointOf(frame);
          scale = zoomOf(frame);
        } else {
          const a = camera[next - 1];
          const b = camera[next];
          const t = smoothstep(clamp01((progress - a.at) / (b.at - a.at || 1)));
          const pa = pointOf(a);
          const pb = pointOf(b);
          look = {
            x: pa.x + (pb.x - pa.x) * t,
            y: pa.y + (pb.y - pa.y) * t,
          };
          scale = zoomOf(a) + (zoomOf(b) - zoomOf(a)) * t;
        }
      }

      const target = isPortrait ? focus.portrait : landscapeFocus;
      // Zoomed in, never expose the map's edge; zoomed out, the decor extends past it, so just centre.
      const min = MAP_SIZE - MAP_SIZE * scale;
      const tx =
        scale < 1
          ? target.x - scale * look.x
          : Math.min(0, Math.max(min, target.x - scale * look.x));
      const ty =
        scale < 1
          ? target.y - scale * look.y
          : Math.min(0, Math.max(min, target.y - scale * look.y));
      cameraRef.current?.setAttribute(
        "transform",
        `translate(${tx} ${ty}) scale(${scale})`,
      );

      // Counter-scale so markers keep their on-screen size while the camera zooms.
      const k = constantScale ? 1 / scale : 1;
      headPoints.forEach((headPoint, index) => {
        const headEl = headRefs.current[index];
        if (!headEl || !headPoint) return;
        headEl.setAttribute(
          "transform",
          `translate(${headPoint.point.x} ${headPoint.point.y}) rotate(${headPoint.angle}) scale(${k})`,
        );
        headEl.style.opacity = headPoint.visible ? "1" : "0";
      });
      pins.forEach((pin, index) => {
        const el = pinRefs.current[index];
        if (!el) return;
        el.setAttribute(
          "transform",
          `translate(${pin.point.x} ${pin.point.y}) scale(${k})`,
        );
        el.style.opacity = String(zoomVisibility(scale, pin.minZoom));
      });
      places.forEach((place, index) => {
        const el = placeRefs.current[index];
        if (!el) return;
        el.setAttribute(
          "transform",
          `translate(${place.point.x} ${place.point.y}) scale(${k})`,
        );
        el.style.opacity = String(
          PLACE_OPACITY * zoomVisibility(scale, place.minZoom),
        );
      });
      milestones.forEach((milestone, index) => {
        const el = milestoneRefs.current[index];
        if (!el) return;
        el.setAttribute(
          "transform",
          `translate(${milestone.point.x} ${milestone.point.y}) scale(${k})`,
        );
        el.style.opacity = progress >= milestone.at - 0.02 ? "1" : "0.35";
      });

      if (railRef.current) railRef.current.style.left = `${progress * 100}%`;

      stops.forEach((stop, index) => {
        const card = cardRefs.current[index];
        if (!card) return;
        const opacity = windowOpacity(progress, stop.from, stop.to);
        card.style.opacity = String(opacity);
        card.style.visibility = opacity === 0 ? "hidden" : "visible";
        (card.firstElementChild as HTMLElement | null)?.style.setProperty(
          "transform",
          `translateY(${(1 - opacity) * 24}px)`,
        );
      });

      if (intro && introRef.current) {
        const t = clamp01(progress / intro.until);
        // Words go first, then the paper itself thins out to show the map
        const text = 1 - smoothstep(clamp01(t / 0.6));
        const cover = 1 - smoothstep(clamp01((t - 0.3) / 0.7));
        introRef.current.style.opacity = String(cover);
        introRef.current.style.visibility = cover === 0 ? "hidden" : "visible";
        if (introTextRef.current) {
          introTextRef.current.style.opacity = String(text);
          introTextRef.current.style.transform = `translateY(${-(1 - text) * 48}px)`;
        }
      }

      // Styled via a data attribute rather than `disabled`: React drops clicks on
      // a button it rendered as disabled, whatever the DOM says later.
      stage
        .querySelectorAll<HTMLButtonElement>("[data-step='-1']")
        .forEach((button) => {
          const off = progress <= 0.005;
          button.dataset.disabled = String(off);
          button.setAttribute("aria-disabled", String(off));
        });

      // The scroll prompt only needs to be there until the first nudge
      const hintOpacity = 1 - clamp01((progress - 0.005) / HINT_FADE);
      hintRefs.current.forEach((el) => {
        if (!el) return;
        el.style.opacity = String(hintOpacity);
        el.style.visibility = hintOpacity === 0 ? "hidden" : "visible";
      });

      onProgressRef.current?.({ progress, head, activeRoute });
    };

    // Scroll position is the target; what we draw eases toward it each frame so
    // coarse touch scrolling on phones still reads as one continuous motion.
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const ease = reduced ? 1 : smoothing;
    const readTarget = () => {
      const rect = track.getBoundingClientRect();
      return clamp01(-rect.top / (rect.height - stage.clientHeight));
    };
    let target = readTarget();
    let current = target;
    let frame = 0;

    const tick = () => {
      frame = 0;
      current += (target - current) * ease;
      if (Math.abs(target - current) < 0.0004) current = target;
      render(current);
      if (current !== target) frame = requestAnimationFrame(tick);
    };
    const onScroll = () => {
      target = readTarget();
      if (document.hidden || ease >= 1) {
        current = target;
        render(current);
        return;
      }
      if (!frame) frame = requestAnimationFrame(tick);
    };

    // Stepping glides the page itself between stops, so the whole leg plays
    // out on the way; any touch, wheel or key from the reader takes over.
    const anchors = Array.from(
      new Set([
        ...(intro ? [0] : []),
        ...stops.map((stop) =>
          stop.to > 1 ? 1 : Math.max(stop.from + FADE, stop.to - FADE - 0.005),
        ),
      ]),
    ).sort((a, b) => a - b);
    let glide = 0;
    const stopGlide = () => {
      if (glide) cancelAnimationFrame(glide);
      glide = 0;
    };
    const glideTo = (top: number) => {
      stopGlide();
      const from = window.scrollY;
      const distance = top - from;
      if (Math.abs(distance) < 1) return;
      if (reduced) {
        window.scrollTo({ top, behavior: "instant" });
        return;
      }
      const duration = Math.min(
        2600,
        700 + (Math.abs(distance) / window.innerHeight) * 550,
      );
      const started = performance.now();
      const step = (now: number) => {
        const t = clamp01((now - started) / duration);
        window.scrollTo({
          top: from + distance * easeInOutCubic(t),
          behavior: "instant",
        });
        glide = t < 1 ? requestAnimationFrame(step) : 0;
      };
      glide = requestAnimationFrame(step);
    };
    stepRef.current = (direction) => {
      // The control that was pressed may fade out mid-glide; drop focus first so
      // the browser's focus fix-up can't interfere with the scroll.
      if (document.activeElement instanceof HTMLElement)
        document.activeElement.blur();
      const rect = track.getBoundingClientRect();
      const top = rect.top + window.scrollY;
      const span = rect.height - stage.clientHeight;
      const at = clamp01((window.scrollY - top) / span);
      if (direction > 0) {
        const next = anchors.find((anchor) => anchor > at + 0.01);
        // Past the last stop, carry on to whatever follows the map
        glideTo(next === undefined ? top + rect.height : top + next * span);
      } else {
        const prev = [...anchors]
          .reverse()
          .find((anchor) => anchor < at - 0.01);
        glideTo(top + (prev ?? 0) * span);
      }
    };

    render(current);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    window.addEventListener("wheel", stopGlide, { passive: true });
    window.addEventListener("touchstart", stopGlide, { passive: true });
    window.addEventListener("keydown", stopGlide);
    return () => {
      cancelAnimationFrame(frame);
      stopGlide();
      stepRef.current = null;
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("wheel", stopGlide);
      window.removeEventListener("touchstart", stopGlide);
      window.removeEventListener("keydown", stopGlide);
    };
  }, [
    routes,
    stops,
    pins,
    places,
    milestones,
    zoom,
    camera,
    focus,
    cardsSide,
    constantScale,
    smoothing,
    intro,
  ]);

  const stepButtons = ([-1, 1] as const).map((direction) => (
    <button
      key={direction}
      type="button"
      data-step={direction}
      aria-label={direction > 0 ? "Next stop" : "Previous stop"}
      onClick={() => stepRef.current?.(direction)}
      className={stepButton}
      data-disabled={direction < 0}
      aria-disabled={direction < 0}
    >
      <svg
        viewBox="0 0 16 10"
        className="h-2.5 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {direction > 0 ? (
          <path d="M2 2 L8 8 L14 2" />
        ) : (
          <path d="M2 8 L8 2 L14 8" />
        )}
      </svg>
    </button>
  ));

  const cardColumn =
    cardsSide === "right"
      ? "lg:inset-y-0 lg:right-8 lg:left-auto lg:w-[26rem]"
      : "lg:inset-y-0 lg:left-8 lg:right-auto lg:w-[26rem]";

  return (
    <div
      ref={trackRef}
      className="atlas-track relative"
      style={{ height: `calc(var(--atlas-stop) * ${trackLength})` }}
    >
      <div
        ref={stageRef}
        className={`atlas-stage sticky top-0 overflow-hidden ${stageClassName}`}
      >
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
                  strokeLinecap="butt"
                  strokeDasharray="1"
                  strokeDashoffset="1"
                />
              </mask>
            ))}
            {glow && (
              <filter
                id="atlas-glow"
                x="-20%"
                y="-20%"
                width="140%"
                height="140%"
              >
                <feGaussianBlur stdDeviation="6" />
              </filter>
            )}
            <radialGradient id="atlas-vignette" cx="50%" cy="50%" r="70%">
              <stop
                offset="55%"
                stopColor="var(--jm-bg-deep)"
                stopOpacity="0"
              />
              <stop
                offset="100%"
                stopColor="var(--jm-bg-deep)"
                stopOpacity="0.85"
              />
            </radialGradient>
          </defs>

          <g ref={cameraRef}>
            {decor}

            {places.map((place, index) => (
              <g
                key={place.label}
                ref={(el) => {
                  placeRefs.current[index] = el;
                }}
                transform={`translate(${place.point.x} ${place.point.y})`}
                opacity="0.7"
              >
                <circle r="4" fill="var(--jm-ink)" />
                <text
                  x="9"
                  y="4"
                  fill="var(--jm-muted)"
                  fontFamily="var(--font-sans)"
                  fontSize={labelSize}
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
                  vectorEffect={strokeEffect}
                />
                <g
                  ref={(el) => {
                    drawnRefs.current[index] = el;
                  }}
                  mask={`url(#atlas-reveal-${route.id})`}
                >
                  {glow && (
                    <path
                      d={curves[index].d}
                      fill="none"
                      stroke="var(--jm-accent)"
                      strokeWidth={(route.width ?? 3.5) * 4}
                      strokeLinecap="round"
                      opacity="0.45"
                      filter="url(#atlas-glow)"
                      vectorEffect={strokeEffect}
                    />
                  )}
                  <path
                    d={curves[index].d}
                    fill="none"
                    stroke="var(--jm-accent)"
                    strokeWidth={(route.width ?? 3.5) * 4}
                    opacity="0.1"
                    strokeLinecap="round"
                    vectorEffect={strokeEffect}
                  />
                  <path
                    d={curves[index].d}
                    fill="none"
                    stroke="var(--jm-accent)"
                    strokeWidth={route.width ?? 3.5}
                    strokeLinecap="round"
                    strokeDasharray="10 9"
                    vectorEffect={strokeEffect}
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
                transform={`translate(${milestone.point.x} ${milestone.point.y})`}
                style={{ opacity: 0.35, transition: "opacity 0.4s" }}
              >
                <circle
                  r="8"
                  fill="var(--jm-bg)"
                  stroke="var(--jm-accent)"
                  strokeWidth="2.5"
                />
                <text
                  x="16"
                  y="5"
                  fill="var(--jm-ink)"
                  fontFamily="var(--font-sans)"
                  fontSize="15"
                  letterSpacing="3"
                >
                  {milestone.label.toUpperCase()}
                </text>
              </g>
            ))}

            {pins.map((pin, index) => (
              <g
                key={pin.stop.city}
                ref={(el) => {
                  pinRefs.current[index] = el;
                }}
                transform={`translate(${pin.point.x} ${pin.point.y})`}
              >
                <Pin point={{ x: 0, y: 0 }} stop={pin.stop} align={pin.align} />
              </g>
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

          <rect
            width={MAP_SIZE}
            height={MAP_SIZE}
            fill="url(#atlas-vignette)"
            pointerEvents="none"
          />
        </svg>

        <div
          className={`pointer-events-none absolute inset-x-5 top-5 flex items-center gap-3 sm:inset-x-8 sm:top-7 ${railClassName}`}
        >
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

        <div
          className={`pointer-events-none absolute inset-x-4 bottom-4 flex flex-col items-center gap-4 sm:inset-x-8 sm:bottom-8 lg:flex-row ${cardColumn}`}
        >
          {hint && !intro && (
            <div
              ref={(el) => {
                hintRefs.current[0] = el;
              }}
              className="lg:hidden"
            >
              {hint}
            </div>
          )}
          {stepper && (
            <div className="flex w-full justify-end gap-2 lg:hidden">
              {stepButtons}
            </div>
          )}
          {/* Cards stack in one grid cell on phones so the column is as tall as the tallest card */}
          <div className="relative grid w-full items-end lg:block">
            {stops.map((stop, index) => (
              <div
                key={stop.key}
                ref={(el) => {
                  cardRefs.current[index] = el;
                }}
                className="[grid-area:1/1] lg:absolute lg:inset-x-0 lg:top-1/2 lg:-translate-y-1/2"
                style={{ opacity: 0, visibility: "hidden" }}
              >
                <div className="rounded-[1.2rem] border border-(--jm-line) bg-(--jm-bg)/95 p-5 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.5)] sm:rounded-[1.4rem] sm:bg-(--jm-card) sm:p-8 sm:backdrop-blur-sm">
                  {stop.content}
                </div>
              </div>
            ))}
          </div>
        </div>

        {hint && !intro && (
          <div
            ref={(el) => {
              hintRefs.current[1] = el;
            }}
            className="pointer-events-none absolute bottom-8 left-1/2 hidden -translate-x-1/2 lg:block"
          >
            {hint}
          </div>
        )}

        {intro && (
          <div
            ref={introRef}
            className={`pointer-events-none absolute inset-0 flex items-center justify-center px-6 pt-16 pb-28 sm:px-10 ${stageClassName}`}
          >
            <div ref={introTextRef} className="w-full max-w-3xl text-center">
              {intro.content}
            </div>
            {hint && (
              <div
                ref={(el) => {
                  hintRefs.current[2] = el;
                }}
                className="absolute bottom-8 left-1/2 -translate-x-1/2 sm:bottom-10"
              >
                {stepper ? (
                  <button
                    type="button"
                    aria-label="Begin the journey"
                    onClick={() => stepRef.current?.(1)}
                    className="pointer-events-auto -m-3 cursor-pointer p-3 transition-opacity hover:opacity-70"
                  >
                    {hint}
                  </button>
                ) : (
                  hint
                )}
              </div>
            )}
          </div>
        )}

        {stepper && (
          <div className="absolute right-6 bottom-8 z-10 hidden flex-col gap-2 lg:flex">
            {stepButtons}
          </div>
        )}

        {hud}
      </div>
    </div>
  );
}
