"use client";

import { useMemo, useRef } from "react";
import { Canvas, useThree, type RootState } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";
import type { VehicleKind } from "@/components/v4/vehicles";
import {
  DEFAULT_PITCH,
  type Atlas3DPin,
  type Atlas3DPlace,
  type AtlasFocus,
  type MapPoint,
} from "@/components/v4-1/atlas";
import {
  Atmosphere,
  Clouds,
  FOV,
  FrameDriver,
  Graticule,
  PinMarker,
  PlaceMarker,
  RouteLines,
  Traveller,
  airCurve,
  applyFocus,
  clamp01,
  createRouteState,
  createTravellerState,
  createViewState,
  distanceForFit,
  easeInOutCubic,
  groundCurve,
  refreshCameraMatrices,
  unitsPerPixel,
  type MapPalette,
} from "@/components/v4-1/mapScene";
import Landmass from "@/components/v4-2/Landmass";
import { routeMatches, type ExplorerRoute, type ExplorerStage } from "@/components/v4-2/stages";

/**
 * Version 4.2 re-themes the shared night flyover for daylight — the same
 * hills, fog and route thread, recoloured with the journey-day tokens
 * (`app/globals.css`) so the 3D world matches the warm wedding palette.
 */
const DAY_PALETTE: MapPalette = {
  sky: "#f3ecdd",
  hemisphereSky: "#fff6e4",
  hemisphereGround: "#f3ecdd",
  sun: "#fff1d6",
  terrainLow: "#cbb98f",
  terrainHigh: "#b8923f",
  gridCell: "#ddceac",
  gridSection: "#b8923f",
  ink: "#1f2a44",
  accent: "#c8553d",
  // Gold, not the terracotta accent (the route itself) or the ink navy (the
  // static city dots) — the travelling dot needs a hue distinct from both.
  travellerAccent: "#b8923f",
  cloud: "#fff6ea",
};

// The ground itself: India's real coastline for the close-in stages, the whole
// world's for the pulled-back one (see components/v4-2/Landmass.tsx).
const LAND_COLOR = "#cbb98f";
const OCEAN_COLOR = "#a9c4c9";
const COASTLINE_COLOR = "#8f6a3a";

/** How long the camera takes to fly from one stop to the next. */
const FLIGHT_SECONDS = 1.8;
/** How long a route takes to draw itself in once its turn comes. */
const DRAW_SECONDS = 1.4;
/** Routes start drawing this long into the flight, one after another. */
const DRAW_DELAY = 0.5;
const DRAW_STAGGER = 0.28;
const UNDRAW_SECONDS = 0.7;
const DIM_SECONDS = 0.9;
/** Opacity earlier legs settle to once a later leg takes over. */
const FADED = 0.08;
/** Tilt limits for looking around, as polar angles from straight down: 64° to 24° below the horizon. */
const POLAR_MIN = 0.45;
const POLAR_MAX = 1.15;

export interface ExplorerSceneProps {
  stages: ExplorerStage[];
  stageIndex: number;
  kind: VehicleKind;
  routes: ExplorerRoute[];
  pins: Atlas3DPin[];
  places: Atlas3DPlace[];
  focus: AtlasFocus;
  /** Ground point the hills and clouds gather around. */
  centre: MapPoint;
  /** Where 0° longitude, 0° latitude falls, so the graticule lines up with real meridians. */
  gridOrigin: MapPoint;
  active: boolean;
}

interface Pose {
  look: THREE.Vector3;
  fit: number;
  polar: number;
  azimuth: number;
}

interface Flight {
  from: Pose;
  to: Pose;
  start: number;
  duration: number;
  done: boolean;
}

/** Per-route bookkeeping for the current stop. */
interface RouteRun {
  revealTarget: number;
  opacityTarget: number;
  /** Time the route may start drawing itself in. */
  drawAt: number;
  looping: boolean;
  parked: boolean;
  /** Time the traveller last set off from the start of the route. */
  loopStart: number;
  /** Whether loopStart has been latched for the traveller's current looping/parked spell. */
  started: boolean;
  /** Head start (in trips) before this route's traveller first leaves, so dots stream rather than bunch. */
  phase: number;
}

function lookOf(stage: ExplorerStage, isPortrait: boolean) {
  return isPortrait && stage.camera.portraitLook ? stage.camera.portraitLook : stage.camera.look;
}

function fitOf(stage: ExplorerStage, isPortrait: boolean) {
  return isPortrait && stage.camera.portraitFit !== undefined
    ? stage.camera.portraitFit
    : stage.camera.fit;
}

/** Polar angle (from straight down) for the stage's pitch below the horizon. */
function polarOf(stage: ExplorerStage) {
  return Math.PI / 2 - THREE.MathUtils.degToRad(stage.camera.pitch ?? DEFAULT_PITCH);
}

/** Refreshes the camera matrices after the orbit controls have moved it, so labels project the final pose. */
function CameraSync() {
  return <FrameDriver run={({ camera }) => refreshCameraMatrices(camera)} />;
}

/**
 * The explorable atlas: each stop is a world the reader can drag around and
 * watch, and choosing the next one flies the camera there while the new
 * routes draw themselves in.
 */
function Explorer({
  stages,
  stageIndex,
  kind,
  routes,
  pins,
  places,
  focus,
  centre,
  gridOrigin,
}: Omit<ExplorerSceneProps, "active">) {
  const view = useRef(createViewState());
  const { size } = useThree();
  // Rendered client-only (dynamic import with ssr: false), so window is available at first render.
  const reducedMotion = useMemo(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );
  const controlsRef = useRef<OrbitControlsImpl>(null);

  const curves = useMemo(
    () =>
      routes.map((route) => ({
        air: airCurve(route.from, route.to, route.bow),
        ground: route.head === "vehicle" ? groundCurve(route.from, route.to) : null,
      })),
    [routes],
  );
  // The plane flies the arc; the train and car take the road
  const activeCurve = (index: number) => {
    const { air, ground } = curves[index];
    const routeKind = routes[index].vehicleKind ?? kind;
    return routeKind === "plane" || !ground ? air : ground;
  };
  const routeStates = useMemo(() => routes.map(() => createRouteState()), [routes]);
  const travellerStates = useMemo(() => routes.map(() => createTravellerState()), [routes]);
  const runs = useRef<RouteRun[]>(
    routes.map((_, index) => ({
      revealTarget: 0,
      opacityTarget: 1,
      drawAt: 0,
      looping: false,
      parked: false,
      loopStart: 0,
      started: false,
      phase: (index % 4) * 0.27,
    })),
  );
  const scratch = useMemo(
    () => ({ look: new THREE.Vector3(), offset: new THREE.Vector3(), spherical: new THREE.Spherical() }),
    [],
  );
  const flight = useRef<Flight | null>(null);
  const seen = useRef(-1);

  const update = (state: RootState, delta: number) => {
    const cam = state.camera as THREE.PerspectiveCamera;
    const controls = controlsRef.current;
    const { width, height } = size;
    const isPortrait = width < height;
    const time = state.clock.elapsedTime;
    const stage = stages[stageIndex];
    const look = lookOf(stage, isPortrait);
    const fit = fitOf(stage, isPortrait);
    const polar = polarOf(stage);

    // ── A new stop: plan the flight there and decide what draws in
    if (seen.current !== stageIndex) {
      const first = seen.current === -1;
      seen.current = stageIndex;
      const instant = first || reducedMotion;
      // Carry the reader's current heading across, so the world turns only as much as it must
      const azimuth = controls && !first ? controls.getAzimuthalAngle() : 0;
      flight.current = {
        from: {
          look: controls ? controls.target.clone() : new THREE.Vector3(look.x, 0, look.z),
          fit: view.current.fit,
          polar: controls && !first ? controls.getPolarAngle() : polar,
          azimuth,
        },
        to: { look: new THREE.Vector3(look.x, 0, look.z), fit, polar, azimuth },
        start: time,
        duration: instant ? 0 : FLIGHT_SECONDS,
        done: false,
      };
      if (controls) {
        controls.enabled = false;
        controls.autoRotate = false;
      }
      let order = 0;
      routes.forEach((route, index) => {
        const run = runs.current[index];
        const drawn = routeMatches(route.id, stage.drawn);
        if (drawn && run.revealTarget < 1) {
          run.drawAt = instant ? time : time + DRAW_DELAY + order * DRAW_STAGGER;
          order += 1;
        }
        run.revealTarget = drawn ? 1 : 0;
        run.opacityTarget = routeMatches(route.id, stage.dimmed) ? FADED : 1;
        run.looping = routeMatches(route.id, stage.looping);
        run.parked = routeMatches(route.id, stage.parked);
      });
    }

    // ── Camera: fly to the stop, then hand the reader the orbit controls
    const f = flight.current!;
    if (!f.done) {
      const t = f.duration === 0 ? 1 : clamp01((time - f.start) / f.duration);
      const e = easeInOutCubic(t);
      scratch.look.copy(f.from.look).lerp(f.to.look, e);
      // Zooming feels even when the fit changes geometrically rather than linearly
      const fitNow = f.from.fit * Math.pow(f.to.fit / f.from.fit, e);
      const distance = distanceForFit(fitNow, width, height);
      scratch.spherical.set(distance, f.from.polar + (f.to.polar - f.from.polar) * e, f.from.azimuth);
      cam.position.setFromSpherical(scratch.spherical).add(scratch.look);
      cam.up.set(0, 1, 0);
      cam.lookAt(scratch.look);
      if (controls) controls.target.copy(scratch.look);
      view.current.fit = fitNow;
      view.current.distance = distance;
      if (t >= 1) {
        f.done = true;
        if (controls) {
          controls.enabled = true;
          controls.autoRotate = !reducedMotion;
          controls.update();
        }
      }
    } else {
      // Free to explore. Zoom is off, so only a resize can change the framing:
      // keep the distance honest for the current stage size.
      const distance = distanceForFit(fit, width, height);
      scratch.look.set(look.x, 0, look.z);
      if (controls) {
        controls.target.copy(scratch.look);
        scratch.offset.copy(cam.position).sub(scratch.look).setLength(distance);
        cam.position.copy(scratch.look).add(scratch.offset);
      }
      view.current.fit = fit;
      view.current.distance = distance;
    }
    applyFocus(cam, width, height, isPortrait ? focus.portrait : focus.landscape);

    const v = view.current;
    v.unitsPerPx = unitsPerPixel(height);
    v.pxPerUnitAtLook = 1 / (v.unitsPerPx * v.distance);
    v.time = time;
    v.reducedMotion = reducedMotion;

    // ── Routes ease toward what this stop wants; travellers ride the finished ones
    routes.forEach((route, index) => {
      const run = runs.current[index];
      const line = routeStates[index];
      if (reducedMotion) {
        line.reveal = run.revealTarget;
        line.opacity = run.opacityTarget;
      } else {
        if (run.revealTarget > line.reveal && time >= run.drawAt) {
          line.reveal = Math.min(1, line.reveal + delta / DRAW_SECONDS);
        } else if (run.revealTarget < line.reveal) {
          line.reveal = Math.max(0, line.reveal - delta / UNDRAW_SECONDS);
        }
        const step = delta / DIM_SECONDS;
        line.opacity =
          line.opacity < run.opacityTarget
            ? Math.min(run.opacityTarget, line.opacity + step)
            : Math.max(run.opacityTarget, line.opacity - step);
      }

      const head = travellerStates[index];
      if (line.reveal < 0.999 || (!run.looping && !run.parked)) {
        head.visible = false;
        run.started = false;
        return;
      }
      if (run.parked) {
        head.visible = true;
        head.t = 1;
        run.started = false;
        return;
      }
      // Set off from the start of the route the moment it is complete (once, latched — not
      // every frame, or a nonzero phase would keep trips negative and never leave the start),
      // then keep going round.
      if (!run.started) {
        run.loopStart = time;
        run.started = true;
      }
      const trips = (time - run.loopStart) / route.trip - run.phase;
      head.visible = trips >= 0;
      head.t = trips >= 0 ? trips % 1 : 0;
    });
  };

  return (
    <>
      <FrameDriver run={update} />
      <OrbitControls
        ref={controlsRef}
        makeDefault
        enableZoom={false}
        enablePan={false}
        minPolarAngle={POLAR_MIN}
        maxPolarAngle={POLAR_MAX}
        autoRotateSpeed={0.45}
        rotateSpeed={0.5}
        enableDamping
        dampingFactor={0.06}
      />
      <CameraSync />
      <Atmosphere view={view} palette={DAY_PALETTE} />
      <Landmass view={view} gridOrigin={gridOrigin} land={LAND_COLOR} ocean={OCEAN_COLOR} coastline={COASTLINE_COLOR} />
      <Graticule view={view} origin={gridOrigin} palette={DAY_PALETTE} />

      {routes.map((route, index) => (
        <group key={route.id}>
          <RouteLines
            curve={activeCurve(index)}
            width={route.width}
            ghost={route.ghost}
            state={routeStates[index]}
            view={view}
            palette={DAY_PALETTE}
          />
          <Traveller
            curve={activeCurve(index)}
            kind={route.head === "dot" ? "dot" : (route.vehicleKind ?? kind)}
            state={travellerStates[index]}
            view={view}
            palette={DAY_PALETTE}
          />
        </group>
      ))}

      {pins.map((pin) => (
        <PinMarker key={pin.stop.city} {...pin} view={view} />
      ))}
      {places.map((place) => (
        <PlaceMarker key={place.label} {...place} view={view} palette={DAY_PALETTE} />
      ))}
      <Clouds view={view} centre={centre} palette={DAY_PALETTE} />
    </>
  );
}

export default function ExplorerScene({ active, ...props }: ExplorerSceneProps) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      frameloop={active ? "always" : "never"}
      camera={{ position: [0, 30, 40], fov: FOV, near: 0.5, far: 4000 }}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      onCreated={({ gl }) => gl.setClearColor(DAY_PALETTE.sky)}
    >
      <Explorer {...props} />
    </Canvas>
  );
}
