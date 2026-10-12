import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { AdditiveBlending, Color, MathUtils } from "three";
import type { Mesh, ShaderMaterial } from "three";

import { shockwaveShader } from "@/components/three/shockwaveShader";
import { PLANET } from "@/lib/constants";
import { INTRO } from "@/lib/intro";
import { introState } from "@/lib/introStore";

const { from, to, color } = INTRO.shockwave;
// The sprite just holds the ring at its widest; the shader draws it at any smaller radius.
const SIZE = 2 * to * PLANET.radius;
const START_RADIUS = from / to;

function createUniforms() {
  return {
    uRadius: { value: START_RADIUS },
    uOpacity: { value: 0 },
    uColor: { value: new Color(color) },
  };
}

/** The ring that rushes out from the planet the moment it is complete. */
export function IntroShockwave() {
  const meshRef = useRef<Mesh>(null);
  const materialRef = useRef<ShaderMaterial>(null);
  const uniforms = useMemo(() => createUniforms(), []);

  useFrame(() => {
    const mesh = meshRef.current;
    const material = materialRef.current;
    if (!mesh || !material) return;
    const progress = introState.shockwave;
    const isRunning = progress > 0 && progress < 1;
    mesh.visible = introState.warmUp || isRunning;
    if (!mesh.visible) return;
    material.uniforms.uRadius.value = MathUtils.lerp(START_RADIUS, 1, progress);
    material.uniforms.uOpacity.value = isRunning ? 1 - progress : 0;
  });

  return (
    <mesh ref={meshRef} visible={false}>
      <planeGeometry args={[SIZE, SIZE]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={shockwaveShader.vertex}
        fragmentShader={shockwaveShader.fragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={AdditiveBlending}
      />
    </mesh>
  );
}
