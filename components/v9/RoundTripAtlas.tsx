import ScrollAtlas, { type AtlasCameraKeyframe, type AtlasRoute, type AtlasStop } from "@/components/journey/ScrollAtlas";
import { MapDecor } from "@/components/v3/JourneyMap";
import { jmButtonOutline, jmButtonPrimary } from "@/components/v3/JourneyHero";
import { CeremonyIcon } from "@/components/v2/Ornaments";
import type { EventConfig } from "@/lib/content";
import { INDIA_BOUNDS, distanceKm, project, withinBounds } from "@/lib/geo";

interface RoundTripAtlasProps {
  config: EventConfig;
  reception?: EventConfig;
  directionsUrl?: string;
  receptionDirectionsUrl?: string;
  calendarHref?: string;
  calendarFileName?: string;
}

// Scroll-progress phases
const OUTBOUND: [number, number] = [0.1, 0.38];
const WEDDING: [number, number] = [0.4, 0.58];
const RETURN: [number, number] = [0.6, 0.86];
const RECEPTION_START = 0.88;

export default function RoundTripAtlas({
  config,
  reception,
  directionsUrl,
  receptionDirectionsUrl,
  calendarHref,
  calendarFileName,
}: RoundTripAtlasProps) {
  const { couple, weddingDate, location, invitation, journey, schedule = [] } = config;
  if (!journey) return null;
  const { from, to } = journey;
  const guestOrigins = (journey.guestOrigins ?? []).filter((place) => withinBounds(place, INDIA_BOUNDS));

  const origin = project(from, INDIA_BOUNDS);
  const venue = project(to, INDIA_BOUNDS);
  const km = Math.round(distanceKm(from, to) / 10) * 10;
  const drawSpan = (OUTBOUND[1] - OUTBOUND[0]) * 0.6;

  const routes: AtlasRoute[] = [
    { id: "kush-out", from: origin, to: venue, window: [OUTBOUND[0], OUTBOUND[0] + drawSpan], head: "plane", bow: 120 },
    ...guestOrigins.map((place, index): AtlasRoute => {
      const start = OUTBOUND[0] + ((OUTBOUND[1] - drawSpan - OUTBOUND[0]) * (index + 1)) / guestOrigins.length;
      return {
        id: `guest-${place.city}`,
        from: project(place, INDIA_BOUNDS),
        to: venue,
        window: [start, start + drawSpan],
        head: "dot",
        bow: index % 2 === 0 ? 60 : -60,
        width: 2.2,
        ghost: 0.14,
      };
    }),
    { id: "home", from: venue, to: origin, window: RETURN, head: "plane", bow: 120, width: 3.5 },
  ];

  const camera: AtlasCameraKeyframe[] = [
    { at: 0, point: { x: (origin.x + venue.x) / 2, y: (origin.y + venue.y) / 2 }, zoom: 1.2 },
    { at: OUTBOUND[0], point: { x: 500, y: 520 }, zoom: 1.05 },
    { at: OUTBOUND[1], point: { x: 500, y: 520 }, zoom: 1.05 },
    { at: WEDDING[0], point: venue, zoom: 1.7 },
    { at: WEDDING[1], point: venue, zoom: 1.7 },
    { at: RETURN[0] + 0.04, point: venue, zoom: 1.5 },
    { at: RETURN[1] - 0.04, point: origin, zoom: 1.5 },
    { at: 1, point: origin, zoom: 1.4 },
  ];

  const stops: AtlasStop[] = [
    {
      key: "homes",
      from: -1,
      to: OUTBOUND[0],
      content: (
        <>
          <p className="text-[0.65rem] tracking-[0.35em] text-(--jm-accent) uppercase">A round trip</p>
          <h1 className="mt-3 font-serif text-[clamp(2.4rem,6vw,4rem)] leading-[0.95] text-(--jm-ink)">
            {couple.partner1} <span className="font-script text-[0.75em] text-(--jm-accent)">&amp;</span> {couple.partner2}
          </h1>
          {invitation && (
            <p className="mt-4 font-sans text-lg leading-relaxed text-(--jm-muted) italic">
              {invitation.intro} {invitation.request}
            </p>
          )}
          <p className="mt-5 text-[0.65rem] tracking-[0.3em] text-(--jm-muted) uppercase">
            {to.city} for the wedding · {from.city} for the reception
          </p>
        </>
      ),
    },
    {
      key: "outbound",
      from: OUTBOUND[0],
      to: OUTBOUND[1],
      content: (
        <>
          <p className="text-[0.65rem] tracking-[0.35em] text-(--jm-accent) uppercase">Outbound · to {to.city}</p>
          <h2 className="mt-3 font-serif text-3xl text-(--jm-ink) sm:text-4xl">Everyone heads north</h2>
          <p className="mt-3 font-sans text-lg text-(--jm-muted)">
            {from.person} covers {km.toLocaleString("en-IN")} km from {from.city}; family and friends set out from{" "}
            {guestOrigins.length} more cities. All of it ends at one address.
          </p>
        </>
      ),
    },
    {
      key: "wedding",
      from: WEDDING[0],
      to: WEDDING[1],
      content: (
        <>
          <p className="text-[0.65rem] tracking-[0.35em] text-(--jm-accent) uppercase">The wedding · {to.city}</p>
          <h2 className="mt-3 font-serif text-3xl text-(--jm-ink) sm:text-4xl">{location.venue ?? location.city}</h2>
          <p className="mt-2 font-sans text-lg text-(--jm-muted)">{weddingDate.display}</p>
          <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2.5">
            {schedule.flatMap((day) =>
              day.events.map((event) => (
                <li key={event.name} className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-(--jm-accent)/50 text-(--jm-accent)">
                    <CeremonyIcon name={event.name} className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block font-serif text-lg leading-tight text-(--jm-ink)">{event.name}</span>
                    <span className="block text-sm text-(--jm-muted)">
                      {day.date} · {event.time}
                    </span>
                  </span>
                </li>
              ))
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
          <p className="text-[0.65rem] tracking-[0.35em] text-(--jm-accent) uppercase">Homeward · to {from.city}</p>
          <h2 className="mt-3 font-serif text-3xl text-(--jm-ink) sm:text-4xl">The same {km.toLocaleString("en-IN")} km, together</h2>
          <p className="mt-3 font-sans text-lg text-(--jm-muted)">
            Newly married, {couple.partner1} and {couple.partner2} carry the celebration back to {from.state}.
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
            {reception ? `${reception.eventName} · ${reception.location.city}` : `Home · ${from.city}`}
          </p>
          <h2 className="mt-3 font-serif text-[clamp(2rem,5vw,3.4rem)] leading-[0.98] text-(--jm-ink) text-balance">
            {reception ? (reception.location.venue ?? reception.weddingDate.display) : from.city}
          </h2>
          {reception && (
            <p className="mt-3 font-sans text-lg text-(--jm-muted)">
              {[
                reception.location.venue && reception.weddingDate.display,
                [reception.location.city, reception.location.state].filter(Boolean).join(", "),
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
              <a href={calendarHref} download={calendarFileName} className={jmButtonOutline}>
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
        { point: origin, stop: from, align: "start" },
        { point: venue, stop: to, align: "start" },
      ]}
      places={guestOrigins.map((place) => ({ point: project(place, INDIA_BOUNDS), label: place.city }))}
      rail={{ from: `${to.code ?? to.city} · wedding`, to: `${from.code ?? from.city} · reception` }}
      decor={<MapDecor bounds={INDIA_BOUNDS} step={4} />}
      camera={camera}
      stageClassName="map-paper bg-(--jm-bg)"
      ariaLabel={`Map of the round trip: everyone travels to ${to.city} for the wedding, then back to ${from.city} for the reception`}
    />
  );
}
