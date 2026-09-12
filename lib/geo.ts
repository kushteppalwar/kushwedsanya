import type { JourneyStop } from "@/lib/content";

/** Lon/lat window the journey map shows, covering both stops with room to breathe. */
export const MAP_BOUNDS = { west: 68, east: 84, south: 14, north: 32 };
export const MAP_SIZE = 1000;

/** Equirectangular projection into the map's 1000×1000 viewBox. */
export function project(stop: Pick<JourneyStop, "lat" | "lon">) {
  const { west, east, south, north } = MAP_BOUNDS;
  return {
    x: ((stop.lon - west) / (east - west)) * MAP_SIZE,
    y: ((north - stop.lat) / (north - south)) * MAP_SIZE,
  };
}

/** Great-circle distance in kilometres. */
export function distanceKm(a: JourneyStop, b: JourneyStop) {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

/** Grid lines (every 2°) with their labels, for the map's graticule. */
export function graticule() {
  const { west, east, south, north } = MAP_BOUNDS;
  const meridians = [];
  for (let lon = west + 2; lon < east; lon += 2) {
    meridians.push({ label: `${lon}°E`, x: project({ lat: south, lon }).x });
  }
  const parallels = [];
  for (let lat = south + 2; lat < north; lat += 2) {
    parallels.push({ label: `${lat}°N`, y: project({ lat, lon: west }).y });
  }
  return { meridians, parallels };
}
