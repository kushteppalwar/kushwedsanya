"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import type {
  Atlas3DCameraKeyframe,
  Atlas3DPin,
  Atlas3DPlace,
  Atlas3DRoute,
  Atlas3DStop,
  AtlasFocus,
  MapPoint,
} from "@/components/v4-1/atlas";

const AtlasScene = dynamic(() => import("@/components/v4-1/AtlasScene"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center text-[0.7rem] tracking-[0.35em] text-(--jm-muted) uppercase">
      Charting the route…
    </div>
  ),
});

/**
 * The version 13 scroll atlas, with the SVG map replaced by a three.js scene.
 * The track, the eased scroll progress, the cards, the rail, the intro panel
 * and the stop buttons are the same; only the map is drawn on a canvas that
 * reads the progress every frame.
 */
interface ScrollAtlas3DProps {
  routes: Atlas3DRoute[];
  stops: Atlas3DStop[];
  pins: Atlas3DPin[];
  places?: Atlas3DPlace[];
  rail: { from: string; to: string };
  camera: Atlas3DCameraKeyframe[];
  focus?: AtlasFocus;
  /** Ground point the hills and clouds gather around. */
  centre: MapPoint;
  /** Where 0° longitude, 0° latitude falls, so the graticule lines up with real meridians. */
  gridOrigin: MapPoint;
  cardsSide?: "left" | "right";
  stageClassName?: string;
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
  /** 0–1 share of the remaining distance covered per frame; 1 disables smoothing. */
  smoothing?: number;
  ariaLabel: string;
}

const stepButton =
  "pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full border border-(--jm-line) bg-(--jm-bg)/90 text-(--jm-ink) shadow-[0_12px_30px_-18px_rgba(0,0,0,0.5)] transition-[opacity,background-color,transform] duration-300 hover:bg-(--jm-bg) active:scale-95 data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-30";

const FADE = 0.05;
const HINT_FADE = 0.03;

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function smoothstep(t: number) {
  return t * t * (3 - 2 * t);
}

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function windowOpacity(progress: number, from: number, to: number) {
  if (progress <= from || progress >= to) return 0;
  return Math.min(1, (progress - from) / FADE, (to - progress) / FADE);
}

export default function ScrollAtlas3D({
  routes,
  stops,
  pins,
  places = [],
  rail,
  camera,
  focus = { portrait: { x: 0.56, y: 0.4 }, landscape: { x: 0.4, y: 0.52 } },
  centre,
  gridOrigin,
  cardsSide = "right",
  stageClassName = "bg-(--jm-bg)",
  hint,
  intro,
  stepper = false,
  trackLength = stops.length + 1,
  railClassName = "text-[0.62rem] tracking-[0.3em] text-(--jm-ink) uppercase",
  smoothing = 0.16,
  ariaLabel,
}: ScrollAtlas3DProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLSpanElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const hintRefs = useRef<(HTMLDivElement | null)[]>([]);
  const introRef = useRef<HTMLDivElement>(null);
  const introTextRef = useRef<HTMLDivElement>(null);
  const stepRef = useRef<(direction: 1 | -1) => void>(null);
  // Eased scroll progress, read by the scene every frame
  const progressRef = useRef(0);
  // The canvas only renders while the pinned stage is on screen
  const [active, setActive] = useState(true);

  // Landscape orientation puts the focal point on the side away from the cards.
  const sceneFocus: AtlasFocus =
    cardsSide === "right"
      ? focus
      : { portrait: focus.portrait, landscape: { x: 1 - focus.landscape.x, y: focus.landscape.y } };

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const observer = new IntersectionObserver(([entry]) => setActive(entry.isIntersecting), {
      rootMargin: "20% 0px",
    });
    observer.observe(track);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    const stage = stageRef.current;
    if (!track || !stage) return;

    const render = (progress: number) => {
      progressRef.current = progress;

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
        // Words go first, then the panel itself thins out to show the map
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
      stage.querySelectorAll<HTMLButtonElement>("[data-step='-1']").forEach((button) => {
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
    };

    // Scroll position is the target; what we draw eases toward it each frame so
    // coarse touch scrolling on phones still reads as one continuous motion.
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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
      const duration = Math.min(2600, 700 + (Math.abs(distance) / window.innerHeight) * 550);
      const started = performance.now();
      const step = (now: number) => {
        const t = clamp01((now - started) / duration);
        window.scrollTo({ top: from + distance * easeInOutCubic(t), behavior: "instant" });
        glide = t < 1 ? requestAnimationFrame(step) : 0;
      };
      glide = requestAnimationFrame(step);
    };
    stepRef.current = (direction) => {
      // The control that was pressed may fade out mid-glide; drop focus first so
      // the browser's focus fix-up can't interfere with the scroll.
      if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
      const rect = track.getBoundingClientRect();
      const top = rect.top + window.scrollY;
      const span = rect.height - stage.clientHeight;
      const at = clamp01((window.scrollY - top) / span);
      if (direction > 0) {
        const next = anchors.find((anchor) => anchor > at + 0.01);
        // Past the last stop, carry on to whatever follows the map
        glideTo(next === undefined ? top + rect.height : top + next * span);
      } else {
        const prev = [...anchors].reverse().find((anchor) => anchor < at - 0.01);
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
  }, [stops, smoothing, intro]);

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
        {direction > 0 ? <path d="M2 2 L8 8 L14 2" /> : <path d="M2 8 L8 2 L14 8" />}
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
      <div ref={stageRef} className={`atlas-stage sticky top-0 overflow-hidden ${stageClassName}`}>
        {/* Isolated so the scene's own labels never stack above the cards */}
        <div className="pointer-events-none absolute inset-0 isolate" role="img" aria-label={ariaLabel}>
          <AtlasScene
            progress={progressRef}
            routes={routes}
            pins={pins}
            places={places}
            camera={camera}
            focus={sceneFocus}
            centre={centre}
            gridOrigin={gridOrigin}
            active={active}
          />
        </div>
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden="true"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 50%, color-mix(in srgb, var(--jm-bg-deep) 85%, transparent) 100%)",
          }}
        />

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
          {stepper && <div className="flex w-full justify-end gap-2 lg:hidden">{stepButtons}</div>}
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
                <div className="rounded-[1.2rem] border border-(--jm-line) bg-(--jm-bg)/95 p-5 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.7)] sm:rounded-[1.4rem] sm:bg-(--jm-bg)/80 sm:p-8 sm:backdrop-blur-md">
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
          <div className="absolute right-6 bottom-8 z-10 hidden flex-col gap-2 lg:flex">{stepButtons}</div>
        )}
      </div>
    </div>
  );
}
