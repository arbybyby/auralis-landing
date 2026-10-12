import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { AdditiveBlending, BackSide, Color } from "three";
import type { ShaderMaterial } from "three";

import { atmosphereShader } from "@/components/three/atmosphereShader";
import { ATMOSPHERE, BRAND_COLORS, PLANET } from "@/lib/constants";
import { introState } from "@/lib/introStore";
import { sceneCurrent } from "@/lib/sceneStore";

// The planet's silhouette as a fraction of the shell's radius: the glow peaks there, in cyan,
// and turns violet as it fades outwards.
const PLANET_EDGE = 1 / ATMOSPHERE.radiusScale;

function createUniforms() {
  return {
    uColorInner: { value: new Color(BRAND_COLORS.cyan) },
    uColorOuter: { value: new Color(BRAND_COLORS.violet) },
    uIntensity: { value: ATMOSPHERE.intensity },
    uPlanetEdge: { value: PLANET_EDGE },
  };
}

export function Atmosphere() {
  const materialRef = useRef<ShaderMaterial>(null);
  const uniforms = useMemo(() => createUniforms(), []);

  useFrame(() => {
    if (!materialRef.current) return;
    materialRef.current.uniforms.uIntensity.value =
      ATMOSPHERE.intensity * sceneCurrent.atmosphere * introState.atmosphere;
  });

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
        ref={materialRef}
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
