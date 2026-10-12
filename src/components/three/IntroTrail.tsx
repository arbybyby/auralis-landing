import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  Vector3,
} from "three";
import type { Points, ShaderMaterial } from "three";

import { launchProgress } from "@/components/three/introMotion";
import type { IntroPath } from "@/components/three/introMotion";
import { trailShader } from "@/components/three/trailShader";
import { BRAND_COLORS } from "@/lib/constants";
import { INTRO } from "@/lib/intro";
import { introState } from "@/lib/introStore";

interface IntroTrailProps {
  path: IntroPath;
}

/**
 * Points spaced evenly along the path's length, each tagged with the curve parameter the leader
 * uses, so the shader can tell how far behind the leader it is.
 */
function createGeometry(path: IntroPath): BufferGeometry {
  const { samples } = INTRO.trail;
  const positions = new Float32Array(samples * 3);
  const progress = new Float32Array(samples);
  const point = new Vector3();
  const length = path.curve.getLength();

  for (let index = 0; index < samples; index++) {
    const share = index / (samples - 1);
    const t = path.curve.getUtoTmapping(share, share * length);
    path.curve.getPoint(t, point);
    positions.set([point.x, point.y, point.z], index * 3);
    progress[index] = t;
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(positions, 3));
  geometry.setAttribute("aProgress", new BufferAttribute(progress, 1));
  return geometry;
}

function createUniforms() {
  return {
    uHead: { value: 0 },
    uSpan: { value: INTRO.trail.span },
    uPointScale: { value: 1 },
    uSize: { value: INTRO.trail.size },
    uOpacity: { value: 0 },
    uColorHot: { value: new Color(INTRO.swarm.hotColor) },
    uColorCyan: { value: new Color(BRAND_COLORS.cyan) },
    uColorViolet: { value: new Color(BRAND_COLORS.violet) },
  };
}

/** The glowing trail the leader leaves behind as it races along its path. */
export function IntroTrail({ path }: IntroTrailProps) {
  const pointsRef = useRef<Points>(null);
  const materialRef = useRef<ShaderMaterial>(null);

  const geometry = useMemo(() => createGeometry(path), [path]);
  useEffect(() => () => geometry.dispose(), [geometry]);

  const uniforms = useMemo(() => createUniforms(), []);

  useFrame((state) => {
    const points = pointsRef.current;
    const material = materialRef.current;
    if (!points || !material) return;
    points.visible = introState.warmUp || introState.trail > 0;
    if (!points.visible) return;
    // Same scale PointsMaterial uses for size attenuation: half the drawing-buffer height.
    material.uniforms.uPointScale.value =
      (state.size.height * state.viewport.dpr) / 2;
    material.uniforms.uHead.value = launchProgress(introState.time);
    material.uniforms.uOpacity.value = introState.trail;
  });

  return (
    <points
      ref={pointsRef}
      geometry={geometry}
      visible={false}
      frustumCulled={false}
    >
      <shaderMaterial
        ref={materialRef}
        vertexShader={trailShader.vertex}
        fragmentShader={trailShader.fragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={AdditiveBlending}
      />
    </points>
  );
}
