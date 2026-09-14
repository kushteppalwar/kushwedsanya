import ScrollAtlas, {
  type AtlasCameraKeyframe,
  type AtlasRoute,
  type AtlasStop,
  type Point,
} from "@/components/journey/ScrollAtlas";
import { MapDecor } from "@/components/v3/JourneyMap";
import { jmButtonOutline, jmButtonPrimary } from "@/components/v3/JourneyHero";
import { CeremonyIcon } from "@/components/v2/Ornaments";
import type { EventConfig, MapPlace } from "@/lib/content";
import {
  INDIA_BOUNDS,
  WORLD_BOUNDS,
  distanceKm,
  project,
  withinBounds,
} from "@/lib/geo";

interface WorldRoundTripProps {
  config: EventConfig;
  reception?: EventConfig;
  directionsUrl?: string;
  receptionDirectionsUrl?: string;
  calendarHref?: string;
  calendarFileName?: string;
}

// Scroll-progress phases, in order
const HOMES_END = 0.1;
const KUSH: [number, number] = [0.1, 0.26];
const INDIA: [number, number] = [0.27, 0.43];
const WORLD: [number, number] = [0.44, 0.62];
const WEDDING: [number, number] = [0.67, 0.76];
const RETURN: [number, number] = [0.77, 0.92];
const RECEPTION_START = 0.92;

const INDIA_ZOOM = 4.5;
const WORLD_ZOOM = 0.7;

function centroid(points: Point[]) {
  const sum = points.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), {
    x: 0,
    y: 0,
  });
  return { x: sum.x / points.length, y: sum.y / points.length };
}

function km(a: MapPlace, b: MapPlace) {
  return Math.round(distanceKm(a, b) / 10) * 10;
}

export default function WorldRoundTrip({
  config,
  reception,
  directionsUrl,
  receptionDirectionsUrl,
  calendarHref,
  calendarFileName,
}: WorldRoundTripProps) {
  const {
    couple,
    weddingDate,
    location,
    invitation,
    journey,
    schedule = [],
  } = config;
  if (!journey) return null;
  const { from, to, guestOrigins = [] } = journey;

  const at = (place: MapPlace) => project(place, WORLD_BOUNDS);
  const origin = at(from);
  const venue = at(to);
  const indiaGuests = guestOrigins.filter((place) =>
    withinBounds(place, INDIA_BOUNDS),
  );
  const worldGuests = guestOrigins.filter(
    (place) => !withinBounds(place, INDIA_BOUNDS),
  );

  const staggered = (
    places: MapPlace[],
    span: [number, number],
    share: number,
    bow: number,
    id: string,
    ghost: number,
  ): AtlasRoute[] =>
    places.map((place, index) => {
      const draw = (span[1] - span[0]) * share;
      const start =
        span[0] +
        ((span[1] - draw - span[0]) * index) / Math.max(1, places.length - 1);
      return {
        id: `${id}-${place.city}`,
        from: at(place),
        to: venue,
        window: [start, start + draw],
        head: "dot",
        bow: index % 2 === 0 ? bow : -bow,
        width: 2.2,
        ghost,
        fadeAfter: RETURN[0],
      };
    });

  const routes: AtlasRoute[] = [
    {
      id: "kush",
      from: origin,
      to: venue,
      window: KUSH,
      head: "plane",
      bow: 16,
      fadeAfter: RETURN[0],
    },
    ...staggered(indiaGuests, INDIA, 0.6, 14, "india", 0.08),
    ...staggered(worldGuests, WORLD, 0.55, 110, "world", 0.05),
    {
      id: "home",
      from: venue,
      to: origin,
      window: RETURN,
      head: "plane",
      bow: 16,
      ghost: 0,
    },
  ];

  const indiaCentre = centroid([origin, venue, ...indiaGuests.map(at)]);
  const worldPath = worldGuests.map(at);
  // Overview framing, biased east so the far-west origins clear the card on wide screens.
  const overview = { x: centroid([venue, ...worldPath]).x + 8, y: 400 };
  const camera: AtlasCameraKeyframe[] = [
    { at: 0, point: centroid([origin, venue]), zoom: INDIA_ZOOM },
    { at: KUSH[0], point: origin, zoom: INDIA_ZOOM },
    { at: KUSH[1], point: venue, zoom: INDIA_ZOOM },
    { at: INDIA[0], point: indiaCentre, zoom: INDIA_ZOOM * 0.85 },
    { at: INDIA[1], point: indiaCentre, zoom: INDIA_ZOOM * 0.85 },
    ...worldPath.map((point, index) => ({
      at:
        WORLD[0] +
        ((WORLD[1] - 0.04 - WORLD[0]) * index) /
          Math.max(1, worldPath.length - 1),
      point: centroid([point, venue]),
      zoom: WORLD_ZOOM,
    })),
    { at: WORLD[1], point: overview, zoom: WORLD_ZOOM },
    { at: WORLD[1] + 0.02, point: overview, zoom: WORLD_ZOOM },
    { at: WEDDING[0], point: venue, zoom: INDIA_ZOOM },
    { at: RETURN[0], point: venue, zoom: INDIA_ZOOM },
    { at: RETURN[1], point: origin, zoom: INDIA_ZOOM },
    { at: 1, point: origin, zoom: INDIA_ZOOM },
  ];

  const originList = (places: MapPlace[]) => (
    <ul className="mt-4 space-y-1.5">
      {places.map((place) => (
        <li
          key={place.city}
          className="flex items-baseline justify-between gap-4 font-sans text-base"
        >
          <span className="text-(--jm-ink)">{place.city}</span>
          <span className="text-(--jm-muted) tabular-nums">
            ≈ {km(place, to).toLocaleString("en-IN")} km
          </span>
        </li>
      ))}
    </ul>
  );

  const stops: AtlasStop[] = [
    {
      key: "homes",
      from: -1,
      to: HOMES_END,
      content: (
        <>
          <p className="text-[0.65rem] tracking-[0.35em] text-(--jm-accent) uppercase">
            Two states, and the whole world
          </p>
          <h1 className="mt-3 font-serif text-[clamp(2.4rem,6vw,4rem)] leading-[0.95] text-(--jm-ink)">
            {couple.partner1}{" "}
            <span className="font-script text-[0.75em] text-(--jm-accent)">
              &amp;
            </span>{" "}
            {couple.partner2}
          </h1>
          {invitation && (
            <p className="mt-4 font-sans text-lg leading-relaxed text-(--jm-muted) italic">
              {invitation.intro} {invitation.request}
            </p>
          )}
          <p className="mt-5 text-[0.65rem] tracking-[0.3em] text-(--jm-muted) uppercase">
            Scroll to follow the journey
          </p>
        </>
      ),
    },
    {
      key: "kush",
      from: KUSH[0],
      to: KUSH[1] + 0.01,
      content: (
        <>
          <p className="text-[0.65rem] tracking-[0.35em] text-(--jm-accent) uppercase">
            Leg one · {from.state}
          </p>
          <h2 className="mt-3 font-serif text-3xl text-(--jm-ink) sm:text-4xl">
            {from.person} sets out from {from.city}
          </h2>
          <p className="mt-3 font-sans text-lg text-(--jm-muted)">
            {km(from, to).toLocaleString("en-IN")} km to {to.city}, where{" "}
            {to.person} is waiting — with family and friends from {from.city}{" "}
            along for the ride.
          </p>
        </>
      ),
    },
    {
      key: "india",
      from: INDIA[0],
      to: INDIA[1] + 0.01,
      content: (
        <>
          <p className="text-[0.65rem] tracking-[0.35em] text-(--jm-accent) uppercase">
            Leg two · across India
          </p>
          <h2 className="mt-3 font-serif text-3xl text-(--jm-ink) sm:text-4xl">
            All roads lead to {to.city}
          </h2>
          {originList(indiaGuests)}
        </>
      ),
    },
    {
      key: "world",
      from: WORLD[0],
      to: WORLD[1] + 0.03,
      content: (
        <>
          <p className="text-[0.65rem] tracking-[0.35em] text-(--jm-accent) uppercase">
            Leg three · around the world
          </p>
          <h2 className="mt-3 font-serif text-3xl text-(--jm-ink) sm:text-4xl">
            And from much further
          </h2>
          {originList(worldGuests)}
        </>
      ),
    },
    {
      key: "wedding",
      from: WEDDING[0],
      to: WEDDING[1] + 0.01,
      content: (
        <>
          <p className="text-[0.65rem] tracking-[0.35em] text-(--jm-accent) uppercase">
            The wedding · {to.city}
          </p>
          <h2 className="mt-3 font-serif text-3xl text-(--jm-ink) sm:text-4xl">
            {location.venue ?? location.city}
          </h2>
          <p className="mt-2 font-sans text-lg text-(--jm-muted)">
            {weddingDate.display}
          </p>
          <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2.5">
            {schedule.flatMap((day) =>
              day.events.map((event) => (
                <li key={event.name} className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-(--jm-accent)/50 text-(--jm-accent)">
                    <CeremonyIcon name={event.name} className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block font-serif text-lg leading-tight text-(--jm-ink)">
                      {event.name}
                    </span>
                    <span className="block text-sm text-(--jm-muted)">
                      {day.date} · {event.time}
                    </span>
                  </span>
                </li>
              )),
            )}
          </ul>
        </>
      ),
    },
    {
      key: "return",
      from: RETURN[0],
      to: RETURN[1],
      content: (
        <>
          <p className="text-[0.65rem] tracking-[0.35em] text-(--jm-accent) uppercase">
            Homeward · to {from.city}
          </p>
          <h2 className="mt-3 font-serif text-3xl text-(--jm-ink) sm:text-4xl">
            The same {km(from, to).toLocaleString("en-IN")} km, together
          </h2>
          <p className="mt-3 font-sans text-lg text-(--jm-muted)">
            Newly married, {couple.partner1} and {couple.partner2} carry the
            celebration back to {from.state}.
          </p>
        </>
      ),
    },
    {
      key: "reception",
      from: RECEPTION_START,
      to: 2,
      content: (
        <>
          <p className="text-[0.65rem] tracking-[0.35em] text-(--jm-accent) uppercase">
            {reception
              ? `${reception.eventName} · ${reception.location.city}`
              : `Home · ${from.city}`}
          </p>
          <h2 className="mt-3 font-serif text-[clamp(2rem,5vw,3.4rem)] leading-[0.98] text-(--jm-ink) text-balance">
            {reception
              ? (reception.location.venue ?? reception.weddingDate.display)
              : from.city}
          </h2>
          {reception && (
            <p className="mt-3 font-sans text-lg text-(--jm-muted)">
              {[
                reception.location.venue && reception.weddingDate.display,
                [reception.location.city, reception.location.state]
                  .filter(Boolean)
                  .join(", "),
                reception.weddingDate.dayOfWeek,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          )}
          <div className="pointer-events-auto mt-6 flex flex-wrap gap-3">
            {(receptionDirectionsUrl ?? directionsUrl) && (
              <a
                href={receptionDirectionsUrl ?? directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={jmButtonPrimary}
              >
                {receptionDirectionsUrl ? "Reception venue" : "Wedding venue"}
                <span aria-hidden="true">↗</span>
              </a>
            )}
            {calendarHref && (
              <a
                href={calendarHref}
                download={calendarFileName}
                className={jmButtonOutline}
              >
                Add to calendar
              </a>
            )}
          </div>
        </>
      ),
    },
  ];

  return (
    <ScrollAtlas
      routes={routes}
      stops={stops}
      pins={[
        { point: origin, stop: from, align: "end" },
        { point: venue, stop: to, align: "start" },
      ]}
      places={guestOrigins.map((place) => ({
        point: at(place),
        label: place.city,
      }))}
      rail={{
        from: `${to.code ?? to.city} · wedding`,
        to: `${from.code ?? from.city} · reception`,
      }}
      decor={
        <MapDecor
          bounds={WORLD_BOUNDS}
          step={10}
          labels={false}
          compass={false}
          extend={1500}
        />
      }
      camera={camera}
      constantScale
      cardsSide="left"
      stageClassName="map-paper bg-(--jm-bg)"
      ariaLabel={`Map of the round trip: ${from.person} and guests from across India and the world travel to ${to.city} for the wedding, then back to ${from.city} for the reception`}
    />
  );
}
