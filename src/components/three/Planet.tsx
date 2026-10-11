import { useFrame } from "@react-three/fiber";
import { use, useEffect, useMemo, useRef } from "react";
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
} from "three";
import type { Points, ShaderMaterial } from "three";

import { planetShader } from "@/components/three/planetShader";
import { BRAND_COLORS, PLANET } from "@/lib/constants";
import { loadLandMask } from "@/lib/landMask";
import type { LandMask } from "@/lib/landMask";
import { createPlanetPoints } from "@/lib/planetPoints";
import type { PlanetPointCounts } from "@/lib/planetPoints";

interface PlanetProps {
  /** Target particle counts; lower device tiers pass a smaller budget. */
  pointCounts: PlanetPointCounts;
  /** Spin around the tilted axis, in radians per second. 0 holds a still frame. */
  rotationSpeed: number;
}

function createGeometry(
  mask: LandMask,
  counts: PlanetPointCounts,
): BufferGeometry {
  const { positions, land } = createPlanetPoints(mask, counts, PLANET.radius);
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(positions, 3));
  geometry.setAttribute("aLand", new BufferAttribute(land, 1));
  return geometry;
}

function createUniforms() {
  return {
    uPointScale: { value: 1 },
    uLandSize: { value: PLANET.pointSize.land },
    uOceanSize: { value: PLANET.pointSize.ocean },
    uLandOpacity: { value: PLANET.opacity.land },
    uOceanOpacity: { value: PLANET.opacity.ocean },
    uColorEquator: { value: new Color(BRAND_COLORS.cyan) },
    uColorPole: { value: new Color(BRAND_COLORS.violet) },
  };
}

export function Planet({ pointCounts, rotationSpeed }: PlanetProps) {
  const landMask = use(loadLandMask());
  const spinRef = useRef<Points>(null);
  const materialRef = useRef<ShaderMaterial>(null);

  const geometry = useMemo(
    () => createGeometry(landMask, pointCounts),
    [landMask, pointCounts],
  );
  useEffect(() => () => geometry.dispose(), [geometry]);

  const uniforms = useMemo(() => createUniforms(), []);

  useFrame((state, delta) => {
    if (materialRef.current) {
      // Same scale PointsMaterial uses for size attenuation: half the drawing-buffer height.
      materialRef.current.uniforms.uPointScale.value =
        (state.size.height * state.viewport.dpr) / 2;
    }
    if (spinRef.current) spinRef.current.rotation.y += rotationSpeed * delta;
  });

  return (
    <group rotation-z={PLANET.axialTilt}>
      <points ref={spinRef} geometry={geometry}>
        <shaderMaterial
          ref={materialRef}
          vertexShader={planetShader.vertex}
          fragmentShader={planetShader.fragment}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </points>
    </group>
  );
}
