import ScrollAtlas, { type AtlasCameraKeyframe, type AtlasRoute, type AtlasStop, type Point } from "@/components/journey/ScrollAtlas";
import { MapDecor } from "@/components/v3/JourneyMap";
import { jmButtonOutline, jmButtonPrimary } from "@/components/v3/JourneyHero";
import type { EventConfig, MapPlace } from "@/lib/content";
import { INDIA_BOUNDS, distanceKm, project } from "@/lib/geo";

interface RegionalAtlasProps {
  config: EventConfig;
  directionsUrl?: string;
  calendarHref?: string;
  calendarFileName?: string;
}

const HOMES_END = 0.12;
const ARRIVAL_START = 0.86;

function centroid(points: Point[]) {
  const sum = points.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
  return { x: sum.x / points.length, y: sum.y / points.length };
}

export default function RegionalAtlas({ config, directionsUrl, calendarHref, calendarFileName }: RegionalAtlasProps) {
  const { couple, weddingDate, location, invitation, journey, schedule = [] } = config;
  if (!journey) return null;
  const { from, to, guestOrigins = [] } = journey;

  const origin = project(from, INDIA_BOUNDS);
  const venue = project(to, INDIA_BOUNDS);

  // Kush travels with the region his city sits in; regions keep config order.
  const regionNames = Array.from(new Set(guestOrigins.map((place) => place.region ?? "Elsewhere")));
  const regions = regionNames.map((name) => {
    const places: MapPlace[] = guestOrigins.filter((place) => (place.region ?? "Elsewhere") === name);
    const includesKush = places.some((place) => place.state === from.state);
    return { name, places, includesKush };
  });

  const legSpan = (ARRIVAL_START - HOMES_END) / regions.length;
  const routes: AtlasRoute[] = [];
  const camera: AtlasCameraKeyframe[] = [
    { at: 0, point: { x: (origin.x + venue.x) / 2, y: (origin.y + venue.y) / 2 }, zoom: 1.2 },
  ];

  const legStops: AtlasStop[] = regions.map((region, index) => {
    const start = HOMES_END + legSpan * index;
    const end = start + legSpan;
    const drawSpan = legSpan * 0.7;
    const travellers = region.places.map((place) => ({ label: place.city, point: project(place, INDIA_BOUNDS) }));
    if (region.includesKush) travellers.unshift({ label: from.city, point: origin });

    travellers.forEach((traveller, i) => {
      const offset = travellers.length > 1 ? (i / (travellers.length - 1)) * (legSpan - drawSpan) : 0;
      routes.push({
        id: `${region.name}-${traveller.label}`,
        from: traveller.point,
        to: venue,
        window: [start + offset, start + offset + drawSpan],
        head: traveller.label === from.city ? "plane" : "dot",
        bow: i % 2 === 0 ? 70 : -70,
        width: traveller.label === from.city ? 3.5 : 2.2,
        ghost: 0.14,
      });
    });

    const focusPoint = centroid([...travellers.map((t) => t.point), venue]);
    camera.push({ at: start + 0.02, point: focusPoint, zoom: 1.3 });
    camera.push({ at: end - 0.02, point: focusPoint, zoom: 1.3 });

    const farthest = Math.max(
      ...region.places.map((place) => distanceKm(place, to)),
      region.includesKush ? distanceKm(from, to) : 0
    );

    return {
      key: region.name,
      from: start,
      to: end,
      content: (
        <>
          <p className="text-[0.65rem] tracking-[0.35em] text-(--jm-accent) uppercase">
            Leg {index + 1} of {regions.length} · from the {region.name.toLowerCase()}
          </p>
          <h2 className="mt-3 font-serif text-3xl text-(--jm-ink) sm:text-4xl">
            {travellers.map((t) => t.label).join(" · ")}
          </h2>
          <p className="mt-3 font-sans text-lg text-(--jm-muted)">
            {region.includesKush ? `${from.person} sets out with the ${region.name.toLowerCase()}. ` : ""}
            Up to {Math.round(farthest / 10) * 10} km to {to.city}, and every kilometre worth it.
          </p>
        </>
      ),
    };
  });

  camera.push({ at: 1, point: venue, zoom: 1.5 });

  const stops: AtlasStop[] = [
    {
      key: "homes",
      from: -1,
      to: HOMES_END,
      content: (
        <>
          <p className="text-[0.65rem] tracking-[0.35em] text-(--jm-accent) uppercase">Every corner of India</p>
          <h1 className="mt-3 font-serif text-[clamp(2.4rem,6vw,4rem)] leading-[0.95] text-(--jm-ink)">
            {couple.partner1} <span className="font-script text-[0.75em] text-(--jm-accent)">&amp;</span> {couple.partner2}
          </h1>
          {invitation && (
            <p className="mt-4 font-sans text-lg leading-relaxed text-(--jm-muted) italic">
              {invitation.intro} {invitation.request}
            </p>
          )}
          <p className="mt-5 text-[0.65rem] tracking-[0.3em] text-(--jm-muted) uppercase">
            Scroll to tour the routes · {regions.length} legs
          </p>
        </>
      ),
    },
    ...legStops,
    {
      key: "arrival",
      from: ARRIVAL_START,
      to: 2,
      content: (
        <>
          <p className="text-[0.65rem] tracking-[0.35em] text-(--jm-accent) uppercase">Arrival · {to.city}</p>
          <h2 className="mt-3 font-serif text-[clamp(2rem,5vw,3.4rem)] leading-[0.98] text-(--jm-ink) text-balance">
            {location.venue ?? location.city}
          </h2>
          <p className="mt-3 font-sans text-lg text-(--jm-muted)">
            {weddingDate.display} · {schedule.flatMap((day) => day.events).length} ceremonies over {schedule.length} days
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

  return (
    <ScrollAtlas
      routes={routes}
      stops={stops}
      pins={[
        { point: origin, stop: from, align: "start" },
        { point: venue, stop: to, align: "start" },
      ]}
      places={guestOrigins.map((place) => ({ point: project(place, INDIA_BOUNDS), label: place.city }))}
      rail={{ from: "India", to: to.code ?? to.city }}
      decor={<MapDecor bounds={INDIA_BOUNDS} step={4} />}
      camera={camera}
      stageClassName="map-paper bg-(--jm-bg)"
      ariaLabel={`Map touring routes from every region of India to ${to.city}`}
    />
  );
}
