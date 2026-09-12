"use client";

import { forwardRef } from "react";
import type { Group } from "three";

export type VehicleKind = "plane" | "train" | "car";

const body = "#f2e8d5";
const accent = "#f2b544";
const dark = "#1c2436";

/** Every vehicle faces +Z so a single lookAt along the route tangent orients all of them. */
export const Plane = forwardRef<Group>(function Plane(_, ref) {
  return (
    <group ref={ref}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <capsuleGeometry args={[0.16, 0.9, 4, 10]} />
        <meshStandardMaterial color={body} flatShading />
      </mesh>
      <mesh position={[0, 0, 0.72]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.16, 0.3, 10]} />
        <meshStandardMaterial color={accent} flatShading />
      </mesh>
      <mesh position={[0, 0, 0.05]}>
        <boxGeometry args={[1.7, 0.05, 0.36]} />
        <meshStandardMaterial color={accent} flatShading />
      </mesh>
      <mesh position={[0, 0.02, -0.52]}>
        <boxGeometry args={[0.7, 0.04, 0.22]} />
        <meshStandardMaterial color={body} flatShading />
      </mesh>
      <mesh position={[0, 0.22, -0.55]}>
        <boxGeometry args={[0.05, 0.36, 0.26]} />
        <meshStandardMaterial color={accent} flatShading />
      </mesh>
    </group>
  );
});

function Wheel({ position }: { position: [number, number, number] }) {
  return (
    <mesh position={position} rotation={[0, 0, Math.PI / 2]}>
      <cylinderGeometry args={[0.1, 0.1, 0.08, 10]} />
      <meshStandardMaterial color={dark} flatShading />
    </mesh>
  );
}

export const Train = forwardRef<Group>(function Train(_, ref) {
  const cars: [number, string][] = [
    [0.55, accent],
    [-0.35, body],
    [-1.2, body],
  ];
  return (
    <group ref={ref}>
      {cars.map(([z, color], index) => (
        <group key={z} position={[0, 0.16, z]}>
          <mesh>
            <boxGeometry args={[0.36, 0.3, 0.76]} />
            <meshStandardMaterial color={color} flatShading />
          </mesh>
          {index === 0 && (
            <>
              <mesh position={[0, 0.22, 0.2]}>
                <cylinderGeometry args={[0.06, 0.08, 0.16, 8]} />
                <meshStandardMaterial color={dark} flatShading />
              </mesh>
              <mesh position={[0, 0.2, -0.22]}>
                <boxGeometry args={[0.32, 0.12, 0.26]} />
                <meshStandardMaterial color={dark} flatShading />
              </mesh>
            </>
          )}
          <Wheel position={[0.2, -0.16, 0.24]} />
          <Wheel position={[-0.2, -0.16, 0.24]} />
          <Wheel position={[0.2, -0.16, -0.24]} />
          <Wheel position={[-0.2, -0.16, -0.24]} />
        </group>
      ))}
    </group>
  );
});

export const Car = forwardRef<Group>(function Car(_, ref) {
  return (
    <group ref={ref}>
      <mesh position={[0, 0.16, 0]}>
        <boxGeometry args={[0.44, 0.2, 0.9]} />
        <meshStandardMaterial color={accent} flatShading />
      </mesh>
      <mesh position={[0, 0.34, -0.05]}>
        <boxGeometry args={[0.38, 0.18, 0.46]} />
        <meshStandardMaterial color={body} flatShading />
      </mesh>
      <mesh position={[0, 0.2, 0.46]}>
        <boxGeometry args={[0.3, 0.06, 0.02]} />
        <meshStandardMaterial color="#fff3c4" emissive="#fff3c4" emissiveIntensity={1.2} />
      </mesh>
      <Wheel position={[0.24, 0.08, 0.3]} />
      <Wheel position={[-0.24, 0.08, 0.3]} />
      <Wheel position={[0.24, 0.08, -0.3]} />
      <Wheel position={[-0.24, 0.08, -0.3]} />
    </group>
  );
});
