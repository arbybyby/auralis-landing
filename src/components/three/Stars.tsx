import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
} from "three";
import type { ShaderMaterial } from "three";

import { starsShader } from "@/components/three/starsShader";
import { BRAND_COLORS, STARS } from "@/lib/constants";
import { introState } from "@/lib/introStore";
import { createStarField } from "@/lib/starField";

interface StarsProps {
  count: number;
  /** Twinkle speed in radians per second. 0 holds every star at a fixed brightness. */
  twinkleSpeed: number;
}

function createGeometry(count: number): BufferGeometry {
  const { positions, seeds } = createStarField({
    count,
    radius: STARS.radius,
    spread: STARS.spread,
    seed: STARS.seed,
  });
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(positions, 3));
  geometry.setAttribute("aSeed", new BufferAttribute(seeds, 1));
  return geometry;
}

function createUniforms() {
  return {
    uPixelRatio: { value: 1 },
    uMinSize: { value: STARS.size.min },
    uMaxSize: { value: STARS.size.max },
    uTime: { value: 0 },
    uOpacity: { value: STARS.opacity },
    uTintedShare: { value: STARS.tintedShare },
    uColorCyan: { value: new Color(BRAND_COLORS.cyan) },
    uColorViolet: { value: new Color(BRAND_COLORS.violet) },
  };
}

export function Stars({ count, twinkleSpeed }: StarsProps) {
  const materialRef = useRef<ShaderMaterial>(null);

  const geometry = useMemo(() => createGeometry(count), [count]);
  useEffect(() => () => geometry.dispose(), [geometry]);

  const uniforms = useMemo(() => createUniforms(), []);

  useFrame((state, delta) => {
    const material = materialRef.current;
    if (!material) return;
    material.uniforms.uPixelRatio.value = state.viewport.dpr;
    material.uniforms.uOpacity.value = STARS.opacity * introState.stars;
    // Time advances at the twinkle speed, so a speed of 0 freezes the sky.
    material.uniforms.uTime.value += twinkleSpeed * delta;
  });

  return (
    <points geometry={geometry}>
      <shaderMaterial
        ref={materialRef}
        vertexShader={starsShader.vertex}
        fragmentShader={starsShader.fragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={AdditiveBlending}
      />
    </points>
  );
}
