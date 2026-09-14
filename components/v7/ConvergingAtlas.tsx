import ScrollAtlas, { type AtlasRoute, type AtlasStop } from "@/components/journey/ScrollAtlas";
import { MapDecor } from "@/components/v3/JourneyMap";
import { jmButtonOutline, jmButtonPrimary } from "@/components/v3/JourneyHero";
import type { EventConfig } from "@/lib/content";
import { INDIA_BOUNDS, distanceKm, project, withinBounds } from "@/lib/geo";

interface ConvergingAtlasProps {
  config: EventConfig;
  directionsUrl?: string;
  calendarHref?: string;
  calendarFileName?: string;
}

const KUSH_WINDOW: [number, number] = [0.14, 0.4];
const GUEST_SPAN: [number, number] = [0.44, 0.82];

export default function ConvergingAtlas({ config, directionsUrl, calendarHref, calendarFileName }: ConvergingAtlasProps) {
  const { couple, weddingDate, location, invitation, journey, schedule = [] } = config;
  if (!journey) return null;
  const { from, to } = journey;
  const guestOrigins = (journey.guestOrigins ?? []).filter((place) => withinBounds(place, INDIA_BOUNDS));

  const origin = project(from, INDIA_BOUNDS);
  const venue = project(to, INDIA_BOUNDS);
  const km = Math.round(distanceKm(from, to) / 10) * 10;
  const ceremonies = schedule.flatMap((day) => day.events);

  const guestRoutes: AtlasRoute[] = guestOrigins.map((place, index) => {
    const start = GUEST_SPAN[0] + ((GUEST_SPAN[1] - 0.12 - GUEST_SPAN[0]) * index) / Math.max(1, guestOrigins.length - 1);
    return {
      id: `guest-${place.city}`,
      from: project(place, INDIA_BOUNDS),
      to: venue,
      window: [start, start + 0.12],
      head: "dot",
      bow: index % 2 === 0 ? 60 : -60,
      width: 2.2,
      ghost: 0.14,
    };
  });

  const routes: AtlasRoute[] = [
    { id: "kush", from: origin, to: venue, window: KUSH_WINDOW, head: "plane", bow: 120 },
    ...guestRoutes,
  ];

  const stops: AtlasStop[] = [
    {
      key: "homes",
      from: -1,
      to: 0.16,
      content: (
        <>
          <p className="text-[0.65rem] tracking-[0.35em] text-(--jm-accent) uppercase">Two states, one celebration</p>
          <h1 className="mt-3 font-serif text-[clamp(2.4rem,6vw,4rem)] leading-[0.95] text-(--jm-ink)">
            {couple.partner1} <span className="font-script text-[0.75em] text-(--jm-accent)">&amp;</span> {couple.partner2}
          </h1>
          {invitation && (
            <p className="mt-4 font-sans text-lg leading-relaxed text-(--jm-muted) italic">
              {invitation.intro} {invitation.request}
            </p>
          )}
          <p className="mt-5 text-[0.65rem] tracking-[0.3em] text-(--jm-muted) uppercase">
            {to.person} · {to.city} — {from.person} · {from.city}
          </p>
        </>
      ),
    },
    {
      key: "kush",
      from: 0.14,
      to: 0.42,
      content: (
        <>
          <p className="text-[0.65rem] tracking-[0.35em] text-(--jm-accent) uppercase">Leg one · {from.state}</p>
          <h2 className="mt-3 font-serif text-3xl text-(--jm-ink) sm:text-4xl">
            {from.person} sets out from {from.city}
          </h2>
          <p className="mt-3 font-sans text-lg text-(--jm-muted)">
            {km.toLocaleString("en-IN")} km to {to.city}, where {to.person} is waiting. The route is the same one every
            guest will trace in their own way.
          </p>
        </>
      ),
    },
    {
      key: "guests",
      from: 0.42,
      to: 0.84,
      content: (
        <>
          <p className="text-[0.65rem] tracking-[0.35em] text-(--jm-accent) uppercase">Leg two · wherever you are</p>
          <h2 className="mt-3 font-serif text-3xl text-(--jm-ink) sm:text-4xl">All roads lead to {to.city}</h2>
          <p className="mt-3 font-sans text-lg text-(--jm-muted)">
            From {guestOrigins.length} cities and more, family and friends make their way to one address.
          </p>
          <ul className="mt-4 flex flex-wrap gap-x-3 gap-y-1 text-[0.7rem] tracking-[0.2em] text-(--jm-muted) uppercase">
            {guestOrigins.map((place) => (
              <li key={place.city}>{place.city}</li>
            ))}
          </ul>
        </>
      ),
    },
    {
      key: "arrival",
      from: 0.84,
      to: 2,
      content: (
        <>
          <p className="text-[0.65rem] tracking-[0.35em] text-(--jm-accent) uppercase">Arrival · {to.city}</p>
          <h2 className="mt-3 font-serif text-[clamp(2rem,5vw,3.4rem)] leading-[0.98] text-(--jm-ink) text-balance">
            {location.venue ?? location.city}
          </h2>
          <p className="mt-3 font-sans text-lg text-(--jm-muted)">
            {weddingDate.display} · {schedule.length} days · {ceremonies.map((event) => event.name).join(", ")}
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

  const camera = [
    { at: 0, point: { x: (origin.x + venue.x) / 2, y: (origin.y + venue.y) / 2 }, zoom: 1.4 },
    { at: 0.14, point: origin, zoom: 1.7 },
    { at: 0.4, point: venue, zoom: 1.7 },
    { at: 0.5, point: { x: 500, y: 520 }, zoom: 1.05 },
    { at: 0.8, point: { x: 500, y: 520 }, zoom: 1.05 },
    { at: 1, point: venue, zoom: 1.5 },
  ];

  return (
    <ScrollAtlas
      routes={routes}
      stops={stops}
      pins={[
        { point: origin, stop: from, align: "start" },
        { point: venue, stop: to, align: "start" },
      ]}
      places={guestOrigins.map((place) => ({ point: project(place, INDIA_BOUNDS), label: place.city }))}
      rail={{ from: from.code ?? from.city, to: to.code ?? to.city }}
      decor={<MapDecor bounds={INDIA_BOUNDS} step={4} />}
      camera={camera}
      stageClassName="map-paper bg-(--jm-bg)"
      ariaLabel={`Map of routes from ${from.city} and guests' cities across India converging on ${to.city}`}
    />
  );
}
