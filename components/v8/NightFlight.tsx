"use client";

import { useCallback, useMemo, useRef } from "react";
import ScrollAtlas, { type AtlasProgress, type AtlasStop } from "@/components/journey/ScrollAtlas";
import { routeCurve } from "@/components/v3/JourneyMap";
import { jmButtonOutline, jmButtonPrimary } from "@/components/v3/JourneyHero";
import { CeremonyIcon } from "@/components/v2/Ornaments";
import type { EventConfig } from "@/lib/content";
import { MAP_BOUNDS, MAP_SIZE, distanceKm, graticule, project } from "@/lib/geo";

interface NightFlightProps {
  config: EventConfig;
  directionsUrl?: string;
  calendarHref?: string;
  calendarFileName?: string;
}

const ROUTE_WINDOW: [number, number] = [0.1, 0.9];

function phaseFor(progress: number) {
  if (progress < 0.1) return "Boarding";
  if (progress < 0.3) return "Climbing";
  if (progress < 0.7) return "Cruising";
  if (progress < 0.9) return "Descending";
  return "Landed";
}

/** Dot grid, faint graticule and radar rings around the two cities. */
function RadarDecor({ cities }: { cities: { x: number; y: number }[] }) {
  const { meridians, parallels } = graticule(MAP_BOUNDS, 2);
  const dots = useMemo(() => {
    const points = [];
    for (let x = 25; x < MAP_SIZE; x += 50) {
      for (let y = 25; y < MAP_SIZE; y += 50) points.push({ x, y });
    }
    return points;
  }, []);

  return (
    <>
      <g fill="var(--jm-ink)" opacity="0.16">
        {dots.map((dot) => (
          <circle key={`${dot.x}-${dot.y}`} cx={dot.x} cy={dot.y} r="1.4" />
        ))}
      </g>
      <g stroke="var(--jm-line)" strokeWidth="0.8">
        {meridians.map((m) => (
          <line key={m.label} x1={m.x} y1="0" x2={m.x} y2={MAP_SIZE} />
        ))}
        {parallels.map((p) => (
          <line key={p.label} x1="0" y1={p.y} x2={MAP_SIZE} y2={p.y} />
        ))}
      </g>
      <g fill="var(--jm-muted)" fontFamily="var(--font-sans)" fontSize="14" letterSpacing="2" opacity="0.7">
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
      {cities.map((city) => (
        <g key={`${city.x}-${city.y}`} fill="none" stroke="var(--jm-accent)" opacity="0.35">
          <circle cx={city.x} cy={city.y} r="60" strokeWidth="0.8" />
          <circle cx={city.x} cy={city.y} r="120" strokeWidth="0.6" strokeDasharray="3 6" />
          <circle cx={city.x} cy={city.y} r="180" strokeWidth="0.5" strokeDasharray="1 7" />
        </g>
      ))}
    </>
  );
}

export default function NightFlight({ config, directionsUrl, calendarHref, calendarFileName }: NightFlightProps) {
  const { couple, weddingDate, location, invitation, journey, schedule = [] } = config;
  const flownRef = useRef<HTMLSpanElement>(null);
  const phaseRef = useRef<HTMLSpanElement>(null);
  const percentRef = useRef<HTMLSpanElement>(null);

  const from = journey?.from;
  const to = journey?.to;
  const origin = useMemo(() => (from ? project(from) : { x: 0, y: 0 }), [from]);
  const venue = useMemo(() => (to ? project(to) : { x: 0, y: 0 }), [to]);
  const route = useMemo(() => routeCurve(origin, venue), [origin, venue]);
  const km = from && to ? Math.round(distanceKm(from, to) / 10) * 10 : 0;

  const onProgress = useCallback(
    ({ progress }: AtlasProgress) => {
      const flight = Math.min(1, Math.max(0, (progress - ROUTE_WINDOW[0]) / (ROUTE_WINDOW[1] - ROUTE_WINDOW[0])));
      if (flownRef.current) flownRef.current.textContent = Math.round(flight * km).toLocaleString("en-IN");
      if (percentRef.current) percentRef.current.textContent = `${Math.round(flight * 100)}%`;
      if (phaseRef.current) phaseRef.current.textContent = phaseFor(progress);
    },
    [km]
  );

  const decor = useMemo(() => <RadarDecor cities={[origin, venue]} />, [origin, venue]);
  const routes = useMemo(
    () => [{ id: "flight", from: origin, to: venue, window: ROUTE_WINDOW, head: "plane" as const, width: 4 }],
    [origin, venue]
  );
  const milestones = useMemo(
    () =>
      schedule.map((day, index) => {
        const slot = (index + 1) / (schedule.length + 1);
        return {
          point: route.point(slot),
          label: day.day,
          at: ROUTE_WINDOW[0] + slot * (ROUTE_WINDOW[1] - ROUTE_WINDOW[0]),
        };
      }),
    [schedule, route]
  );

  const stops = useMemo<AtlasStop[]>(() => {
    const spacing = (ROUTE_WINDOW[1] - ROUTE_WINDOW[0]) / (schedule.length + 1);
    // Cards must never overlap, so each one gets just under half the gap to its neighbour.
    const half = Math.min(0.15, spacing / 2 - 0.01);
    const dayStops: AtlasStop[] = schedule.map((day, index) => {
      const centre = ROUTE_WINDOW[0] + spacing * (index + 1);
      return {
        key: day.day,
        from: centre - half,
        to: centre + half,
        content: (
          <>
            <p className="text-[0.65rem] tracking-[0.35em] text-(--jm-accent) uppercase">
              In flight · {day.day}
            </p>
            {day.date && <h2 className="mt-2 font-serif text-3xl text-(--jm-ink) sm:text-4xl">{day.date}</h2>}
            <ul className="mt-5 space-y-3">
              {day.events.map((event) => (
                <li key={event.name} className="flex items-center gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-(--jm-accent)/60 text-(--jm-accent)">
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
        key: "boarding",
        from: -1,
        to: 0.14,
        content: (
          <>
            <p className="text-[0.65rem] tracking-[0.35em] text-(--jm-accent) uppercase">
              Now boarding · {from?.code ?? from?.city}
            </p>
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
              Scroll to take off
            </p>
          </>
        ),
      },
      ...dayStops,
      {
        key: "landing",
        from: 0.86,
        to: 2,
        content: (
          <>
            <p className="text-[0.65rem] tracking-[0.35em] text-(--jm-accent) uppercase">
              Landed · {to?.code ?? to?.city}
            </p>
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
  }, [schedule, from, to, couple, invitation, location, weddingDate, directionsUrl, calendarHref, calendarFileName]);

  if (!from || !to) return null;

  const flightNumber = `${couple.partner1.charAt(0)}${couple.partner2.charAt(0)}-${weddingDate.startDay}${String(
    new Date(`${weddingDate.month} 1, ${weddingDate.year}`).getMonth() + 1
  ).padStart(2, "0")}`;

  const hud = (
    <div className="pointer-events-none absolute right-5 bottom-5 hidden sm:right-8 sm:bottom-8 sm:block">
      <dl className="grid grid-cols-4 gap-x-6 rounded-2xl border border-(--jm-line) bg-(--jm-bg)/70 px-5 py-4 font-sans text-(--jm-ink) backdrop-blur">
        <div>
          <dt className="text-[0.58rem] tracking-[0.3em] text-(--jm-muted) uppercase">Flight</dt>
          <dd className="font-serif text-lg tabular-nums">{flightNumber}</dd>
        </div>
        <div>
          <dt className="text-[0.58rem] tracking-[0.3em] text-(--jm-muted) uppercase">Status</dt>
          <dd className="font-serif text-lg">
            <span ref={phaseRef}>Boarding</span>
          </dd>
        </div>
        <div>
          <dt className="text-[0.58rem] tracking-[0.3em] text-(--jm-muted) uppercase">Flown</dt>
          <dd className="font-serif text-lg tabular-nums">
            <span ref={flownRef}>0</span> / {km.toLocaleString("en-IN")} km
          </dd>
        </div>
        <div>
          <dt className="text-[0.58rem] tracking-[0.3em] text-(--jm-muted) uppercase">Progress</dt>
          <dd className="font-serif text-lg tabular-nums">
            <span ref={percentRef}>0%</span>
          </dd>
        </div>
      </dl>
    </div>
  );

  return (
    <ScrollAtlas
      routes={routes}
      stops={stops}
      pins={[
        { point: origin, stop: from, align: origin.x <= venue.x ? "end" : "start" },
        { point: venue, stop: to, align: origin.x <= venue.x ? "start" : "end" },
      ]}
      milestones={milestones}
      rail={{ from: from.code ?? from.city, to: to.code ?? to.city }}
      decor={decor}
      glow
      cardsSide="left"
      hud={hud}
      onProgress={onProgress}
      ariaLabel={`Night map tracking the flight from ${from.city} to ${to.city}`}
    />
  );
}
