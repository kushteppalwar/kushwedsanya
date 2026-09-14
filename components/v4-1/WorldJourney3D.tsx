import ScrollAtlas3D from "@/components/v4-1/ScrollAtlas3D";
import type {
  Atlas3DCameraKeyframe,
  Atlas3DRoute,
  Atlas3DStop,
  MapPoint,
} from "@/components/v4-1/atlas";
import ScrollHint from "@/components/v13/ScrollHint";
import {
  body,
  buttonOutline,
  buttonPrimary,
  eyebrow,
  heading,
} from "@/components/v13/styles";
import type { EventConfig, MapPlace } from "@/lib/content";
import { INDIA_BOUNDS, distanceKm, withinBounds } from "@/lib/geo";

interface WorldJourney3DProps {
  config: EventConfig;
  reception?: EventConfig;
  directionsUrl?: string;
  receptionDirectionsUrl?: string;
  calendarHref?: string;
  calendarFileName?: string;
}

// Scroll-progress phases, in order — the same beats as version 13. The opening
// panel dissolves into the map first; the wedding gets a window as long as any
// leg, and a proper run-up for the zoom in from the world view.
const INTRO_END = 0.09;
const KUSH: [number, number] = [0.11, 0.24];
const INDIA: [number, number] = [0.25, 0.36];
const WORLD: [number, number] = [0.37, 0.5];
const WEDDING: [number, number] = [0.58, 0.74];
const RETURN: [number, number] = [0.76, 0.9];
const RECEPTION_START = 0.9;
/** Scroll length in atlas-stop units; one more than the stop count so the longer wedding dwell costs nothing elsewhere. */
const TRACK_LENGTH = 9;

/** Visible map width (in degrees) when the camera sits over the Pune–Delhi leg. */
const INDIA_FIT = 26;
/** …and when it pulls back to take in the whole world. */
const WORLD_FIT = 540;
const WORLD_FIT_PORTRAIT = 820;
/** Opacity inbound routes settle to once the homeward leg begins. */
const FADED = 0.08;
/** Past this fit the Indian cities crowd Delhi, so their labels (and Pune's pin) fade out. */
const LABEL_FIT = 100;

const SKY_BLUE = "#7fb7ff";
const AMBER = "#f2b544";

function centroid(points: MapPoint[]): MapPoint {
  const sum = points.reduce((acc, p) => ({ x: acc.x + p.x, z: acc.z + p.z }), { x: 0, z: 0 });
  return { x: sum.x / points.length, z: sum.z / points.length };
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
          <a href={href} target="_blank" rel="noopener noreferrer" className={buttonPrimary}>
            {hrefLabel}
            <span aria-hidden="true">↗</span>
          </a>
        )}
        {calendarHref && (
          <a href={calendarHref} download={calendarFileName} className={buttonOutline}>
            Add to calendar
          </a>
        )}
      </div>
    </>
  );
}

export default function WorldJourney3D({
  config,
  reception,
  directionsUrl,
  receptionDirectionsUrl,
  calendarHref,
  calendarFileName,
}: WorldJourney3DProps) {
  const { couple, invitation, journey } = config;
  if (!journey) return null;
  const { from, to, guestOrigins = [] } = journey;

  // Plate carrée, one unit per degree, centred on the venue: x runs east, z runs south
  const at = (place: MapPlace): MapPoint => ({ x: place.lon - to.lon, z: to.lat - place.lat });
  const origin = at(from);
  const venue = at(to);
  const indiaGuests = guestOrigins.filter((place) => withinBounds(place, INDIA_BOUNDS));
  const worldGuests = guestOrigins.filter((place) => !withinBounds(place, INDIA_BOUNDS));

  const staggered = (
    places: MapPlace[],
    span: [number, number],
    share: number,
    bow: number,
    id: string,
    ghost: number,
    width: number,
  ): Atlas3DRoute[] =>
    places.map((place, index) => {
      const draw = (span[1] - span[0]) * share;
      const start = span[0] + ((span[1] - draw - span[0]) * index) / Math.max(1, places.length - 1);
      return {
        id: `${id}-${place.city}`,
        from: at(place),
        to: venue,
        window: [start, start + draw],
        head: "dot",
        bow: index % 2 === 0 ? bow : -bow,
        width,
        ghost,
        fadeAfter: RETURN[0],
        fadeTo: FADED,
      };
    });

  const routes: Atlas3DRoute[] = [
    {
      id: "kush",
      from: origin,
      to: venue,
      window: KUSH,
      head: "plane",
      bow: 0.2,
      fadeAfter: RETURN[0],
      fadeTo: FADED,
    },
    ...staggered(indiaGuests, INDIA, 0.6, 0.18, "india", 0.08, 2),
    // Long-haul arcs sweep in from high up, so they are drawn a shade lighter
    ...staggered(worldGuests, WORLD, 0.55, 0.12, "world", 0.05, 1.6),
    {
      id: "home",
      from: venue,
      to: origin,
      window: RETURN,
      head: "plane",
      bow: 0.2,
      ghost: 0,
    },
  ];

  const indiaCentre = centroid([origin, venue, ...indiaGuests.map(at)]);
  // Overview framing: the middle of everywhere anyone sets out from, so the
  // whole world sits beside the card in landscape and above it on phones.
  const everyone = [origin, venue, ...guestOrigins.map(at)];
  const overview: MapPoint = {
    x: (Math.min(...everyone.map((p) => p.x)) + Math.max(...everyone.map((p) => p.x))) / 2,
    z: (Math.min(...everyone.map((p) => p.z)) + Math.max(...everyone.map((p) => p.z))) / 2,
  };
  // Phones are too narrow to centre the world: look just west of the venue so
  // its label has room on the right and the far-west origins still make the frame.
  const overviewPortrait: MapPoint = { x: venue.x - 14, z: overview.z };
  const camera: Atlas3DCameraKeyframe[] = [
    { at: 0, look: centroid([origin, venue]), fit: INDIA_FIT, pitch: 46 },
    { at: KUSH[0], look: origin, fit: INDIA_FIT, pitch: 46 },
    { at: KUSH[1], look: venue, fit: INDIA_FIT, pitch: 46 },
    { at: INDIA[0], look: indiaCentre, fit: INDIA_FIT * 1.3, pitch: 50 },
    { at: INDIA[1] - 0.01, look: indiaCentre, fit: INDIA_FIT * 1.3, pitch: 50 },
    {
      at: WORLD[0] + 0.04,
      look: overview,
      portraitLook: overviewPortrait,
      fit: WORLD_FIT,
      portraitFit: WORLD_FIT_PORTRAIT,
      pitch: 58,
    },
    {
      at: WORLD[1] + 0.02,
      look: overview,
      portraitLook: overviewPortrait,
      fit: WORLD_FIT,
      portraitFit: WORLD_FIT_PORTRAIT,
      pitch: 58,
    },
    { at: WEDDING[0], look: venue, fit: INDIA_FIT, pitch: 46 },
    { at: RETURN[0], look: venue, fit: INDIA_FIT, pitch: 46 },
    { at: RETURN[1], look: origin, fit: INDIA_FIT, pitch: 46 },
    { at: 1, look: origin, fit: INDIA_FIT, pitch: 46 },
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

  const stops: Atlas3DStop[] = [
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
            {km(from, to).toLocaleString("en-IN")} km to {to.city}, where {to.person} is waiting —
            with family and friends from {from.city} along for the ride.
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
          <h2 className={heading}>The same {km(from, to).toLocaleString("en-IN")} km, together</h2>
          <p className={body}>
            Newly married, {couple.partner1} and {couple.partner2} carry the celebration back to{" "}
            {from.state}.
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
    <ScrollAtlas3D
      routes={routes}
      stops={stops}
      pins={[
        // Pune sits on top of Delhi once the world is in view, so it steps aside
        { point: origin, stop: from, align: "end", color: SKY_BLUE, hideBeyond: LABEL_FIT },
        { point: venue, stop: to, align: "start", color: AMBER },
      ]}
      places={guestOrigins.map((place) => ({
        point: at(place),
        label: place.city,
        hideBeyond: withinBounds(place, INDIA_BOUNDS) ? LABEL_FIT : undefined,
      }))}
      rail={{
        from: `${to.code ?? to.city} · wedding`,
        to: `${from.code ?? from.city} · reception`,
      }}
      camera={camera}
      centre={indiaCentre}
      gridOrigin={{ x: -to.lon, z: to.lat }}
      cardsSide="left"
      intro={{
        until: INTRO_END,
        content: (
          <>
            <p className={`${eyebrow} text-balance`}>Two states, and the whole world</p>
            <h1 className="mt-4 font-serif text-[clamp(3rem,12vw,7rem)] leading-[0.95] text-(--jm-ink) sm:mt-6">
              {couple.partner1}{" "}
              <span className="font-script text-[0.75em] text-(--jm-accent)">&amp;</span>{" "}
              {couple.partner2}
            </h1>
            {invitation && (
              <p className="mx-auto mt-6 max-w-xl font-sans text-xl leading-relaxed font-medium text-(--jm-muted) italic sm:mt-8 sm:text-2xl">
                {invitation.intro} {invitation.request}
              </p>
            )}
          </>
        ),
      }}
      hint={<ScrollHint variant="column" />}
      stepper
      trackLength={TRACK_LENGTH}
      railClassName="text-[0.7rem] font-medium tracking-[0.3em] text-(--jm-ink) uppercase sm:text-xs"
      focus={{ portrait: { x: 0.56, y: 0.4 }, landscape: { x: 0.34, y: 0.52 } }}
      stageClassName="bg-(--jm-bg)"
      ariaLabel={`Map of the round trip: ${from.person} and guests from across India and the world travel to ${to.city} for the wedding, then back to ${from.city} for the reception`}
    />
  );
}
