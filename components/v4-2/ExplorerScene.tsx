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
  GROUND_LIFT,
  easeInOutCubic,
  groundCurve,
  refreshCameraMatrices,
  smoothstep,
  unitsPerPixel,
  type MapPalette,
} from "@/components/v4-1/mapScene";
import Landmass from "@/components/v4-2/Landmass";
import { routeMatches, type ExplorerRoute, type ExplorerStage } from "@/components/v4-2/stages";

/**
 * Version 4.2 draws the shared flyover as an old atlas page, in the journey-day
 * tokens (`app/globals.css`): cream paper for the sea, tea-stained gold-ochre
 * land, fine navy-ink coastlines and graticule, terracotta routes.
 */
const DAY_PALETTE: MapPalette = {
  sky: "#f3ecdd",
  hemisphereSky: "#fff6e4",
  hemisphereGround: "#f3ecdd",
  sun: "#fff1d6",
  terrainLow: "#d5b984",
  terrainHigh: "#b8923f",
  // Ink rules on paper: faint 10° lines, a little firmer every 30°
  gridCell: "#dbd0b8",
  gridSection: "#c4b79c",
  ink: "#1f2a44",
  accent: "#c8553d",
  // Gold, not the terracotta accent (the route itself) or the ink navy (the
  // static city dots) — the travelling dot needs a hue distinct from both.
  travellerAccent: "#b8923f",
  cloud: "#fff8ee",
  // A paper map wants to be read edge to edge: keep the haze to the far horizon
  fogNear: 2.6,
  fogFar: 7,
  // Flat paper takes no glow; a lit pin just blotches the ground, and the pin
  // itself reads as a printed mark rather than a lamp
  pinLight: 0,
  pinEmissive: 0.3,
  // Navy hulls with a terracotta fin, like the paper plane on the day maps
  vehicleBody: "#1f2a44",
  vehicleAccent: "#c8553d",
  vehicleDark: "#6f6b60",
};

// The ground itself: India's real coastline for the close-in stages, the whole
// world's for the pulled-back one (see components/v4-2/Landmass.tsx). The sea
// is the paper, a shade deeper than the page so the sheet reads as a map; the
// land is tea-stained ochre; the coast is a fine line of the same ink as the type.
const LAND_COLOR = "#d5b984";
const OCEAN_COLOR = "#ece2cb";
const COASTLINE_COLOR = "#1f2a44";
const COASTLINE_OPACITY = 0.55;

/** How long the camera takes to fly from one stop to the next. */
const FLIGHT_SECONDS = 1.8;
/** How far beyond the destination (in degrees) an arriving guest's approach begins — off any India framing. */
const APPROACH_RANGE = 26;
/** Cruising height the approach starts from, in map units. */
const APPROACH_HEIGHT = 7;

/**
 * The last leg of a long-haul flight: from high up and far out on the true
 * bearing of the origin, gliding down to touch the destination. Bowed a little
 * sideways so guests from the same quarter don't fly in single file.
 */
function approachCurve(from: MapPoint, to: MapPoint, bow = 0): THREE.Curve<THREE.Vector3> {
  const dx = from.x - to.x;
  const dz = from.z - to.z;
  const length = Math.hypot(dx, dz) || 1;
  const dir = { x: dx / length, z: dz / length };
  const side = { x: dir.z, z: -dir.x };
  const lateral = bow * APPROACH_RANGE;
  const at = (range: number, height: number, sway: number) =>
    new THREE.Vector3(
      to.x + dir.x * range + side.x * sway,
      height,
      to.z + dir.z * range + side.z * sway,
    );
  return new THREE.CubicBezierCurve3(
    at(APPROACH_RANGE, APPROACH_HEIGHT, 0),
    at(APPROACH_RANGE * 0.6, APPROACH_HEIGHT * 0.85, lateral),
    at(APPROACH_RANGE * 0.2, 2.2, lateral * 0.5),
    at(0, GROUND_LIFT, 0),
  );
}
/** How long a route takes to draw itself in once its turn comes. */
const DRAW_SECONDS = 1.4;
/** Routes start drawing this long into the flight, one after another. */
const DRAW_DELAY = 0.5;
const DRAW_STAGGER = 0.28;
const UNDRAW_SECONDS = 0.7;
const DIM_SECONDS = 0.9;
/** Opacity earlier legs settle to once a later leg takes over. */
const FADED = 0.08;
/** Tilt limits for looking around, as polar angles from straight down: 70° to 24° below the horizon. */
const POLAR_MIN = 0.35;
const POLAR_MAX = 1.15;
/**
 * Idle motion: rather than spinning the map round (a real coastline turned
 * sideways stops reading as a map), the world breathes — a slow sway of a few
 * degrees either side of north-up.
 */
const SWAY_RADIANS = 0.05;
const SWAY_PERIOD = 26;
/** How fast the labels come and go when a stage wants the map bare. */
const LABEL_FADE_SECONDS = 0.6;
/** Longest step the scene clock takes in one frame, so a paused tab resumes rather than jumps. */
const MAX_STEP = 0.1;
const UP = new THREE.Vector3(0, 1, 0);

/** Wraps an angle difference to the shortest way round. */
function shortestTurn(from: number, to: number) {
  return Math.atan2(Math.sin(to - from), Math.cos(to - from));
}

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
        approach: route.approach ? approachCurve(route.from, route.to, route.bow) : null,
      })),
    [routes],
  );
  // Arrivals from beyond the frame glide in on their approach; otherwise the
  // plane flies the arc and the train and car take the road
  const activeCurve = (index: number) => {
    const { air, ground, approach } = curves[index];
    if (approach) return approach;
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
  /** The sway applied so far, so each frame only adds the difference. */
  const swayApplied = useRef(0);
  // The scene keeps its own clock: R3F rewinds `clock.elapsedTime` whenever the
  // frameloop switches (as it does when the stage scrolls off and back on), which
  // would leave every flight, draw delay and loop start pointing at the wrong time.
  const clock = useRef(0);

  const update = (state: RootState, step: number) => {
    const cam = state.camera as THREE.PerspectiveCamera;
    const controls = controlsRef.current;
    const { width, height } = size;
    const isPortrait = width < height;
    const delta = Math.min(Math.max(step, 0), MAX_STEP);
    clock.current += delta;
    const time = clock.current;
    const stage = stages[stageIndex];
    const look = lookOf(stage, isPortrait);
    const fit = fitOf(stage, isPortrait);
    const polar = polarOf(stage);

    // ── A new stop: plan the flight there and decide what draws in
    if (seen.current !== stageIndex) {
      const first = seen.current === -1;
      seen.current = stageIndex;
      const instant = first || reducedMotion;
      // Every stop is met north-up, turning back the shortest way from wherever the reader left it
      const azimuth = controls && !first ? controls.getAzimuthalAngle() : 0;
      flight.current = {
        from: {
          look: controls ? controls.target.clone() : new THREE.Vector3(look.x, 0, look.z),
          fit: view.current.fit,
          polar: controls && !first ? controls.getPolarAngle() : polar,
          azimuth,
        },
        to: {
          look: new THREE.Vector3(look.x, 0, look.z),
          fit,
          polar,
          azimuth: azimuth + shortestTurn(azimuth, 0),
        },
        start: time,
        duration: instant ? 0 : (stage.flight ?? FLIGHT_SECONDS),
        done: false,
      };
      if (controls) controls.enabled = false;
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
      scratch.spherical.set(
        distance,
        f.from.polar + (f.to.polar - f.from.polar) * e,
        f.from.azimuth + (f.to.azimuth - f.from.azimuth) * e,
      );
      cam.position.setFromSpherical(scratch.spherical).add(scratch.look);
      cam.up.set(0, 1, 0);
      cam.lookAt(scratch.look);
      if (controls) controls.target.copy(scratch.look);
      view.current.fit = fitNow;
      view.current.distance = distance;
      if (t >= 1) {
        f.done = true;
        // Pick the sway up from where it is now, so handing over doesn't jolt
        swayApplied.current = SWAY_RADIANS * Math.sin((time * 2 * Math.PI) / SWAY_PERIOD);
        if (controls) {
          controls.enabled = true;
          controls.update();
        }
      }
    } else {
      // Free to explore. Zoom is off, so only a resize can change the framing:
      // keep the distance honest for the current stage size, and let the world
      // sway gently while nobody is dragging it.
      const distance = distanceForFit(fit, width, height);
      scratch.look.set(look.x, 0, look.z);
      if (controls) {
        controls.target.copy(scratch.look);
        scratch.offset.copy(cam.position).sub(scratch.look).setLength(distance);
        if (!reducedMotion) {
          const sway = SWAY_RADIANS * Math.sin((time * 2 * Math.PI) / SWAY_PERIOD);
          scratch.offset.applyAxisAngle(UP, sway - swayApplied.current);
          swayApplied.current = sway;
        }
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
    const labelsWanted = stage.labels === false ? 0 : 1;
    v.labels = reducedMotion
      ? labelsWanted
      : v.labels + THREE.MathUtils.clamp(labelsWanted - v.labels, -delta / LABEL_FADE_SECONDS, delta / LABEL_FADE_SECONDS);

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
      // An arrival has no line to wait for; anything else rides only a finished route
      const ready = route.approach ? true : line.reveal >= 0.999;
      if (!ready || (!run.looping && !run.parked)) {
        head.visible = false;
        run.started = false;
        return;
      }
      if (run.parked) {
        head.visible = true;
        head.t = 1;
        head.scale = 1;
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
      // Arrivals grow in from the distance and shrink away as they touch down,
      // so each landing hands over cleanly to the next approach
      head.scale = route.approach
        ? smoothstep(clamp01(head.t / 0.15)) * (1 - smoothstep(clamp01((head.t - 0.88) / 0.12)))
        : 1;
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
        rotateSpeed={0.5}
        enableDamping
        dampingFactor={0.06}
      />
      <CameraSync />
      <Atmosphere view={view} palette={DAY_PALETTE} />
      <Landmass
        view={view}
        gridOrigin={gridOrigin}
        land={LAND_COLOR}
        ocean={OCEAN_COLOR}
        coastline={COASTLINE_COLOR}
        coastlineOpacity={COASTLINE_OPACITY}
      />
      <Graticule view={view} origin={gridOrigin} palette={DAY_PALETTE} />

      {routes.map((route, index) => (
        <group key={route.id}>
          {!route.approach && (
            <RouteLines
              curve={activeCurve(index)}
              width={route.width}
              ghost={route.ghost}
              state={routeStates[index]}
              view={view}
              palette={DAY_PALETTE}
            />
          )}
          <Traveller
            curve={activeCurve(index)}
            kind={route.head === "dot" ? "dot" : (route.vehicleKind ?? kind)}
            state={travellerStates[index]}
            view={view}
            palette={DAY_PALETTE}
            label={route.approach ? route.label : undefined}
          />
        </group>
      ))}

      {pins.map((pin) => (
        <PinMarker key={pin.stop.city} {...pin} view={view} palette={DAY_PALETTE} />
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
