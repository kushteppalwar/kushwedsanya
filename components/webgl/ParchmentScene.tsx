"use client";

import { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  EffectComposer,
  Bloom,
  Vignette,
  ChromaticAberration,
} from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import * as THREE from "three";

const PW = 3.4;
const PH = 5.2;
const SEG_X = 80;
const SEG_Y = 160;

// ─── Parchment vertex shader ─────────────────────────────────────
const parchmentVert = /* glsl */ `
  uniform float uProgress;
  uniform float uTime;
  uniform float uCurlRadius;

  varying vec2 vUv;
  varying vec3 vWorldPos;
  varying vec3 vLocalNormal;
  varying float vCurlAmount;
  varying float vDepthZ;
  varying float vDistFromCurl;

  #define PI 3.14159265359
  #define HALF_H ${(PH / 2).toFixed(2)}
  #define FULL_H ${PH.toFixed(2)}
  #define HALF_W ${(PW / 2).toFixed(2)}

  void main() {
    vUv = uv;
    vec3 pos = position;

    // normalizedY: 0 at bottom edge, 1 at top edge
    float normalizedY = (pos.y + HALF_H) / FULL_H;

    // curlEdge: where the leading edge of the roll currently sits (1 = fully rolled, 0 = fully open)
    float curlEdge = 1.0 - uProgress;

    // How far above the curl edge this vertex is
    float aboveCurl = normalizedY - curlEdge;

    // Curl zone proportional to remaining roll
    float curlZone = 0.08 + (1.0 - uProgress) * 0.06;
    vDistFromCurl = aboveCurl;

    float radius = uCurlRadius * (0.6 + (1.0 - uProgress) * 0.6);

    // curlWorldY: world-space Y position of the curl edge
    float curlWorldY = curlEdge * FULL_H - HALF_H;

    if (aboveCurl >= curlZone) {
      // ── Flat revealed paper ──
      float wave = sin(normalizedY * 14.0 + uTime * 0.4) * 0.002 * (1.0 - normalizedY * 0.5);
      pos.z = wave;
      vCurlAmount = 0.0;
      vDepthZ = 0.0;

    } else if (aboveCurl >= 0.0) {
      // ── Transition lip — the visible curl edge ──
      float t = aboveCurl / curlZone;
      float smooth_t = t * t * (3.0 - 2.0 * t);

      float angle = (1.0 - smooth_t) * PI * 0.65;
      float r = radius * (1.0 - smooth_t * 0.5);
      float flatY = pos.y;

      float lipY = curlWorldY + sin(angle) * r;
      float lipZ = -cos(angle) * r * 0.8 - radius * 0.1;

      pos.y = mix(lipY, flatY, smooth_t);
      pos.z = lipZ * (1.0 - smooth_t);

      vCurlAmount = 1.0 - smooth_t;
      vDepthZ = max(-pos.z, 0.0);

    } else {
      // ── Rolled-up part — wraps into a cylinder at the curl edge ──
      float rollDist = -aboveCurl;
      // Clamp how far vertices wrap so the roll stays as a compact cylinder
      float clampedDist = min(rollDist, curlZone * 3.0);
      float angle = (clampedDist / curlZone) * PI * 1.8;
      float r = radius * max(0.4, 1.0 - clampedDist * 0.8);

      pos.y = curlWorldY - sin(angle) * r * 0.4;
      pos.z = -cos(angle) * r * 0.5 - radius * 0.3;

      vCurlAmount = 1.0;
      vDepthZ = max(-pos.z, 0.0);
    }

    // Horizontal cylindrical curve across the width
    float xNorm = pos.x / HALF_W;
    pos.z -= xNorm * xNorm * 0.025;

    // Subtle breathing for the whole sheet
    pos.z += sin(uTime * 0.3) * 0.003;

    vWorldPos = pos;

    // Approximate normals via partial derivatives
    vLocalNormal = normalize(vec3(-xNorm * 0.05, 0.0, 1.0));

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

// ─── Parchment fragment shader ───────────────────────────────────
const parchmentFrag = /* glsl */ `
  uniform float uProgress;
  uniform float uTime;
  uniform vec3 uColorWarm;
  uniform vec3 uColorMid;
  uniform vec3 uColorCool;
  uniform vec3 uColorEdge;
  uniform vec3 uHighlight;
  uniform vec3 uShadow;
  uniform vec3 uLightDir;

  varying vec2 vUv;
  varying vec3 vWorldPos;
  varying vec3 vLocalNormal;
  varying float vCurlAmount;
  varying float vDepthZ;
  varying float vDistFromCurl;

  // ── Noise functions ──
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1, 0)), f.x),
      mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x),
      f.y
    );
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
    for (int i = 0; i < 5; i++) {
      v += a * noise(p);
      p = rot * p * 2.0;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    // ── Base parchment color with organic variation ──
    float n_large = fbm(vUv * 4.0 + vec2(2.3, 1.7));
    float n_med   = fbm(vUv * 10.0 + vec2(5.1, 3.2));
    float n_fine  = fbm(vUv * 20.0 + vec2(8.4, 6.9));
    float n_micro = noise(vUv * 300.0);

    vec3 col = mix(uColorWarm, uColorMid, n_large * 0.6 + 0.2);
    col = mix(col, uColorCool, n_med * 0.25);

    // ── Age stains — irregular darker patches ──
    float stain1 = smoothstep(0.42, 0.62, fbm(vUv * 3.5 + vec2(1.3, 2.7)));
    float stain2 = smoothstep(0.48, 0.68, fbm(vUv * 5.5 + vec2(7.1, 0.3)));
    float stain3 = smoothstep(0.50, 0.70, fbm(vUv * 2.0 + vec2(4.0, 8.0)));
    col = mix(col, uColorEdge * 0.90, stain1 * 0.18);
    col = mix(col, uColorMid * 1.08, stain2 * 0.12);
    col = mix(col, uColorWarm * 0.92, stain3 * 0.10);

    // ── Foxing — tiny brown spots ──
    float foxing = smoothstep(0.75, 0.78, noise(vUv * 80.0 + vec2(3.0, 5.0)));
    col = mix(col, uColorEdge * 0.7, foxing * 0.3);

    // ── Edge darkening / burn ──
    float edgeX = smoothstep(0.0, 0.06, vUv.x) * smoothstep(1.0, 0.94, vUv.x);
    float edgeY = smoothstep(0.0, 0.03, vUv.y) * smoothstep(1.0, 0.97, vUv.y);
    float edgeMask = edgeX * edgeY;
    col *= mix(0.55, 1.0, edgeMask);

    // ── Fiber texture ──
    float fiberH = noise(vec2(vUv.x * 400.0, vUv.y * 20.0));
    float fiberV = noise(vec2(vUv.x * 25.0, vUv.y * 350.0));
    col += (fiberH * 0.3 + fiberV * 0.7) * 0.025 - 0.015;

    // ── Micro grain ──
    col += (n_micro - 0.5) * 0.04;

    // ── Fold/crease lines ──
    float crease1 = 1.0 - smoothstep(0.0, 0.003, abs(vUv.x - 0.25));
    float crease2 = 1.0 - smoothstep(0.0, 0.003, abs(vUv.x - 0.75));
    col -= (crease1 + crease2) * 0.04 * n_large;

    // ── Curl lip highlight ──
    float lipHighlight = vCurlAmount * smoothstep(0.0, 0.4, vCurlAmount) * 0.5;
    col = mix(col, uHighlight, lipHighlight);

    // ── Curl shadow — depth-based darkening ──
    float shadowIntensity = clamp(vDepthZ * 2.5, 0.0, 0.7);
    col = mix(col, uShadow * 0.3, shadowIntensity);

    // ── Contact shadow near the curl edge ──
    float curlEdge = 1.0 - uProgress;
    float normalizedY = vUv.y;
    float contactShadow = 1.0 - smoothstep(-0.01, 0.06, vDistFromCurl);
    contactShadow *= smoothstep(-0.15, 0.0, vDistFromCurl);
    col *= mix(1.0, 0.7, contactShadow * (1.0 - vCurlAmount * 0.5));

    // ── Directional light ──
    float NdotL = max(dot(vLocalNormal, uLightDir), 0.0);
    float diffuse = mix(0.55, 1.0, NdotL);
    col *= diffuse;

    // ── Warm center glow ──
    float centerGlow = 1.0 - length(vUv - vec2(0.5, 0.5)) * 1.4;
    col += clamp(centerGlow, 0.0, 1.0) * 0.03;

    // ── Alpha ──
    // The entire parchment should always be visible (either as flat paper or as
    // the rolled-up portion). Nothing is hidden — instead the vertex shader
    // physically curls the unrevealed part behind the roll.
    float alpha = 1.0;

    gl_FragColor = vec4(col, alpha);
  }
`;

// ─── Parchment mesh component ────────────────────────────────────
function ParchmentMesh({ progress }: { progress: number }) {
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const geo = useMemo(
    () => new THREE.PlaneGeometry(PW, PH, SEG_X, SEG_Y),
    []
  );

  const uniforms = useMemo(
    () => ({
      uProgress:  { value: 0 },
      uTime:      { value: 0 },
      uCurlRadius:{ value: 0.22 },
      uColorWarm: { value: new THREE.Color("#f5e6c8") },
      uColorMid:  { value: new THREE.Color("#ead8b0") },
      uColorCool: { value: new THREE.Color("#d6c494") },
      uColorEdge: { value: new THREE.Color("#a08860") },
      uHighlight: { value: new THREE.Color("#fff8e7") },
      uShadow:    { value: new THREE.Color("#6b5a3a") },
      uLightDir:  { value: new THREE.Vector3(0.25, 0.45, 1.0).normalize() },
    }),
    []
  );

  useFrame((state) => {
    if (!matRef.current) return;
    matRef.current.uniforms.uTime.value = state.clock.elapsedTime;
  });

  useEffect(() => {
    if (matRef.current) matRef.current.uniforms.uProgress.value = progress;
  }, [progress]);

  return (
    <mesh geometry={geo}>
      <shaderMaterial
        ref={matRef}
        vertexShader={parchmentVert}
        fragmentShader={parchmentFrag}
        uniforms={uniforms}
        transparent
        side={THREE.DoubleSide}
        depthWrite
      />
    </mesh>
  );
}

// ─── Contact shadow beneath the curl ─────────────────────────────
function CurlShadow({ progress }: { progress: number }) {
  const ref = useRef<THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>>(null);

  useFrame(() => {
    if (!ref.current) return;
    const curlY = (1 - progress) * PH - PH / 2;
    ref.current.position.y = curlY;
    ref.current.material.opacity = 0.35 * Math.min(1, progress * 3) * (1 - progress * 0.3);
    ref.current.material.needsUpdate = true;
  });

  return (
    <mesh ref={ref} position={[0, 0, -0.15]} rotation={[-0.05, 0, 0]}>
      <planeGeometry args={[PW * 0.95, 0.35, 1, 1]} />
      <meshBasicMaterial color="#1a1008" transparent opacity={0.3} depthWrite={false} />
    </mesh>
  );
}

// ─── Rod component ───────────────────────────────────────────────
function Rod({
  position,
  isTop = false,
}: {
  position: [number, number, number];
  isTop?: boolean;
}) {
  const woodCol = isTop ? "#8B6914" : "#7A5C12";
  const capCol = "#c9a227";
  const halfW = PW / 2;

  return (
    <group position={position}>
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
        <cylinderGeometry args={[0.055, 0.06, PW + 0.5, 20]} />
        <meshStandardMaterial color={woodCol} roughness={0.65} metalness={0.08} />
      </mesh>

      {[-1, 1].map((s) => (
        <mesh key={`cap-${s}`} position={[s * (halfW + 0.3), 0, 0]} castShadow>
          <sphereGeometry args={[0.085, 14, 14]} />
          <meshStandardMaterial color={capCol} roughness={0.25} metalness={0.55} />
        </mesh>
      ))}

      {[-1, 1].map((s) => (
        <mesh
          key={`ring-${s}`}
          position={[s * (halfW - 0.12), 0, 0]}
          rotation={[0, 0, Math.PI / 2]}
        >
          <torusGeometry args={[0.065, 0.012, 8, 20]} />
          <meshStandardMaterial color={capCol} roughness={0.3} metalness={0.5} />
        </mesh>
      ))}
    </group>
  );
}

// ─── Dust particles ──────────────────────────────────────────────
function DustParticles({ count = 100, progress }: { count?: number; progress: number }) {
  const ref = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3]     = (Math.random() - 0.5) * 6;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 7;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 2.5 - 0.3;
    }
    return arr;
  }, [count]);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    const attr = ref.current.geometry.getAttribute("position") as THREE.BufferAttribute;
    const a = attr.array as Float32Array;

    for (let i = 0; i < count; i++) {
      const seed = i * 1.37;
      a[i * 3]     += Math.sin(t * 0.2 + seed) * 0.0004;
      a[i * 3 + 1] += 0.0006 + Math.sin(t * 0.15 + seed) * 0.0003;
      a[i * 3 + 2] += Math.cos(t * 0.1 + seed) * 0.0002;
      if (a[i * 3 + 1] > 4) a[i * 3 + 1] = -4;
    }
    attr.needsUpdate = true;

    (ref.current.material as THREE.PointsMaterial).opacity =
      Math.min(progress * 2.5, 0.35);
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} count={count} />
      </bufferGeometry>
      <pointsMaterial
        size={0.012}
        color="#c9a227"
        transparent
        opacity={0}
        depthWrite={false}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// ─── Scene lighting ──────────────────────────────────────────────
function Lighting({ progress }: { progress: number }) {
  const warmRef = useRef<THREE.PointLight>(null);
  const rimRef = useRef<THREE.PointLight>(null);

  useFrame(() => {
    if (warmRef.current) warmRef.current.intensity = 0.25 + progress * 0.55;
    if (rimRef.current) rimRef.current.intensity = 0.1 + progress * 0.2;
  });

  return (
    <>
      <ambientLight intensity={0.25} color="#f0e0c0" />
      <directionalLight position={[2, 3, 5]} intensity={0.7} color="#fff5e0" castShadow />
      <pointLight ref={warmRef} position={[0, 0, 2.5]} intensity={0.25} color="#c9a227" distance={10} />
      <pointLight ref={rimRef} position={[-2, -2, 3]} intensity={0.1} color="#a08050" distance={8} />
      <pointLight position={[1.5, 2, 1]} intensity={0.08} color="#ffe0a0" distance={6} />
    </>
  );
}

// ─── Camera ──────────────────────────────────────────────────────
function Camera() {
  const { camera } = useThree();
  useEffect(() => {
    camera.position.set(0, 0.2, 5.5);
    camera.lookAt(0, -0.3, 0);
  }, [camera]);
  return null;
}

// ─── Post-processing ─────────────────────────────────────────────
function PostFX() {
  return (
    <EffectComposer>
      <Bloom
        intensity={0.15}
        luminanceThreshold={0.7}
        luminanceSmoothing={0.9}
        blendFunction={BlendFunction.ADD}
      />
      <Vignette
        offset={0.3}
        darkness={0.65}
        blendFunction={BlendFunction.NORMAL}
      />
      <ChromaticAberration
        offset={new THREE.Vector2(0.0004, 0.0004)}
        blendFunction={BlendFunction.NORMAL}
      />
    </EffectComposer>
  );
}

// ─── Main exported scene ─────────────────────────────────────────
interface ParchmentSceneProps {
  progress: number;
  className?: string;
}

export default function ParchmentScene({ progress, className = "" }: ParchmentSceneProps) {
  const topRodY = PH / 2 + 0.08;
  // Bottom rod: at progress=0, sits near the top rod (rolled up).
  // At progress=1, sits at the bottom of the fully unrolled sheet.
  const curlEdgeNorm = 1.0 - progress; // 1 at start, 0 at end
  const bottomRodY = curlEdgeNorm * PH - PH / 2 - 0.12;

  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const dprRange: [number, number] = isMobile ? [1, 1.5] : [1, 2];
  const particleCount = isMobile ? 50 : 100;

  return (
    <div className={`pointer-events-none ${className}`}>
      <Canvas
        gl={{ antialias: !isMobile, alpha: true, powerPreference: "high-performance" }}
        dpr={dprRange}
        camera={{ fov: 32, near: 0.1, far: 100 }}
      >
        <Camera />
        <Lighting progress={progress} />
        <ParchmentMesh progress={progress} />
        <CurlShadow progress={progress} />
        <Rod position={[0, topRodY, 0.06]} isTop />
        <Rod position={[0, bottomRodY, 0.06]} />
        <DustParticles count={particleCount} progress={progress} />
        {!isMobile && <PostFX />}
      </Canvas>
    </div>
  );
}
