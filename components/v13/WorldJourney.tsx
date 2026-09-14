import ScrollAtlas, {
  type AtlasCameraKeyframe,
  type AtlasRoute,
  type AtlasStop,
  type Point,
} from "@/components/journey/ScrollAtlas";
import { MapDecor } from "@/components/v3/JourneyMap";
import ScrollHint from "@/components/v13/ScrollHint";
import {
  body,
  buttonOutline,
  buttonPrimary,
  eyebrow,
  heading,
} from "@/components/v13/styles";
import type { EventConfig, MapPlace } from "@/lib/content";
import {
  INDIA_BOUNDS,
  WORLD_BOUNDS,
  distanceKm,
  project,
  withinBounds,
} from "@/lib/geo";

interface WorldJourneyProps {
  config: EventConfig;
  reception?: EventConfig;
  directionsUrl?: string;
  receptionDirectionsUrl?: string;
  calendarHref?: string;
  calendarFileName?: string;
}

// Scroll-progress phases, in order. The wedding gets a window as long as any
// leg, and a proper run-up for the zoom in from the world view.
const HOMES_END = 0.08;
const KUSH: [number, number] = [0.08, 0.22];
const INDIA: [number, number] = [0.23, 0.35];
const WORLD: [number, number] = [0.36, 0.5];
const WEDDING: [number, number] = [0.58, 0.74];
const RETURN: [number, number] = [0.76, 0.9];
const RECEPTION_START = 0.9;
/** Scroll length in atlas-stop units; one more than the stop count so the longer wedding dwell costs nothing elsewhere. */
const TRACK_LENGTH = 9;

const INDIA_ZOOM = 4.5;
const WORLD_ZOOM = 0.62;
const WORLD_ZOOM_PORTRAIT = 0.38;
/** Opacity inbound routes settle to once the homeward leg begins. */
const FADED = 0.08;

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

/** Venue card used for both the wedding and the reception stops. */
function VenueStop({
  label,
  event,
  href,
  hrefLabel,
  calendarHref,
  calendarFileName,
}: {
  label: string;
  event: EventConfig;
  href?: string;
  hrefLabel: string;
  calendarHref?: string;
  calendarFileName?: string;
}) {
  const { location, weddingDate } = event;
  const line = [
    weddingDate.display,
    [location.city, location.state].filter(Boolean).join(", "),
    weddingDate.dayOfWeek,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <>
      <p className={eyebrow}>{label}</p>
      <h2 className="mt-2 font-serif text-[clamp(1.7rem,6vw,3.2rem)] leading-[1.02] text-(--jm-ink) text-balance sm:mt-3">
        {location.venue ?? location.city}
      </h2>
      <p className={body}>{line}</p>
      <div className="pointer-events-auto mt-4 flex flex-wrap gap-2.5 sm:mt-6 sm:gap-3">
        {href && (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonPrimary}
          >
            {hrefLabel}
            <span aria-hidden="true">↗</span>
          </a>
        )}
        {calendarHref && (
          <a
            href={calendarHref}
            download={calendarFileName}
            className={buttonOutline}
          >
            Add to calendar
          </a>
        )}
      </div>
    </>
  );
}

export default function WorldJourney({
  config,
  reception,
  directionsUrl,
  receptionDirectionsUrl,
  calendarHref,
  calendarFileName,
}: WorldJourneyProps) {
  const { couple, invitation, journey } = config;
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
        fadeTo: FADED,
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
      fadeTo: FADED,
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
  // Overview framing, biased east so the far-west origins clear the card on wide screens.
  // One steady world view with every origin and Delhi in frame, clear of the card on
  // wide screens; phones get their own framing for the narrower stage.
  const overview = { x: 430, y: 496 };
  const overviewPortrait = { x: 680, y: 496 };
  const camera: AtlasCameraKeyframe[] = [
    { at: 0, point: centroid([origin, venue]), zoom: INDIA_ZOOM },
    { at: KUSH[0], point: origin, zoom: INDIA_ZOOM },
    { at: KUSH[1], point: venue, zoom: INDIA_ZOOM },
    { at: INDIA[0], point: indiaCentre, zoom: INDIA_ZOOM * 0.85 },
    { at: INDIA[1] - 0.01, point: indiaCentre, zoom: INDIA_ZOOM * 0.85 },
    {
      at: WORLD[0] + 0.04,
      point: overview,
      portraitPoint: overviewPortrait,
      zoom: WORLD_ZOOM,
      portraitZoom: WORLD_ZOOM_PORTRAIT,
    },
    {
      at: WORLD[1] + 0.02,
      point: overview,
      portraitPoint: overviewPortrait,
      zoom: WORLD_ZOOM,
      portraitZoom: WORLD_ZOOM_PORTRAIT,
    },
    { at: WEDDING[0], point: venue, zoom: INDIA_ZOOM },
    { at: RETURN[0], point: venue, zoom: INDIA_ZOOM },
    { at: RETURN[1], point: origin, zoom: INDIA_ZOOM },
    { at: 1, point: origin, zoom: INDIA_ZOOM },
  ];

  const originList = (places: MapPlace[]) => (
    <ul className="mt-3 space-y-1 sm:mt-4 sm:space-y-1.5">
      {places.map((place) => (
        <li
          key={place.city}
          className="flex items-baseline justify-between gap-4 font-sans text-lg font-medium sm:text-xl"
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
          <p className={eyebrow}>Two states, and the whole world</p>
          <h1 className="mt-2 font-serif text-[clamp(2.2rem,8vw,4rem)] leading-[0.95] text-(--jm-ink) sm:mt-3">
            {couple.partner1}{" "}
            <span className="font-script text-[0.75em] text-(--jm-accent)">
              &amp;
            </span>{" "}
            {couple.partner2}
          </h1>
          {invitation && (
            <p className={`${body} italic`}>
              {invitation.intro} {invitation.request}
            </p>
          )}
        </>
      ),
    },
    {
      key: "kush",
      from: KUSH[0],
      to: KUSH[1] + 0.01,
      content: (
        <>
          <p className={eyebrow}>Leg one · {from.state}</p>
          <h2 className={heading}>
            {from.person} sets out from {from.city}
          </h2>
          <p className={body}>
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
          <p className={eyebrow}>Leg two · across India</p>
          <h2 className={heading}>All roads lead to {to.city}</h2>
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
          <p className={eyebrow}>Leg three · around the world</p>
          <h2 className={heading}>And from much further</h2>
          {originList(worldGuests)}
        </>
      ),
    },
    {
      key: "wedding",
      from: WEDDING[0],
      to: WEDDING[1] + 0.01,
      content: (
        <VenueStop
          label={`The wedding · ${to.city}`}
          event={config}
          href={directionsUrl}
          hrefLabel="Wedding venue"
          calendarHref={calendarHref}
          calendarFileName={calendarFileName}
        />
      ),
    },
    {
      key: "return",
      from: RETURN[0],
      to: RETURN[1],
      content: (
        <>
          <p className={eyebrow}>Homeward · to {from.city}</p>
          <h2 className={heading}>
            The same {km(from, to).toLocaleString("en-IN")} km, together
          </h2>
          <p className={body}>
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
      content: reception ? (
        <VenueStop
          label={`${reception.eventName} · ${reception.location.city}`}
          event={reception}
          href={receptionDirectionsUrl}
          hrefLabel="Reception venue"
          calendarHref={calendarHref}
          calendarFileName={calendarFileName}
        />
      ) : (
        <>
          <p className={eyebrow}>Home · {from.city}</p>
          <h2 className={heading}>{from.city}</h2>
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
      hint={<ScrollHint />}
      trackLength={TRACK_LENGTH}
      railClassName="text-[0.7rem] font-medium tracking-[0.3em] text-(--jm-ink) uppercase sm:text-xs"
      labelSize={15}
      focus={{ portrait: { x: 560, y: 400 }, landscape: { x: 400, y: 520 } }}
      stageClassName="map-paper bg-(--jm-bg)"
      ariaLabel={`Map of the round trip: ${from.person} and guests from across India and the world travel to ${to.city} for the wedding, then back to ${from.city} for the reception`}
    />
  );
}
