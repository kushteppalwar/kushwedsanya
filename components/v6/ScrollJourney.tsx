"use client";

import { useEffect, useMemo, useRef, type ReactNode } from "react";
import { MapDecor, Pin, routeCurve } from "@/components/v3/JourneyMap";
import { jmButtonOutline, jmButtonPrimary } from "@/components/v3/JourneyHero";
import { CeremonyIcon } from "@/components/v2/Ornaments";
import type { EventConfig } from "@/lib/content";
import { MAP_SIZE, distanceKm, project } from "@/lib/geo";

interface ScrollJourneyProps {
  config: EventConfig;
  directionsUrl?: string;
  calendarHref?: string;
  calendarFileName?: string;
}

const ZOOM = 1.35;
const FADE = 0.05;

interface Stop {
  key: string;
  /** Window of overall scroll progress in which the card is shown. */
  from: number;
  to: number;
  /** Where along the route the plane sits when this stop is centred (0–1). */
  at: number;
  content: ReactNode;
}

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

/** 0 → 1 → 0 across a window, with soft edges. */
function windowOpacity(progress: number, from: number, to: number) {
  if (progress <= from || progress >= to) return 0;
  return Math.min(1, (progress - from) / FADE, (to - progress) / FADE);
}

export default function ScrollJourney({ config, directionsUrl, calendarHref, calendarFileName }: ScrollJourneyProps) {
  const { couple, weddingDate, location, invitation, journey, schedule = [] } = config;
  const trackRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef<SVGGElement>(null);
  const routeRef = useRef<SVGPathElement>(null);
  const revealRef = useRef<SVGPathElement>(null);
  const planeRef = useRef<SVGGElement>(null);
  const railRef = useRef<HTMLSpanElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const milestoneRefs = useRef<(SVGGElement | null)[]>([]);

  const from = journey?.from;
  const to = journey?.to;
  const a = useMemo(() => (from ? project(from) : { x: 0, y: 0 }), [from]);
  const b = useMemo(() => (to ? project(to) : { x: 0, y: 0 }), [to]);
  const route = useMemo(() => routeCurve(a, b), [a, b]);
  const km = from && to ? Math.round(distanceKm(from, to) / 10) * 10 : 0;

  const stops = useMemo<Stop[]>(() => {
    const days = schedule.map((day, index) => ({ day, index }));
    const dayStops: Stop[] = days.map(({ day, index }) => {
      const slot = (index + 1) / (days.length + 1);
      return {
        key: day.day,
        from: slot - 0.14,
        to: slot + 0.14,
        at: slot,
        content: (
          <>
            <p className="text-[0.65rem] tracking-[0.35em] text-(--jm-accent) uppercase">
              Stop {index + 1} · {day.day}
            </p>
            {day.date && <h2 className="mt-2 font-serif text-3xl text-(--jm-ink) sm:text-4xl">{day.date}</h2>}
            <ul className="mt-5 space-y-3">
              {day.events.map((event) => (
                <li key={event.name} className="flex items-center gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-(--jm-accent)/50 text-(--jm-accent)">
                    <CeremonyIcon name={event.name} className="h-6 w-6" />
                  </span>
                  <div>
                    <p className="font-serif text-xl leading-tight text-(--jm-ink)">{event.name}</p>
                    <p className="font-sans text-base text-(--jm-muted)">{event.time}</p>
                  </div>
                </li>
              ))}
            </ul>
          </>
        ),
      };
    });

    return [
      {
        key: "departure",
        from: -1,
        to: 0.16,
        at: 0,
        content: (
          <>
            <p className="text-[0.65rem] tracking-[0.35em] text-(--jm-accent) uppercase">Departure · {from?.city}</p>
            <h1 className="mt-3 font-serif text-[clamp(2.4rem,6vw,4rem)] leading-[0.95] text-(--jm-ink)">
              {couple.partner1} <span className="font-script text-[0.75em] text-(--jm-accent)">&amp;</span>{" "}
              {couple.partner2}
            </h1>
            {invitation && (
              <p className="mt-4 font-sans text-lg leading-relaxed text-(--jm-muted) italic">
                {invitation.intro} {invitation.request}
              </p>
            )}
            <p className="mt-5 text-[0.65rem] tracking-[0.3em] text-(--jm-muted) uppercase">
              Scroll to follow the route · {km.toLocaleString("en-IN")} km
            </p>
          </>
        ),
      },
      ...dayStops,
      {
        key: "arrival",
        from: 0.84,
        to: 2,
        at: 1,
        content: (
          <>
            <p className="text-[0.65rem] tracking-[0.35em] text-(--jm-accent) uppercase">Arrival · {to?.city}</p>
            <h2 className="mt-3 font-serif text-[clamp(2rem,5vw,3.4rem)] leading-[0.98] text-(--jm-ink) text-balance">
              {location.venue ?? location.city}
            </h2>
            <p className="mt-3 font-sans text-lg text-(--jm-muted)">
              {weddingDate.display} · {[location.city, location.country].filter(Boolean).join(", ")}
            </p>
            <div className="pointer-events-auto mt-6 flex flex-wrap gap-3">
              {directionsUrl && (
                <a href={directionsUrl} target="_blank" rel="noopener noreferrer" className={jmButtonPrimary}>
                  Get directions
                  <span aria-hidden="true">↗</span>
                </a>
              )}
              {calendarHref && (
                <a href={calendarHref} download={calendarFileName} className={jmButtonOutline}>
                  Add to calendar
                </a>
              )}
            </div>
          </>
        ),
      },
    ];
  }, [schedule, from, to, couple, invitation, km, location, weddingDate, directionsUrl, calendarHref, calendarFileName]);

  useEffect(() => {
    const track = trackRef.current;
    const stage = stageRef.current;
    const routePath = routeRef.current;
    if (!track || !stage || !routePath) return;

    const length = routePath.getTotalLength();
    // Milestones sit where each day's stop is centred along the route.
    const milestoneAt = stops.filter((stop) => stop.at > 0 && stop.at < 1).map((stop) => stop.at);

    const render = () => {
      const rect = track.getBoundingClientRect();
      const viewport = window.innerHeight;
      const progress = clamp01(-rect.top / (rect.height - viewport));

      // Route reveal and plane
      const distance = progress * length;
      const point = routePath.getPointAtLength(distance);
      const ahead = routePath.getPointAtLength(Math.min(length, distance + 2));
      const angle = (Math.atan2(ahead.y - point.y, ahead.x - point.x) * 180) / Math.PI;
      revealRef.current?.setAttribute("stroke-dashoffset", String(1 - progress));
      planeRef.current?.setAttribute("transform", `translate(${point.x} ${point.y}) rotate(${angle})`);

      // Camera: keep the plane near a focal point, never exposing the map's edges
      const portrait = stage.clientWidth < stage.clientHeight;
      const focus = portrait ? { x: 500, y: 430 } : { x: 400, y: 520 };
      const min = MAP_SIZE - MAP_SIZE * ZOOM;
      const tx = Math.min(0, Math.max(min, focus.x - ZOOM * point.x));
      const ty = Math.min(0, Math.max(min, focus.y - ZOOM * point.y));
      cameraRef.current?.setAttribute("transform", `translate(${tx} ${ty}) scale(${ZOOM})`);

      if (railRef.current) railRef.current.style.left = `${progress * 100}%`;

      milestoneRefs.current.forEach((milestone, index) => {
        if (!milestone) return;
        milestone.style.opacity = progress >= milestoneAt[index] - 0.02 ? "1" : "0.35";
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
    };

    render();
    window.addEventListener("scroll", render, { passive: true });
    window.addEventListener("resize", render);
    return () => {
      window.removeEventListener("scroll", render);
      window.removeEventListener("resize", render);
    };
  }, [stops]);

  if (!from || !to) return null;

  const fromAlign = a.x <= b.x ? "end" : "start";
  const toAlign = fromAlign === "end" ? "start" : "end";
  const milestones = stops.filter((stop) => stop.at > 0 && stop.at < 1);

  return (
    <div ref={trackRef} className="relative" style={{ height: `${(stops.length + 1) * 100}vh` }}>
      <div ref={stageRef} className="sticky top-0 h-svh overflow-hidden">
        <svg
          viewBox={`0 0 ${MAP_SIZE} ${MAP_SIZE}`}
          preserveAspectRatio="xMidYMid slice"
          className="map-paper absolute inset-0 h-full w-full bg-(--jm-bg)"
          role="img"
          aria-label={`Scroll-driven map of the journey from ${from.city} to ${to.city}`}
        >
          <defs>
            <mask id="atlas-reveal">
              <path
                ref={revealRef}
                d={route.d}
                pathLength={1}
                fill="none"
                stroke="white"
                strokeWidth="60"
                strokeLinecap="butt"
                strokeDasharray="1"
                strokeDashoffset="1"
              />
            </mask>
            <radialGradient id="atlas-vignette" cx="50%" cy="50%" r="70%">
              <stop offset="55%" stopColor="var(--jm-bg-deep)" stopOpacity="0" />
              <stop offset="100%" stopColor="var(--jm-bg-deep)" stopOpacity="0.85" />
            </radialGradient>
          </defs>

          <g ref={cameraRef}>
            <MapDecor />

            {/* Faint full route, then the dashed route revealed by scroll */}
            <path ref={routeRef} d={route.d} fill="none" stroke="var(--jm-ink)" strokeWidth="1.5" strokeDasharray="3 9" opacity="0.35" />
            <g mask="url(#atlas-reveal)">
              <path d={route.d} fill="none" stroke="var(--jm-accent)" strokeWidth="14" opacity="0.1" strokeLinecap="round" />
              <path d={route.d} fill="none" stroke="var(--jm-accent)" strokeWidth="3.5" strokeLinecap="round" strokeDasharray="10 9" />
            </g>

            {milestones.map((stop, index) => {
              const point = route.point(stop.at);
              return (
                <g
                  key={stop.key}
                  ref={(el) => {
                    milestoneRefs.current[index] = el;
                  }}
                  style={{ opacity: 0.35, transition: "opacity 0.4s" }}
                >
                  <circle cx={point.x} cy={point.y} r="8" fill="var(--jm-bg)" stroke="var(--jm-accent)" strokeWidth="2.5" />
                  <text
                    x={point.x + 16}
                    y={point.y + 5}
                    fill="var(--jm-ink)"
                    fontFamily="var(--font-sans)"
                    fontSize="15"
                    letterSpacing="3"
                  >
                    {stop.key.toUpperCase()}
                  </text>
                </g>
              );
            })}

            <Pin point={a} stop={from} align={fromAlign} />
            <Pin point={b} stop={to} align={toAlign} />

            <g ref={planeRef} fill="var(--jm-ink)" transform={`translate(${a.x} ${a.y})`}>
              <path d="M-16 -10 L16 0 L-16 10 L-8 0 Z" />
              <path d="M-8 0 L-16 10 L-11 0 Z" fill="var(--jm-accent)" />
            </g>
          </g>

          <rect width={MAP_SIZE} height={MAP_SIZE} fill="url(#atlas-vignette)" pointerEvents="none" />
        </svg>

        {/* Progress rail */}
        <div className="pointer-events-none absolute inset-x-5 top-5 flex items-center gap-3 text-[0.62rem] tracking-[0.3em] text-(--jm-ink) uppercase sm:inset-x-8 sm:top-7">
          <span>{from.code ?? from.city}</span>
          <span className="relative h-px flex-1 bg-(--jm-ink)/25">
            <span
              ref={railRef}
              className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-(--jm-accent)"
              style={{ left: 0 }}
            />
          </span>
          <span>{to.code ?? to.city}</span>
        </div>

        {/* Stop cards */}
        <div className="pointer-events-none absolute inset-x-4 bottom-4 sm:inset-x-8 sm:bottom-8 lg:inset-y-0 lg:right-8 lg:left-auto lg:flex lg:w-[26rem] lg:items-center">
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
                <div className="rounded-[1.4rem] border border-(--jm-line) bg-(--jm-card) p-6 shadow-[0_30px_60px_-30px_rgba(31,42,68,0.5)] backdrop-blur-sm sm:p-8">
                  {stop.content}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
