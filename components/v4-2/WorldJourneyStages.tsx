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
/** Past this fit the Indian cities crowd Delhi, so their labels (and Pune's pin) fade out. */
const LABEL_FIT = 100;

// Both pins in the terracotta the routes are drawn in, as on the paper map:
// gold would sink into the ochre land.
const ORIGIN_PIN = "#c8553d";
const VENUE_PIN = "#c8553d";

function centroid(points: MapPoint[]): MapPoint {
  const sum = points.reduce((acc, p) => ({ x: acc.x + p.x, z: acc.z + p.z }), { x: 0, z: 0 });
  return { x: sum.x / points.length, z: sum.z / points.length };
}

function km(a: MapPlace, b: MapPlace) {
  return Math.round(distanceKm(a, b) / 10) * 10;
}

/** "Nagpur, Bengaluru and Hyderabad"; initialisms take an article ("the USA"). */
function listOf(places: MapPlace[]) {
  const names = places.map((place) =>
    /^[A-Z]{2,}$/.test(place.city) ? `the ${place.city}` : place.city,
  );
  if (names.length <= 1) return names.join("");
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
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
  const inbound = (places: MapPlace[], id: string, bow: number, width: number, ghost: number, trip: number): ExplorerRoute[] =>
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
    // Guests from overseas never get a line on the map — their origins are off any
    // India framing — so they simply fly in from the edge on their true bearing,
    // each plane tagged with where it set out from
    ...inbound(worldGuests, "world", 0.1, 1.6, 0, 7).map((route, index) => ({
      ...route,
      approach: true,
      label: worldGuests[index].city,
    })),
    { id: "home", from: venue, to: origin, bow: 0.2, ghost: 0, head: "vehicle", trip: 9 },
  ];

  const leg = centroid([origin, venue]);
  const indiaCentre = centroid([origin, venue, ...indiaGuests.map(at)]);

  /** Routes with a line on the map; the overseas planes only ever fly in. */
  const arrivals = ["kush", "india-*"];
  const stages: ExplorerStage[] = [
    {
      key: "intro",
      short: "Begin the journey",
      intro: true,
      // A bare, wider India sits behind the names: no labels to tangle with the
      // type, and the leg nudged east so it lands under the centred text
      camera: { look: { x: leg.x + 5, z: leg.z }, fit: INDIA_FIT * 1.6, pitch: 54 },
      drawn: [],
      labels: false,
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
      key: "everyone",
      short: "Everyone is coming",
      // One beat for every guest, and the map stays on India: the Indian legs
      // draw in and their planes hop to Delhi, while the overseas guests glide in
      // from beyond the edge of the frame, each plane tagged with its country
      camera: { look: indiaCentre, fit: INDIA_FIT * 1.3, pitch: 50 },
      drawn: arrivals,
      looping: ["kush", "india-*", "world-*"],
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

  const distances = guestOrigins.map((place) => km(place, to));
  const nearest = Math.min(...distances).toLocaleString("en-IN");
  const farthest = Math.max(...distances).toLocaleString("en-IN");
  const fromEverywhere = [
    indiaGuests.length > 0 && `from ${listOf(indiaGuests)}`,
    worldGuests.length > 0 && `from ${listOf(worldGuests)}`,
  ]
    .filter(Boolean)
    .join("; ");

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
    everyone: (
      <>
        <p className={eyebrow}>Leg two · everyone is coming</p>
        <h2 className={heading}>All roads lead to {to.city}</h2>
        <p className={body}>
          Family and friends {fromEverywhere}. The nearest is {nearest} km away, the farthest{" "}
          {farthest} — all headed the same way.
        </p>
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
