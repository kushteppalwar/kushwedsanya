import type { ReactNode } from "react";
import StageExplorer from "@/components/v4-2/StageExplorer";
import type { ExplorerRoute, ExplorerStage } from "@/components/v4-2/stages";
import type { MapPoint } from "@/components/v4-1/atlas";
import {
  body,
  buttonOutline,
  buttonPrimary,
  eyebrow,
  heading,
} from "@/components/v13/styles";
import type { EventConfig, MapPlace } from "@/lib/content";
import { INDIA_BOUNDS, distanceKm, withinBounds } from "@/lib/geo";

interface WorldJourneyStagesProps {
  config: EventConfig;
  reception?: EventConfig;
  directionsUrl?: string;
  receptionDirectionsUrl?: string;
  calendarHref?: string;
  calendarFileName?: string;
}

/** Visible map width (in degrees) when the camera sits over the Pune–Delhi leg. */
const INDIA_FIT = 28;
// …and when it pulls back to take in the whole world. Framed to the guests
// themselves (Canada to Australia is the widest span, ~240°) rather than a
// round number — wider than that and the real world map (Landmass) reads as
// a small island in a lot of empty ocean instead of an actual globe view.
const WORLD_FIT = 300;
const WORLD_FIT_PORTRAIT = 460;
/** Past this fit the Indian cities crowd Delhi, so their labels (and Pune's pin) fade out. */
const LABEL_FIT = 100;

// Pin colours for the day palette: gold for the departure city, terracotta
// (the same thread the routes and the rest of the day theme use) for the venue.
const ORIGIN_PIN = "#b8923f";
const VENUE_PIN = "#c8553d";

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

export default function WorldJourneyStages({
  config,
  reception,
  directionsUrl,
  receptionDirectionsUrl,
  calendarHref,
  calendarFileName,
}: WorldJourneyStagesProps) {
  const { couple, invitation, journey } = config;
  if (!journey) return null;
  const { from, to, guestOrigins = [] } = journey;

  // Plate carrée, one unit per degree, centred on the venue: x runs east, z runs south
  const at = (place: MapPlace): MapPoint => ({ x: place.lon - to.lon, z: to.lat - place.lat });
  const origin = at(from);
  const venue = at(to);
  const indiaGuests = guestOrigins.filter((place) => withinBounds(place, INDIA_BOUNDS));
  const worldGuests = guestOrigins.filter((place) => !withinBounds(place, INDIA_BOUNDS));

  // Same traveller as Kush's own leg — just multiple origins converging on the venue
  // instead of one. Guests are pinned to "plane" regardless: the by air/rail/road
  // switch is Kush's own call to make, not something that should turn every guest's
  // arrival into a car or train too.
  const inbound = (
    places: MapPlace[],
    id: string,
    bow: number,
    width: number,
    ghost: number,
    trip: number,
  ): ExplorerRoute[] =>
    places.map((place, index) => ({
      id: `${id}-${place.city}`,
      from: at(place),
      to: venue,
      bow: index % 2 === 0 ? bow : -bow,
      width,
      ghost,
      head: "vehicle",
      vehicleKind: "plane",
      trip,
    }));

  const routes: ExplorerRoute[] = [
    { id: "kush", from: origin, to: venue, bow: 0.2, head: "vehicle", trip: 9 },
    ...inbound(indiaGuests, "india", 0.18, 2, 0.08, 5.5),
    // Long-haul arcs sweep in from high up, so they are drawn a shade lighter
    ...inbound(worldGuests, "world", 0.12, 1.6, 0.05, 8),
    { id: "home", from: venue, to: origin, bow: 0.2, ghost: 0, head: "vehicle", trip: 9 },
  ];

  const leg = centroid([origin, venue]);
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

  const arrivals = ["kush", "india-*", "world-*"];
  const stages: ExplorerStage[] = [
    {
      key: "intro",
      short: "Begin the journey",
      intro: true,
      camera: { look: leg, fit: INDIA_FIT * 1.15, pitch: 40 },
      drawn: [],
    },
    {
      key: "kush",
      short: "Leg one",
      camera: { look: leg, fit: INDIA_FIT, pitch: 46 },
      drawn: ["kush"],
      looping: ["kush"],
      vehicle: true,
    },
    {
      key: "india",
      short: "Across India",
      camera: { look: indiaCentre, fit: INDIA_FIT * 1.3, pitch: 50 },
      drawn: ["kush", "india-*"],
      // Kush keeps making the Pune–Delhi trip in the background, not just on leg one
      looping: ["kush", "india-*"],
    },
    {
      key: "world",
      short: "Around the world",
      camera: {
        look: overview,
        portraitLook: overviewPortrait,
        fit: WORLD_FIT,
        portraitFit: WORLD_FIT_PORTRAIT,
        pitch: 58,
      },
      drawn: arrivals,
      looping: ["kush", "world-*"],
    },
    {
      key: "wedding",
      short: "The wedding",
      camera: { look: venue, fit: INDIA_FIT, pitch: 46 },
      drawn: arrivals,
      // Everyone keeps arriving while the wedding is in view
      looping: ["kush", "india-*", "world-*"],
    },
    {
      key: "return",
      short: "Homeward",
      camera: { look: leg, fit: INDIA_FIT, pitch: 46 },
      drawn: [...arrivals, "home"],
      dimmed: arrivals,
      looping: ["home"],
      vehicle: true,
    },
    {
      key: "reception",
      short: "The reception",
      camera: { look: origin, fit: INDIA_FIT, pitch: 46 },
      drawn: [...arrivals, "home"],
      dimmed: arrivals,
      parked: ["home"],
    },
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

  const cards: Record<string, ReactNode> = {
    kush: (
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
    india: (
      <>
        <p className={eyebrow}>Leg two · across India</p>
        <h2 className={heading}>All roads lead to {to.city}</h2>
        {originList(indiaGuests)}
      </>
    ),
    world: (
      <>
        <p className={eyebrow}>Leg three · around the world</p>
        <h2 className={heading}>And from much further</h2>
        {originList(worldGuests)}
      </>
    ),
    wedding: (
      <VenueStop
        label={`The wedding · ${to.city}`}
        event={config}
        href={directionsUrl}
        hrefLabel="Wedding venue"
        calendarHref={calendarHref}
        calendarFileName={calendarFileName}
      />
    ),
    return: (
      <>
        <p className={eyebrow}>Homeward · to {from.city}</p>
        <h2 className={heading}>The same {km(from, to).toLocaleString("en-IN")} km, together</h2>
        <p className={body}>
          Newly married, {couple.partner1} and {couple.partner2} carry the celebration back to{" "}
          {from.state}.
        </p>
      </>
    ),
    reception: reception ? (
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
  };

  return (
    <StageExplorer
      stages={stages}
      routes={routes}
      pins={[
        // Pune sits on top of Delhi once the world is in view, so it steps aside
        { point: origin, stop: from, align: "end", color: ORIGIN_PIN, hideBeyond: LABEL_FIT },
        { point: venue, stop: to, align: "start", color: VENUE_PIN },
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
      focus={{ portrait: { x: 0.56, y: 0.4 }, landscape: { x: 0.34, y: 0.52 } }}
      centre={indiaCentre}
      gridOrigin={{ x: -to.lon, z: to.lat }}
      cards={cards}
      intro={
        <>
          <p className={`${eyebrow} text-balance`}>Two states, and the whole world</p>
          <h1 className="mt-4 font-serif text-[clamp(3rem,12vw,7rem)] leading-[0.95] text-(--jm-ink) sm:mt-6">
            {couple.partner1}{" "}
            <span className="font-script text-[0.75em] text-(--jm-accent)">&amp;</span>{" "}
            {couple.partner2}
          </h1>
          {invitation && (
            <p className="mx-auto mt-6 max-w-xl font-sans text-xl leading-relaxed font-medium text-(--jm-ink)/85 italic sm:mt-8 sm:text-2xl">
              {invitation.intro} {invitation.request}
            </p>
          )}
        </>
      }
      ariaLabel={`Map of the round trip: ${from.person} and guests from across India and the world travel to ${to.city} for the wedding, then back to ${from.city} for the reception`}
    />
  );
}
