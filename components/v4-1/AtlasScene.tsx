"use client";

import { useMemo, useRef } from "react";
import { Canvas, useThree, type RootState } from "@react-three/fiber";
import * as THREE from "three";
import {
  DEFAULT_PITCH,
  type Atlas3DCameraKeyframe,
  type Atlas3DPin,
  type Atlas3DPlace,
  type Atlas3DRoute,
  type AtlasFocus,
  type MapPoint,
} from "@/components/v4-1/atlas";
import {
  Atmosphere,
  Clouds,
  FOV,
  FrameDriver,
  Graticule,
  PATCH_SIZE,
  PinMarker,
  PlaceMarker,
  RouteLines,
  SKY,
  Terrain,
  Traveller,
  airCurve,
  applyFocus,
  clamp01,
  createRouteState,
  createTravellerState,
  distanceForFit,
  footprint,
  placeCamera,
  refreshCameraMatrices,
  smoothstep,
  unitsPerPixel,
  createViewState,
} from "@/components/v4-1/mapScene";

const DIM_SPAN = 0.05;
const DIMMED = 0.3;

export interface AtlasSceneProps {
  progress: { current: number };
  routes: Atlas3DRoute[];
  pins: Atlas3DPin[];
  places: Atlas3DPlace[];
  camera: Atlas3DCameraKeyframe[];
  focus: AtlasFocus;
  /** Ground point the hills and clouds gather around. */
  centre: MapPoint;
  /** Where 0° longitude, 0° latitude falls, so the graticule lines up with real meridians. */
  gridOrigin: MapPoint;
  active: boolean;
}

// ─── Camera ──────────────────────────────────────────────────────
interface CameraSample {
  look: MapPoint;
  fit: number;
  pitch: number;
  yaw: number;
}

function sampleCamera(
  camera: Atlas3DCameraKeyframe[],
  progress: number,
  isPortrait: boolean,
): CameraSample {
  const fitOf = (frame: Atlas3DCameraKeyframe) =>
    isPortrait && frame.portraitFit !== undefined ? frame.portraitFit : frame.fit;
  const lookOf = (frame: Atlas3DCameraKeyframe) =>
    isPortrait && frame.portraitLook ? frame.portraitLook : frame.look;
  const pitchOf = (frame: Atlas3DCameraKeyframe) => frame.pitch ?? DEFAULT_PITCH;
  const yawOf = (frame: Atlas3DCameraKeyframe) => frame.yaw ?? 0;

  const next = camera.findIndex((frame) => frame.at >= progress);
  if (next <= 0) {
    const frame = camera[next === 0 ? 0 : camera.length - 1];
    return { look: lookOf(frame), fit: fitOf(frame), pitch: pitchOf(frame), yaw: yawOf(frame) };
  }

  const a = camera[next - 1];
  const b = camera[next];
  const t = smoothstep(clamp01((progress - a.at) / (b.at - a.at || 1)));
  const la = lookOf(a);
  const lb = lookOf(b);
  const fa = fitOf(a);
  const fb = fitOf(b);
  return {
    look: { x: la.x + (lb.x - la.x) * t, z: la.z + (lb.z - la.z) * t },
    // Zooming feels even when the fit changes geometrically rather than linearly
    fit: fa * Math.pow(fb / fa, t),
    pitch: pitchOf(a) + (pitchOf(b) - pitchOf(a)) * t,
    yaw: yawOf(a) + (yawOf(b) - yawOf(a)) * t,
  };
}

// ─── Scene ───────────────────────────────────────────────────────
/**
 * The scroll atlas in three.js: every frame the scroll progress picks the
 * camera keyframe, how much of each route is drawn, and where its head is.
 */
function Atlas({
  progress,
  routes,
  pins,
  places,
  camera,
  focus,
  centre,
  gridOrigin,
}: Omit<AtlasSceneProps, "active">) {
  const view = useRef(createViewState());
  const { size } = useThree();
  // Rendered client-only (dynamic import with ssr: false), so window is available at first render.
  const reducedMotion = useMemo(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );

  const curves = useMemo(
    () => routes.map((route) => airCurve(route.from, route.to, route.bow)),
    [routes],
  );
  const routeStates = useMemo(() => routes.map(() => createRouteState()), [routes]);
  const travellerStates = useMemo(() => routes.map(() => createTravellerState()), [routes]);
  const flatSpots = useMemo(
    () => [...pins.map((pin) => pin.point), ...places.map((place) => place.point)],
    [pins, places],
  );
  // Only the legs inside India cross the hills; everything else flies far above them
  const corridor = useMemo(
    () =>
      curves
        .filter((curve) => curve.getPoint(0).distanceTo(curve.getPoint(1)) < PATCH_SIZE / 2)
        .flatMap((curve) => footprint(curve)),
    [curves],
  );
  const scratch = useMemo(() => ({ look: new THREE.Vector3(), offset: new THREE.Vector3() }), []);

  const update = (state: RootState) => {
    const cam = state.camera as THREE.PerspectiveCamera;
    const { width, height } = size;
    const isPortrait = width < height;
    const t = progress.current;

    // Camera: tilted down at the look point, far enough back to show `fit` degrees
    const frame = sampleCamera(camera, t, isPortrait);
    const distance = distanceForFit(frame.fit, width, height);
    scratch.look.set(frame.look.x, 0, frame.look.z);
    placeCamera(
      cam,
      scratch.look,
      distance,
      THREE.MathUtils.degToRad(frame.pitch),
      THREE.MathUtils.degToRad(frame.yaw),
      scratch.offset,
    );
    applyFocus(cam, width, height, isPortrait ? focus.portrait : focus.landscape);
    refreshCameraMatrices(cam);

    const v = view.current;
    v.fit = frame.fit;
    v.distance = distance;
    v.unitsPerPx = unitsPerPixel(height);
    v.pxPerUnitAtLook = 1 / (v.unitsPerPx * distance);
    v.time = state.clock.elapsedTime;
    v.reducedMotion = reducedMotion;

    // Routes draw in with the scroll, dim once the homeward leg begins, and carry their head
    routes.forEach((route, index) => {
      const [start, end] = route.window;
      const local = clamp01((t - start) / (end - start));
      const dim = route.fadeAfter === undefined ? 0 : clamp01((t - route.fadeAfter) / DIM_SPAN);
      routeStates[index].reveal = local;
      routeStates[index].opacity = 1 - dim * (1 - (route.fadeTo ?? DIMMED));
      const head = travellerStates[index];
      head.t = local;
      head.visible =
        (local > 0 && local < 1) ||
        (local >= 1 && route.head === "plane" && route.fadeAfter === undefined);
    });
  };

  return (
    <>
      <FrameDriver run={update} />
      <Atmosphere view={view} />
      <Terrain centre={centre} flatSpots={flatSpots} corridor={corridor} />
      <Graticule view={view} origin={gridOrigin} />

      {routes.map((route, index) => (
        <group key={route.id}>
          <RouteLines
            curve={curves[index]}
            width={route.width}
            ghost={route.ghost}
            state={routeStates[index]}
            view={view}
          />
          <Traveller
            curve={curves[index]}
            kind={route.head === "dot" ? "dot" : "plane"}
            state={travellerStates[index]}
            view={view}
          />
        </group>
      ))}

      {pins.map((pin) => (
        <PinMarker key={pin.stop.city} {...pin} view={view} />
      ))}
      {places.map((place) => (
        <PlaceMarker key={place.label} {...place} view={view} />
      ))}
      <Clouds view={view} centre={centre} />
    </>
  );
}

export default function AtlasScene({ active, ...props }: AtlasSceneProps) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      frameloop={active ? "always" : "never"}
      camera={{ position: [0, 30, 40], fov: FOV, near: 0.5, far: 4000 }}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      onCreated={({ gl }) => gl.setClearColor(SKY)}
      style={{ pointerEvents: "none" }}
    >
      <Atlas {...props} />
    </Canvas>
  );
}
