import type { ReactNode } from "react";
import type { JourneyStop } from "@/lib/content";

/**
 * Data contract for the three.js scroll atlas (version 4.1). It mirrors the
 * SVG atlas that version 13 uses, but every point is a position on the ground
 * plane in map degrees — x runs east, z runs south — so it stays plain data
 * that a server component can build and hand to the client scene.
 */
export interface MapPoint {
  x: number;
  z: number;
}

export interface Atlas3DRoute {
  id: string;
  from: MapPoint;
  to: MapPoint;
  /** Scroll-progress window during which this route draws itself. */
  window: [number, number];
  head?: "plane" | "dot";
  /** Sideways bow of the arc as a fraction of its length; the sign picks the side. */
  bow?: number;
  /** On-screen width of the drawn line, in CSS pixels. */
  width?: number;
  /** Opacity of the route before it is drawn. */
  ghost?: number;
  /** Scroll progress after which the drawn route dims, so later routes stand out. */
  fadeAfter?: number;
  /** Opacity the route dims to (default 0.3). */
  fadeTo?: number;
}

export interface Atlas3DStop {
  key: string;
  /** Scroll-progress window during which the card is shown. */
  from: number;
  to: number;
  content: ReactNode;
}

export interface Atlas3DPin {
  point: MapPoint;
  stop: JourneyStop;
  align: "start" | "end";
  color?: string;
  /** Camera fit (visible map width, in degrees) beyond which the pin fades out. */
  hideBeyond?: number;
}

export interface Atlas3DPlace {
  point: MapPoint;
  label: string;
  /** Camera fit beyond which the label fades out, so crowded regions stay legible when zoomed out. */
  hideBeyond?: number;
}

export interface Atlas3DCameraKeyframe {
  at: number;
  /** Ground point the camera looks at. */
  look: MapPoint;
  /** Look-at point to use instead when the stage is taller than it is wide. */
  portraitLook?: MapPoint;
  /**
   * How much map to show: the visible ground width across the stage's longer
   * side, in degrees. Small fits zoom in, large fits pull out to the world.
   */
  fit: number;
  /** Fit to use instead when the stage is taller than it is wide. */
  portraitFit?: number;
  /** Camera tilt below the horizon, in degrees (default 46). */
  pitch?: number;
  /** Camera swing about the vertical axis, in degrees; 0 looks north. */
  yaw?: number;
}

export interface AtlasFocus {
  /** Where on the stage the look-at point sits, as fractions of width and height. */
  portrait: { x: number; y: number };
  landscape: { x: number; y: number };
}

export const DEFAULT_PITCH = 46;
