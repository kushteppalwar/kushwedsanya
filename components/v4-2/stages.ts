import type { MapPoint } from "@/components/v4-1/atlas";
import type { VehicleKind } from "@/components/v4/vehicles";

/**
 * Data contract for the explorable atlas (version 4.2). The journey is a list
 * of stops; each is a whole world to look around in, and the Next button flies
 * the camera from one to the next. Everything is plain data so a server
 * component can build it and hand it to the client.
 */
export interface ExplorerRoute {
  id: string;
  from: MapPoint;
  to: MapPoint;
  /** Sideways bow of the arc as a fraction of its length; the sign picks the side. */
  bow?: number;
  /** On-screen width of the drawn line, in CSS pixels. */
  width?: number;
  /** Opacity of the route before it is drawn. */
  ghost?: number;
  /** What travels the route: the version 4 vehicle (plane, train or car) or a glowing dot. */
  head: "vehicle" | "dot";
  /** Pins a "vehicle" route to one kind regardless of the by air/rail/road switch — an
   * overseas guest route can't sensibly follow the switch onto a car or train. */
  vehicleKind?: VehicleKind;
  /** Seconds one trip along the route takes when the traveller is looping. */
  trip: number;
}

export interface ExplorerCamera {
  /** Ground point the camera looks at (and orbits around). */
  look: MapPoint;
  /** Look-at point to use instead when the stage is taller than it is wide. */
  portraitLook?: MapPoint;
  /** Visible map width across the stage's longer side, in degrees. */
  fit: number;
  /** Fit to use instead when the stage is taller than it is wide. */
  portraitFit?: number;
  /** Camera tilt below the horizon, in degrees (default 46). */
  pitch?: number;
}

export interface ExplorerStage {
  key: string;
  /** Short name for the Next button, e.g. "Across India". */
  short: string;
  camera: ExplorerCamera;
  /** Route ids drawn in this stage; a trailing `*` matches a prefix, e.g. "india-*". */
  drawn: string[];
  /** Routes drawn but dimmed, so the current leg stands out. */
  dimmed?: string[];
  /** Routes whose traveller keeps going round and round. */
  looping?: string[];
  /** Routes whose traveller waits at the end of the route. */
  parked?: string[];
  /** Whether the by air / by rail / by road switch applies here. */
  vehicle?: boolean;
  /** The opening panel rather than a stop card. */
  intro?: boolean;
}

/** Does a route id match one of the stage's patterns? */
export function routeMatches(id: string, patterns: string[] = []) {
  return patterns.some((pattern) =>
    pattern.endsWith("*") ? id.startsWith(pattern.slice(0, -1)) : id === pattern,
  );
}
