"use client";

import { useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Grid, Html, Line, OrbitControls, Stars } from "@react-three/drei";
import type { Line2 } from "three-stdlib";
import * as THREE from "three";
import type { JourneyStop } from "@/lib/content";
import { project } from "@/lib/geo";
import { Car, Plane, Train, type VehicleKind } from "@/components/v4/vehicles";

const WORLD = 22;
const TRIP_SECONDS = 11;
const SKY = "#0b1020";
const AMBER = "#f2b544";
const SKY_BLUE = "#7fb7ff";

function toWorld(stop: JourneyStop) {
  const point = project(stop);
  return new THREE.Vector3((point.x / 1000 - 0.5) * WORLD, 0, (point.y / 1000 - 0.5) * WORLD);
}

// ─── Value noise for the hills ───────────────────────────────────
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

function sideways(a: THREE.Vector3, b: THREE.Vector3) {
  return new THREE.Vector3(b.z - a.z, 0, -(b.x - a.x)).normalize();
}

function groundRoute(a: THREE.Vector3, b: THREE.Vector3) {
  const side = sideways(a, b);
  const p1 = a.clone().lerp(b, 0.3).addScaledVector(side, -2.2);
  const p2 = a.clone().lerp(b, 0.7).addScaledVector(side, 2.2);
  const points = [a.clone(), p1, p2, b.clone()].map((p) => p.setY(0.1));
  return new THREE.CatmullRomCurve3(points, false, "catmullrom", 0.6);
}

function airRoute(a: THREE.Vector3, b: THREE.Vector3) {
  const control = a.clone().lerp(b, 0.5).addScaledVector(sideways(a, b), 1.6);
  control.y = 6;
  return new THREE.QuadraticBezierCurve3(a.clone().setY(0.4), control, b.clone().setY(0.4));
}

// ─── Terrain ─────────────────────────────────────────────────────
function Terrain({ corridor }: { corridor: THREE.Vector3[] }) {
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(64, 64, 96, 96);
    geo.rotateX(-Math.PI / 2);
    const position = geo.attributes.position;
    const colors = new Float32Array(position.count * 3);
    const low = new THREE.Color("#152640");
    const high = new THREE.Color("#3a5f88");
    const scratch = new THREE.Color();

    for (let i = 0; i < position.count; i += 1) {
      const x = position.getX(i);
      const z = position.getZ(i);
      let height = fbm(x * 0.13 + 7, z * 0.13 + 3) * 2.6;

      let nearest = Infinity;
      for (const point of corridor) {
        nearest = Math.min(nearest, Math.hypot(x - point.x, z - point.z));
      }
      height *= THREE.MathUtils.smoothstep(nearest, 1.1, 4.2);
      position.setY(i, height);

      scratch.copy(low).lerp(high, THREE.MathUtils.clamp(height / 2.6, 0, 1));
      colors.set([scratch.r, scratch.g, scratch.b], i * 3);
    }
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    return geo;
  }, [corridor]);

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial vertexColors flatShading roughness={0.95} metalness={0} />
    </mesh>
  );
}

// ─── Route + traveller ───────────────────────────────────────────
function RouteLine({ curve }: { curve: THREE.Curve<THREE.Vector3> }) {
  const ref = useRef<Line2>(null);
  const points = useMemo(() => curve.getPoints(140), [curve]);

  useFrame((_, delta) => {
    if (ref.current) ref.current.material.dashOffset -= delta * 1.2;
  });

  return (
    <Line ref={ref} points={points} color={AMBER} lineWidth={2} dashed dashSize={0.35} gapSize={0.22} transparent opacity={0.9} />
  );
}

const vehicles = { plane: Plane, train: Train, car: Car };

function Traveller({ curve, kind }: { curve: THREE.Curve<THREE.Vector3>; kind: VehicleKind }) {
  const ref = useRef<THREE.Group>(null);
  const progress = useRef(0);
  const ahead = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, delta) => {
    const group = ref.current;
    if (!group) return;
    progress.current = (progress.current + delta / TRIP_SECONDS) % 1;
    const t = progress.current;
    const point = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t);
    group.position.copy(point);
    if (kind === "plane") group.position.y += Math.sin(state.clock.elapsedTime * 2.5) * 0.06;
    ahead.copy(point).add(tangent);
    group.lookAt(ahead);
  });

  const Vehicle = vehicles[kind];
  return (
    <group ref={ref}>
      <group scale={0.85}>
        <Vehicle />
      </group>
    </group>
  );
}

// ─── Cities ──────────────────────────────────────────────────────
function CityMarker({ position, stop, color }: { position: THREE.Vector3; stop: JourneyStop; color: string }) {
  const ring = useRef<THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>>(null);

  useFrame(({ clock }) => {
    if (!ring.current) return;
    const phase = (clock.elapsedTime % 2.4) / 2.4;
    const scale = 0.6 + phase * 2.2;
    ring.current.scale.set(scale, scale, scale);
    ring.current.material.opacity = (1 - phase) * 0.7;
  });

  return (
    <group position={position}>
      <mesh position={[0, 1, 0]}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.6} />
      </mesh>
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.022, 0.022, 1, 6]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} />
      </mesh>
      <mesh ref={ring} position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.42, 0.5, 48]} />
        <meshBasicMaterial color={color} transparent opacity={0.6} />
      </mesh>
      <pointLight position={[0, 1.3, 0]} color={color} intensity={6} distance={7} decay={2} />
      <Html position={[0, 1.55, 0]} center distanceFactor={13} style={{ pointerEvents: "none" }} zIndexRange={[10, 0]}>
        <div className="whitespace-nowrap text-center drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]">
          <p className="font-serif text-2xl leading-none text-[#ece6d6]">{stop.city}</p>
          <p className="mt-1 text-[10px] tracking-[0.3em] text-[#9aa0b4] uppercase">{stop.state}</p>
          <p className="font-script text-2xl leading-tight" style={{ color }}>
            {stop.person}
          </p>
        </div>
      </Html>
    </group>
  );
}

// ─── Clouds ──────────────────────────────────────────────────────
const puffs: [number, number, number, number][] = [
  [0, 0, 0, 0.8],
  [0.75, 0.1, 0.15, 0.6],
  [-0.7, 0.05, -0.1, 0.55],
  [0.2, 0.32, -0.25, 0.5],
];

function Cloud({ position, scale, speed }: { position: [number, number, number]; scale: number; speed: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.position.x += delta * speed;
    if (ref.current.position.x > 12) ref.current.position.x = -12;
  });
  return (
    <group ref={ref} position={position} scale={scale}>
      {puffs.map(([x, y, z, r]) => (
        <mesh key={`${x}-${z}`} position={[x, y, z]}>
          <sphereGeometry args={[r, 7, 6]} />
          <meshStandardMaterial color="#dfe6f3" flatShading transparent opacity={0.65} />
        </mesh>
      ))}
    </group>
  );
}

const clouds: { position: [number, number, number]; scale: number; speed: number }[] = [
  { position: [-10, 4.2, -7], scale: 0.5, speed: 0.3 },
  { position: [4, 4.6, -9], scale: 0.42, speed: 0.22 },
  { position: [-2, 4.8, 1], scale: 0.5, speed: 0.26 },
  { position: [8, 4.3, 7], scale: 0.45, speed: 0.34 },
];

// ─── Scene ───────────────────────────────────────────────────────
interface FlyoverSceneProps {
  from: JourneyStop;
  to: JourneyStop;
  kind: VehicleKind;
}

export default function FlyoverScene({ from, to, kind }: FlyoverSceneProps) {
  // Rendered client-only (dynamic import with ssr: false), so window is available at first render.
  const [reducedMotion] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  const origin = useMemo(() => toWorld(from), [from]);
  const destination = useMemo(() => toWorld(to), [to]);
  const ground = useMemo(() => groundRoute(origin, destination), [origin, destination]);
  const air = useMemo(() => airRoute(origin, destination), [origin, destination]);
  const corridor = useMemo(() => ground.getPoints(40), [ground]);
  const curve = kind === "plane" ? air : ground;
  const target = useMemo(
    () => origin.clone().lerp(destination, 0.5).setY(0.6).toArray() as [number, number, number],
    [origin, destination]
  );

  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [3, 11, 18], fov: 42, near: 0.1, far: 120 }}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      onCreated={({ gl }) => gl.setClearColor(SKY)}
    >
      <fog attach="fog" args={[SKY, 24, 52]} />
      <hemisphereLight args={["#4a6a9c", "#0b1020", 1.2]} />
      <directionalLight position={[8, 14, 6]} intensity={1.7} color="#fff1d6" />
      <Stars radius={80} depth={30} count={1600} factor={3} fade speed={0.4} />

      <Terrain corridor={corridor} />
      <Grid
        infiniteGrid
        position={[0, 0.03, 0]}
        cellSize={1}
        sectionSize={5}
        cellColor="#24375a"
        sectionColor="#3b5a88"
        cellThickness={0.6}
        sectionThickness={1}
        fadeDistance={36}
        fadeStrength={1.6}
      />

      <RouteLine curve={curve} />
      <Traveller curve={curve} kind={kind} />
      <CityMarker position={origin} stop={from} color={SKY_BLUE} />
      <CityMarker position={destination} stop={to} color={AMBER} />

      {clouds.map((cloud) => (
        <Cloud key={cloud.position.join()} {...cloud} />
      ))}

      <OrbitControls
        makeDefault
        target={target}
        enableZoom={false}
        enablePan={false}
        minPolarAngle={0.5}
        maxPolarAngle={1.2}
        autoRotate={!reducedMotion}
        autoRotateSpeed={0.45}
        rotateSpeed={0.5}
        enableDamping
        dampingFactor={0.06}
      />
    </Canvas>
  );
}
