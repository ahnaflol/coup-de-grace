"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Mesh } from "three";

export function GlobeSphere() {
  const ref = useRef<Mesh>(null);

  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.05;
    }
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[2, 48, 48]} />
      <meshBasicMaterial
        wireframe
        color="#d4d4d8"
        opacity={0.15}
        transparent
      />
    </mesh>
  );
}
