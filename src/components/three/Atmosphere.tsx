import { useMemo } from "react";
import { AdditiveBlending, BackSide, Color } from "three";

import { atmosphereShader } from "@/components/three/atmosphereShader";
import { ATMOSPHERE, BRAND_COLORS, PLANET } from "@/lib/constants";

// How far from the shell's centre (as 1 - facing) the planet's own silhouette falls.
// The colour starts turning violet there, so the cyan hugs the planet.
const PLANET_EDGE = 1 - Math.sqrt(1 - 1 / ATMOSPHERE.radiusScale ** 2);

function createUniforms() {
  return {
    uColorInner: { value: new Color(BRAND_COLORS.cyan) },
    uColorOuter: { value: new Color(BRAND_COLORS.violet) },
    uIntensity: { value: ATMOSPHERE.intensity },
    uPlanetEdge: { value: PLANET_EDGE },
  };
}

export function Atmosphere() {
  const uniforms = useMemo(() => createUniforms(), []);

  return (
    <mesh>
      <sphereGeometry
        args={[
          PLANET.radius * ATMOSPHERE.radiusScale,
          ATMOSPHERE.segments,
          ATMOSPHERE.segments,
        ]}
      />
      <shaderMaterial
        vertexShader={atmosphereShader.vertex}
        fragmentShader={atmosphereShader.fragment}
        uniforms={uniforms}
        side={BackSide}
        transparent
        depthWrite={false}
        blending={AdditiveBlending}
      />
    </mesh>
  );
}
