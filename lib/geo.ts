import type { JourneyStop } from "@/lib/content";

export interface Bounds {
  west: number;
  east: number;
  south: number;
  north: number;
}

/** Lon/lat window covering both wedding stops with room to breathe. */
export const MAP_BOUNDS: Bounds = { west: 68, east: 84, south: 14, north: 32 };
/** The whole subcontinent, for maps that show guests arriving from everywhere. */
export const INDIA_BOUNDS: Bounds = { west: 67, east: 98, south: 5, north: 37 };
export const MAP_SIZE = 1000;

/** Equirectangular projection into the map's 1000×1000 viewBox. */
export function project(stop: Pick<JourneyStop, "lat" | "lon">, bounds: Bounds = MAP_BOUNDS) {
  const { west, east, south, north } = bounds;
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

/** Grid lines with their labels, for the map's graticule. */
export function graticule(bounds: Bounds = MAP_BOUNDS, step = 2) {
  const { west, east, south, north } = bounds;
  const meridians = [];
  for (let lon = Math.ceil(west / step) * step; lon < east; lon += step) {
    if (lon > west) meridians.push({ label: `${lon}°E`, x: project({ lat: south, lon }, bounds).x });
  }
  const parallels = [];
  for (let lat = Math.ceil(south / step) * step; lat < north; lat += step) {
    if (lat > south) parallels.push({ label: `${lat}°N`, y: project({ lat, lon: west }, bounds).y });
  }
  return { meridians, parallels };
}
