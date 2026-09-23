"use client";

import { useMemo, useRef } from "react";
import { useFrame, type RootState } from "@react-three/fiber";
import { Grid, Html, Line } from "@react-three/drei";
import type { LineSegments2 } from "three-stdlib";
import * as THREE from "three";
import { Car, Plane, Train, type VehicleKind } from "@/components/v4/vehicles";
import type { MapPoint } from "@/components/v4-1/atlas";
import type { JourneyStop } from "@/lib/content";

/**
 * The night map the 3D versions share: a low-poly patch of hills around India
 * on an endless plain, a graticule, flight arcs that draw themselves in, the
 * version 4 vehicles, and pins and labels that keep their size on screen.
 *
 * Nothing here decides *when* things happen. Each piece reads a shared
 * `ViewState` (and its own small mutable state) that the owning scene's frame
 * driver fills in first thing every frame — from scroll progress in version
 * 4.1, from the chosen stop in version 4.2.
 */

// Same night palette as the version 4 flyover (the journey-night tokens)
export const SKY = "#0b1020";
export const AMBER = "#f2b544";
export const SKY_BLUE = "#7fb7ff";
export const INK = "#ece6d6";
export const MUTED = "#9aa0b4";
const LOW = "#152640";
const HIGH = "#3a5f88";

/**
 * The colours every 3D piece below actually paints with. Everything defaults
 * to the night palette above, so version 4 and 4.1 (which never pass a
 * palette) render exactly as before; version 4.2 passes its own to re-theme
 * the same scene for daylight.
 */
export interface MapPalette {
  sky: string;
  hemisphereSky: string;
  hemisphereGround: string;
  sun: string;
  terrainLow: string;
  terrainHigh: string;
  gridCell: string;
  gridSection: string;
  ink: string;
  accent: string;
  /** The guest-origin travelling dot. Its own colour so it never disappears into a same-hue route. */
  travellerAccent: string;
  cloud: string;
  /** Fog start and end, as multiples of the camera's distance to its look-at point. */
  fogNear: number;
  fogFar: number;
  /** Glow each city pin throws on the ground; 0 for a flat paper map. */
  pinLight: number;
  /** How much the pin head lights itself up; low for a printed mark. */
  pinEmissive: number;
  /** The version 4 vehicles' hull, trim and undercarriage. */
  vehicleBody: string;
  vehicleAccent: string;
  vehicleDark: string;
}

export const NIGHT_PALETTE: MapPalette = {
  sky: SKY,
  hemisphereSky: "#4a6a9c",
  hemisphereGround: SKY,
  sun: "#fff1d6",
  terrainLow: LOW,
  terrainHigh: HIGH,
  gridCell: "#24375a",
  gridSection: "#3b5a88",
  ink: INK,
  accent: AMBER,
  travellerAccent: AMBER,
  cloud: "#dfe6f3",
  fogNear: 1.3,
  fogFar: 3.4,
  pinLight: 6,
  pinEmissive: 1.6,
  vehicleBody: "#f2e8d5",
  vehicleAccent: AMBER,
  vehicleDark: "#1c2436",
};

export const FOV = 42;
/** Points sampled along every route; the draw-in reveals them one segment at a time. */
const SEGMENTS = 120;
/** Route ends hover just above the (flattened) ground under each city. */
export const GROUND_LIFT = 0.12;
/** The tallest an arc may climb; keeps the world routes under the camera at the India zoom. */
const PEAK_CAP = 14;
export const PLACE_OPACITY = 0.7;
/** Hills only exist on a square patch around India; the rest of the world is a flat plain. */
export const PATCH_SIZE = 90;
const PATCH_AMPLITUDE = 2;

// Screen sizes of the markers, in CSS pixels, matched to the version 13 map
const PIN_UNIT_PX = 40;
const VEHICLE_UNIT_PX = 16;
const DOT_PX = 4;
const DOT_HALO_PX = 9;
const PLACE_DOT_PX = 3;

/** Per-frame camera facts every part of the map reads; the scene driver writes them. */
export interface ViewState {
  /** Visible map width the camera is framing, in degrees (drives label fades). */
  fit: number;
  /** Camera distance to its look-at point. */
  distance: number;
  /** World units per CSS pixel at unit distance, for keeping markers a fixed size on screen. */
  unitsPerPx: number;
  /** CSS pixels per world unit at the look-at distance, so dashes stay a fixed size on screen. */
  pxPerUnitAtLook: number;
  time: number;
  reducedMotion: boolean;
  /** 0–1 visibility of the city and place labels, for stages that want the map bare. */
  labels: number;
}

export type ViewRef = { current: ViewState };

/** Starting view facts; keep them in a `useRef` and let the frame driver fill them in. */
export function createViewState(): ViewState {
  return {
    fit: 30,
    distance: 30,
    unitsPerPx: 0.001,
    pxPerUnitAtLook: 1,
    time: 0,
    reducedMotion: false,
    labels: 1,
  };
}

export function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

export function smoothstep(t: number) {
  return t * t * (3 - 2 * t);
}

export function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/** 1 when the camera is closer than the fit, fading to 0 a little past it. */
export function fitVisibility(fit: number, hideBeyond?: number) {
  if (hideBeyond === undefined) return 1;
  return 1 - smoothstep(clamp01((fit - hideBeyond * 0.75) / (hideBeyond * 0.5)));
}

/**
 * Runs a frame callback from wherever it is placed in the tree. Put it first
 * among siblings and it is subscribed ahead of them, so e.g. a marker's group
 * is positioned before its label projects it.
 */
export function FrameDriver({ run }: { run: (state: RootState, delta: number) => void }) {
  useFrame(run);
  return null;
}

// ─── Camera helpers ──────────────────────────────────────────────
const TAN_HALF = Math.tan(THREE.MathUtils.degToRad(FOV / 2));

/** How far back the camera sits to show `fit` degrees across the stage's longer side. */
export function distanceForFit(fit: number, width: number, height: number) {
  return width < height ? fit / (2 * TAN_HALF) : fit / (2 * TAN_HALF * (width / height));
}

export function unitsPerPixel(height: number) {
  return (2 * TAN_HALF) / height;
}

/** Places the camera `distance` from `look`, tilted `pitch` below the horizon and swung `yaw` about it (0 looks north). */
export function placeCamera(
  camera: THREE.Camera,
  look: THREE.Vector3,
  distance: number,
  pitch: number,
  yaw: number,
  scratch: THREE.Vector3,
) {
  scratch
    .set(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch))
    .multiplyScalar(distance);
  camera.position.copy(look).add(scratch);
  camera.up.set(0, 1, 0);
  camera.lookAt(look);
}

/** Slides the view so the look-at point sits at `focus` (fractions of the stage) rather than dead centre. */
export function applyFocus(
  camera: THREE.PerspectiveCamera,
  width: number,
  height: number,
  focus: { x: number; y: number },
) {
  camera.setViewOffset(width, height, (0.5 - focus.x) * width, (0.5 - focus.y) * height, width, height);
}

/** Refreshes what labels project through, ahead of the renderer doing it. */
export function refreshCameraMatrices(camera: THREE.Camera) {
  camera.updateMatrixWorld();
  camera.matrixWorldInverse.copy(camera.matrixWorld).invert();
}

// ─── Routes ──────────────────────────────────────────────────────
/**
 * A flight arc: the quadratic curve version 13 draws on paper, lifted into the
 * air. The control point sits sideways of the midpoint (the bow) and high
 * enough that the arc peaks at a height proportional to the distance flown.
 */
export function airCurve(a: MapPoint, b: MapPoint, bow = 0.2): THREE.Curve<THREE.Vector3> {
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const length = Math.hypot(dx, dz) || 1;
  const lateral = bow * length;
  const peak = Math.min(length * 0.28, PEAK_CAP);
  const control = new THREE.Vector3(
    (a.x + b.x) / 2 + (dz / length) * lateral,
    peak * 2,
    (a.z + b.z) / 2 - (dx / length) * lateral,
  );
  return new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(a.x, GROUND_LIFT, a.z),
    control,
    new THREE.Vector3(b.x, GROUND_LIFT, b.z),
  );
}

/** The version 4 road and railway: a gentle S along the ground between the two cities. */
export function groundCurve(a: MapPoint, b: MapPoint): THREE.Curve<THREE.Vector3> {
  const from = new THREE.Vector3(a.x, 0, a.z);
  const to = new THREE.Vector3(b.x, 0, b.z);
  const side = new THREE.Vector3(to.z - from.z, 0, -(to.x - from.x)).normalize();
  const swing = from.distanceTo(to) * 0.17;
  const p1 = from.clone().lerp(to, 0.3).addScaledVector(side, -swing);
  const p2 = from.clone().lerp(to, 0.7).addScaledVector(side, swing);
  const points = [from, p1, p2, to].map((p) => p.setY(GROUND_LIFT));
  return new THREE.CatmullRomCurve3(points, false, "catmullrom", 0.6);
}

/** Ground footprint of a curve, for keeping the hills clear of it. */
export function footprint(curve: THREE.Curve<THREE.Vector3>, samples = 30): MapPoint[] {
  return curve.getSpacedPoints(samples).map((p) => ({ x: p.x, z: p.z }));
}

// ─── Value noise for the hills (as in version 4) ─────────────────
function hash(x: number, y: number) {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
}
function noise(x: number, y: number) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);
  const a = hash(ix, iy);
  const b = hash(ix + 1, iy);
  const c = hash(ix, iy + 1);
  const d = hash(ix + 1, iy + 1);
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
}
function fbm(x: number, y: number) {
  return noise(x, y) * 0.55 + noise(x * 2.1, y * 2.1) * 0.3 + noise(x * 4.3, y * 4.3) * 0.15;
}

// ─── Terrain ─────────────────────────────────────────────────────
export function Terrain({
  centre,
  flatSpots,
  corridor,
  palette = NIGHT_PALETTE,
}: {
  centre: MapPoint;
  /** Cities: the ground is levelled under each. */
  flatSpots: MapPoint[];
  /** Ground footprints of the routes that cross the hills. */
  corridor: MapPoint[];
  palette?: MapPalette;
}) {
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(PATCH_SIZE, PATCH_SIZE, 112, 112);
    geo.rotateX(-Math.PI / 2);
    geo.translate(centre.x, 0, centre.z);
    const position = geo.attributes.position;
    const colors = new Float32Array(position.count * 3);
    const low = new THREE.Color(palette.terrainLow);
    const high = new THREE.Color(palette.terrainHigh);
    const scratch = new THREE.Color();
    const half = PATCH_SIZE / 2;

    for (let i = 0; i < position.count; i += 1) {
      const x = position.getX(i);
      const z = position.getZ(i);
      const relief = fbm(x * 0.17 + 11, z * 0.17 + 5);
      let height = relief * PATCH_AMPLITUDE;

      // Settle to the flat plain along a wobbly rim, so from the world view the
      // hills read as a landmass rather than a square tile
      const dx = x - centre.x;
      const dz = z - centre.z;
      const bearing = Math.atan2(dz, dx);
      const rim =
        half * (0.62 + 0.3 * noise(Math.cos(bearing) * 1.7 + 3.1, Math.sin(bearing) * 1.7 + 7.4));
      height *= THREE.MathUtils.smoothstep(rim - Math.hypot(dx, dz), 0, half * 0.35);

      // Level ground under every city, and keep the hills clear of the routes
      let nearestCity = Infinity;
      for (const spot of flatSpots) {
        nearestCity = Math.min(nearestCity, Math.hypot(x - spot.x, z - spot.z));
      }
      height *= THREE.MathUtils.smoothstep(nearestCity, 2.4, 5);
      let nearestRoute = Infinity;
      for (const point of corridor) {
        nearestRoute = Math.min(nearestRoute, Math.hypot(x - point.x, z - point.z));
      }
      height *= THREE.MathUtils.smoothstep(nearestRoute, 0.9, 2.8);

      position.setY(i, height);
      // Colour follows the underlying relief rather than the final height, so
      // the levelled ground under the routes stays mottled instead of a dark pit
      scratch.copy(low).lerp(high, THREE.MathUtils.clamp(relief * 0.85, 0, 1));
      colors.set([scratch.r, scratch.g, scratch.b], i * 3);
    }
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    return geo;
  }, [centre, flatSpots, corridor, palette]);

  return (
    <>
      <mesh geometry={geometry}>
        <meshStandardMaterial vertexColors flatShading roughness={0.95} metalness={0} />
      </mesh>
      {/* The plain the rest of the world sits on, well below the grid to keep the depth buffer honest */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[centre.x, -0.15, centre.z]}>
        <planeGeometry args={[8000, 8000]} />
        <meshStandardMaterial color={palette.terrainLow} roughness={1} metalness={0} />
      </mesh>
    </>
  );
}

/** Sky lighting and fog whose reach follows the camera distance. */
export function Atmosphere({ view, palette = NIGHT_PALETTE }: { view: ViewRef; palette?: MapPalette }) {
  const fogRef = useRef<THREE.Fog>(null);
  const run = () => {
    if (!fogRef.current) return;
    fogRef.current.near = view.current.distance * palette.fogNear;
    fogRef.current.far = view.current.distance * palette.fogFar;
  };
  return (
    <>
      <FrameDriver run={run} />
      <fog ref={fogRef} attach="fog" args={[palette.sky, 30, 90]} />
      <hemisphereLight args={[palette.hemisphereSky, palette.hemisphereGround, 1.45]} />
      <directionalLight position={[40, 70, 30]} intensity={1.9} color={palette.sun} />
    </>
  );
}

/** 10° graticule lined up with the real meridians and parallels. */
export function Graticule({
  view,
  origin,
  palette = NIGHT_PALETTE,
}: {
  view: ViewRef;
  origin: MapPoint;
  palette?: MapPalette;
}) {
  const gridRef = useRef<THREE.Mesh>(null);
  const run = () => {
    if (!gridRef.current) return;
    const material = gridRef.current.material as THREE.ShaderMaterial & {
      fadeDistance: number;
      cellThickness: number;
    };
    material.fadeDistance = view.current.distance * 3;
    // From far enough out the 10° cells crowd into a texture, so only the 30° sections stay
    material.cellThickness = 0.6 * fitVisibility(view.current.fit, 260);
  };
  // The mesh sits on the 10° crossing nearest the venue so its (camera-following)
  // plane is always in reach, and its lines fall on real meridians and parallels.
  const anchor: [number, number, number] = [
    ((origin.x % 10) + 10) % 10,
    0.05,
    ((origin.z % 10) + 10) % 10,
  ];
  return (
    <>
      <FrameDriver run={run} />
      <Grid
        ref={gridRef}
        infiniteGrid
        followCamera
        position={anchor}
        cellSize={10}
        sectionSize={30}
        cellColor={palette.gridCell}
        sectionColor={palette.gridSection}
        cellThickness={0.6}
        sectionThickness={1}
        fadeDistance={90}
        fadeStrength={1.4}
      />
    </>
  );
}

// ─── Clouds (drifting over India, gone once the world is in view) ─
const puffs: [number, number, number, number][] = [
  [0, 0, 0, 0.8],
  [0.75, 0.1, 0.15, 0.6],
  [-0.7, 0.05, -0.1, 0.55],
  [0.2, 0.32, -0.25, 0.5],
];

const cloudSpecs: { offset: [number, number, number]; scale: number; speed: number }[] = [
  { offset: [-9, 4.2, -6], scale: 0.55, speed: 0.3 },
  { offset: [5, 4.6, -10], scale: 0.45, speed: 0.22 },
  { offset: [-3, 4.8, 3], scale: 0.5, speed: 0.26 },
  { offset: [9, 4.3, 8], scale: 0.48, speed: 0.34 },
  { offset: [-13, 4.5, 12], scale: 0.42, speed: 0.28 },
];

export function Clouds({
  view,
  centre,
  hideBeyond = 110,
  palette = NIGHT_PALETTE,
}: {
  view: ViewRef;
  centre: MapPoint;
  hideBeyond?: number;
  palette?: MapPalette;
}) {
  const groupRefs = useRef<(THREE.Group | null)[]>([]);
  const materialRefs = useRef<(THREE.MeshStandardMaterial | null)[]>([]);

  const run = (_: RootState, delta: number) => {
    const { fit, reducedMotion } = view.current;
    const opacity = 0.65 * fitVisibility(fit, hideBeyond);
    materialRefs.current.forEach((material) => {
      if (material) material.opacity = opacity;
    });
    groupRefs.current.forEach((cloud, index) => {
      if (!cloud) return;
      cloud.visible = opacity > 0.01;
      if (reducedMotion) return;
      cloud.position.x += delta * cloudSpecs[index].speed;
      if (cloud.position.x > centre.x + 22) cloud.position.x = centre.x - 22;
    });
  };

  return (
    <>
      <FrameDriver run={run} />
      {cloudSpecs.map((cloud, index) => (
        <group
          key={cloud.offset.join()}
          ref={(el) => {
            groupRefs.current[index] = el;
          }}
          position={[centre.x + cloud.offset[0], cloud.offset[1], centre.z + cloud.offset[2]]}
          scale={cloud.scale}
        >
          {puffs.map(([x, y, z, r], puff) => (
            <mesh key={`${x}-${z}`} position={[x, y, z]}>
              <sphereGeometry args={[r, 7, 6]} />
              <meshStandardMaterial
                ref={(el) => {
                  materialRefs.current[index * puffs.length + puff] = el;
                }}
                color={palette.cloud}
                flatShading
                transparent
                opacity={0.65}
                depthWrite={false}
              />
            </mesh>
          ))}
        </group>
      ))}
    </>
  );
}

// ─── Route lines ─────────────────────────────────────────────────
/** What the owning scene wants a route to look like right now. */
export interface RouteState {
  /** 0–1 share of the route drawn in. */
  reveal: number;
  /** Opacity of the drawn route (dimmed once later legs take over). */
  opacity: number;
}

export function createRouteState(): RouteState {
  return { reveal: 0, opacity: 1 };
}

/**
 * One route on the map: a faint dashed ghost of the whole path, and the drawn
 * part — a wide soft underline and a dashed line — revealed segment by segment.
 */
export function RouteLines({
  curve,
  width = 3,
  ghost = 0.3,
  state,
  view,
  palette = NIGHT_PALETTE,
}: {
  curve: THREE.Curve<THREE.Vector3>;
  /** On-screen width of the drawn line, in CSS pixels. */
  width?: number;
  /** Opacity of the route before it is drawn. */
  ghost?: number;
  state: RouteState;
  view: ViewRef;
  palette?: MapPalette;
}) {
  const points = useMemo(() => curve.getSpacedPoints(SEGMENTS), [curve]);
  const ghostRef = useRef<LineSegments2>(null);
  const underRef = useRef<LineSegments2>(null);
  const drawnRef = useRef<LineSegments2>(null);

  const run = () => {
    const count = Math.round(state.reveal * SEGMENTS);
    const scale = view.current.pxPerUnitAtLook;
    if (ghostRef.current) ghostRef.current.material.dashScale = scale;
    if (underRef.current) {
      underRef.current.geometry.instanceCount = count;
      underRef.current.material.opacity = 0.12 * state.opacity;
    }
    if (drawnRef.current) {
      drawnRef.current.geometry.instanceCount = count;
      drawnRef.current.material.opacity = state.opacity;
      drawnRef.current.material.dashScale = scale;
    }
  };

  return (
    <group>
      <FrameDriver run={run} />
      {ghost > 0 && (
        <Line
          ref={ghostRef}
          points={points}
          color={palette.ink}
          lineWidth={1}
          dashed
          dashSize={3}
          gapSize={9}
          transparent
          opacity={ghost}
          depthWrite={false}
        />
      )}
      <Line
        ref={underRef}
        points={points}
        color={palette.accent}
        lineWidth={width * 4}
        transparent
        opacity={0.12}
        depthWrite={false}
      />
      <Line
        ref={drawnRef}
        points={points}
        color={palette.accent}
        lineWidth={width}
        dashed
        dashSize={10}
        gapSize={9}
        transparent
        opacity={1}
        depthWrite={false}
      />
    </group>
  );
}

// ─── Travellers ──────────────────────────────────────────────────
export interface TravellerState {
  /** 0–1 position along the route. */
  t: number;
  visible: boolean;
  /** Size multiplier (default 1): lets a traveller grow in from afar and shrink as it lands. */
  scale: number;
}

export function createTravellerState(): TravellerState {
  return { t: 0, visible: false, scale: 1 };
}

const vehicles = { plane: Plane, train: Train, car: Car };

/**
 * A version 4 vehicle, or a glowing dot, riding a route at a fixed size on
 * screen — optionally with a small name tag flying alongside.
 */
export function Traveller({
  curve,
  kind,
  state,
  view,
  palette = NIGHT_PALETTE,
  label,
}: {
  curve: THREE.Curve<THREE.Vector3>;
  kind: VehicleKind | "dot";
  state: TravellerState;
  view: ViewRef;
  palette?: MapPalette;
  /** Text carried above the traveller, e.g. where it set out from. */
  label?: string;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const scratch = useMemo(() => ({ point: new THREE.Vector3(), ahead: new THREE.Vector3() }), []);

  const run = ({ camera }: RootState) => {
    const group = groupRef.current;
    if (!group) return;
    group.visible = state.visible;
    if (!state.visible) return;
    const { unitsPerPx, time, reducedMotion } = view.current;
    const t = clamp01(state.t);
    curve.getPointAt(t, scratch.point);
    group.position.copy(scratch.point);
    const d = camera.position.distanceTo(group.position);
    if (kind === "dot") {
      group.scale.setScalar(unitsPerPx * d * state.scale);
      group.updateMatrixWorld();
      return;
    }
    // Every vehicle faces +Z, so looking along the route orients all of them
    curve.getTangentAt(Math.min(t, 0.999), scratch.ahead);
    scratch.ahead.add(group.position);
    group.lookAt(scratch.ahead);
    if (kind === "plane" && !reducedMotion) group.position.y += Math.sin(time * 2.5) * 0.0035 * d;
    group.scale.setScalar(VEHICLE_UNIT_PX * unitsPerPx * d * state.scale);
    // The tag projects through this before the renderer would refresh it
    group.updateMatrixWorld();
    if (labelRef.current) labelRef.current.style.opacity = String(clamp01(state.scale));
  };

  const Vehicle = kind === "dot" ? null : vehicles[kind];
  return (
    <group ref={groupRef} visible={false}>
      <FrameDriver run={run} />
      {label && (
        <Html position={[0, 1.1, 0]} style={{ pointerEvents: "none" }} zIndexRange={[10, 0]}>
          <div
            ref={labelRef}
            className="whitespace-nowrap rounded-full border border-(--jm-line) bg-(--jm-bg)/90 px-2.5 py-1 text-[0.6rem] font-semibold tracking-[0.22em] text-(--jm-ink) uppercase shadow-[0_6px_18px_-10px_rgba(0,0,0,0.5)]"
            style={{ transform: "translate(-50%, -100%)" }}
          >
            {label}
          </div>
        </Html>
      )}
      {Vehicle ? (
        <Vehicle body={palette.vehicleBody} accent={palette.vehicleAccent} dark={palette.vehicleDark} />
      ) : (
        <>
          <mesh>
            <sphereGeometry args={[DOT_HALO_PX, 12, 12]} />
            <meshBasicMaterial color={palette.travellerAccent} transparent opacity={0.35} depthWrite={false} />
          </mesh>
          <mesh>
            <sphereGeometry args={[DOT_PX, 12, 12]} />
            <meshStandardMaterial
              color={palette.travellerAccent}
              emissive={palette.travellerAccent}
              emissiveIntensity={1.4}
            />
          </mesh>
        </>
      )}
    </group>
  );
}

// ─── Pins and places ─────────────────────────────────────────────
/** The version 4 city marker — a lit pin, a pulsing ring — with the version 13 label beside it. */
export function PinMarker({
  point,
  stop,
  align,
  color = AMBER,
  hideBeyond,
  view,
  palette = NIGHT_PALETTE,
}: {
  point: MapPoint;
  stop: JourneyStop;
  align: "start" | "end";
  color?: string;
  /** Camera fit beyond which the pin fades out. */
  hideBeyond?: number;
  view: ViewRef;
  palette?: MapPalette;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const materialRefs = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  const dir = align === "start" ? 1 : -1;

  const run = ({ camera }: RootState) => {
    const group = groupRef.current;
    if (!group) return;
    const { fit, unitsPerPx, time, reducedMotion, labels } = view.current;
    const opacity = fitVisibility(fit, hideBeyond);
    group.visible = opacity > 0.01;
    group.scale.setScalar(PIN_UNIT_PX * unitsPerPx * camera.position.distanceTo(group.position));
    group.updateMatrixWorld();
    materialRefs.current.forEach((material) => {
      if (material) material.opacity = opacity;
    });
    if (lightRef.current) lightRef.current.intensity = palette.pinLight * opacity;
    if (ringRef.current) {
      const phase = reducedMotion ? 0.5 : (time % 2.4) / 2.4;
      const scale = 0.6 + phase * 2.2;
      ringRef.current.scale.set(scale, scale, scale);
      (ringRef.current.material as THREE.MeshBasicMaterial).opacity = (1 - phase) * 0.7 * opacity;
    }
    if (labelRef.current) labelRef.current.style.opacity = String(opacity * labels);
  };

  return (
    <group ref={groupRef} position={[point.x, 0, point.z]}>
      <FrameDriver run={run} />
      <mesh position={[0, 1, 0]}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial
          ref={(el) => {
            materialRefs.current[0] = el;
          }}
          color={color}
          emissive={color}
          emissiveIntensity={palette.pinEmissive}
          transparent
        />
      </mesh>
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.022, 0.022, 1, 6]} />
        <meshStandardMaterial
          ref={(el) => {
            materialRefs.current[1] = el;
          }}
          color={color}
          emissive={color}
          emissiveIntensity={palette.pinEmissive / 2}
          transparent
        />
      </mesh>
      <mesh ref={ringRef} position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.42, 0.5, 48]} />
        <meshBasicMaterial color={color} transparent opacity={0.6} depthWrite={false} />
      </mesh>
      <pointLight ref={lightRef} position={[0, 1.3, 0]} color={color} intensity={6} distance={7} decay={2} />
      <Html position={[dir * 0.45, 1, 0]} style={{ pointerEvents: "none" }} zIndexRange={[10, 0]}>
        <div
          ref={labelRef}
          className={`whitespace-nowrap drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)] ${
            align === "start" ? "text-left" : "text-right"
          }`}
          style={{ transform: align === "start" ? "translate(0, -50%)" : "translate(-100%, -50%)" }}
        >
          <p className="font-serif text-3xl leading-none text-(--jm-ink)">{stop.city}</p>
          <p className="mt-1.5 text-[0.7rem] font-medium tracking-[0.3em] text-(--jm-muted) uppercase">
            {stop.state}
          </p>
          <p className="mt-0.5 font-script text-2xl leading-tight" style={{ color }}>
            {stop.person}
          </p>
        </div>
      </Html>
    </group>
  );
}

/** A guest origin: a small lit dot with its name beside it. */
export function PlaceMarker({
  point,
  label,
  hideBeyond,
  view,
  palette = NIGHT_PALETTE,
}: {
  point: MapPoint;
  label: string;
  /** Camera fit beyond which the label fades out, so crowded regions stay legible when zoomed out. */
  hideBeyond?: number;
  view: ViewRef;
  palette?: MapPalette;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const labelRef = useRef<HTMLDivElement>(null);

  const run = ({ camera }: RootState) => {
    const group = groupRef.current;
    if (!group) return;
    const { fit, unitsPerPx, labels } = view.current;
    const opacity = PLACE_OPACITY * fitVisibility(fit, hideBeyond);
    group.visible = opacity > 0.01;
    group.scale.setScalar(PLACE_DOT_PX * unitsPerPx * camera.position.distanceTo(group.position));
    group.updateMatrixWorld();
    if (labelRef.current) labelRef.current.style.opacity = String(opacity * labels);
  };

  return (
    <group ref={groupRef} position={[point.x, GROUND_LIFT, point.z]}>
      <FrameDriver run={run} />
      <mesh>
        <sphereGeometry args={[1, 10, 10]} />
        <meshStandardMaterial color={palette.ink} emissive={palette.ink} emissiveIntensity={0.6} />
      </mesh>
      <Html position={[3, 0, 0]} style={{ pointerEvents: "none" }} zIndexRange={[10, 0]}>
        <div
          ref={labelRef}
          className="whitespace-nowrap text-[0.7rem] font-medium tracking-[0.3em] uppercase drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
          style={{ transform: "translate(0, -50%)", opacity: PLACE_OPACITY, color: "var(--jm-muted)" }}
        >
          {label}
        </div>
      </Html>
    </group>
  );
}
