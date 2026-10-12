import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { AdditiveBlending, Color } from "three";
import type { Mesh, ShaderMaterial } from "three";

import { leaderPosition } from "@/components/three/introMotion";
import type { IntroPath } from "@/components/three/introMotion";
import { sparkShader } from "@/components/three/sparkShader";
import { PLANET } from "@/lib/constants";
import { INTRO } from "@/lib/intro";
import { introState } from "@/lib/introStore";

interface IntroSparkProps {
  path: IntroPath;
}

const SIZE = INTRO.spark.size * PLANET.radius;

function createUniforms() {
  return {
    uCore: { value: 0 },
    uHalo: { value: 0 },
    uTime: { value: 0 },
    uHaloColor: { value: new Color(INTRO.spark.haloColor) },
  };
}

/** The intro's leader: it ignites, races along its path and dissolves into the swarm it gathers. */
export function IntroSpark({ path }: IntroSparkProps) {
  const meshRef = useRef<Mesh>(null);
  const materialRef = useRef<ShaderMaterial>(null);
  const uniforms = useMemo(() => createUniforms(), []);

  useFrame(() => {
    const mesh = meshRef.current;
    const material = materialRef.current;
    if (!mesh || !material) return;
    const { spark, halo, time } = introState;
    mesh.visible = introState.warmUp || spark > 0 || halo > 0;
    if (!mesh.visible) return;
    leaderPosition(path, time, mesh.position);
    material.uniforms.uCore.value = spark;
    material.uniforms.uHalo.value = halo;
    material.uniforms.uTime.value = time;
  });

  return (
    // The sprite lies in the globe's XY plane, which faces the camera throughout the intro.
    <mesh ref={meshRef} visible={false}>
      <planeGeometry args={[SIZE, SIZE]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={sparkShader.vertex}
        fragmentShader={sparkShader.fragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={AdditiveBlending}
      />
    </mesh>
  );
}
