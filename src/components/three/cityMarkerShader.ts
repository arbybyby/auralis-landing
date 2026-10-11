import { planetOcclusion } from "@/components/three/planetOcclusion";

/**
 * City markers: a bright core with a ring that keeps expanding and fading, and a short flash when
 * an arc lands on the city. One sprite per city holds both core and ring.
 */
export const cityMarkerShader = {
  vertex: /* glsl */ `
    uniform float uTime;
    uniform float uPointScale;
    uniform float uSize;
    // Per-city arrival flash, 1 just after an arc lands and fading to 0.
    uniform float uFlash[CITY_COUNT];

    attribute float aIndex;
    attribute float aPhase;

    varying float vFlash;
    varying float vPulse;
    varying float vVisibility;

    const float FLASH_GROWTH = 0.8;

    ${planetOcclusion}

    void main() {
      vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
      gl_Position = projectionMatrix * viewPosition;

      vFlash = uFlash[int(aIndex)];
      float modelScale = length(modelMatrix[0].xyz);
      gl_PointSize = uSize * (1.0 + vFlash * FLASH_GROWTH) * modelScale * uPointScale / -viewPosition.z;

      vPulse = fract(uTime + aPhase);
      vVisibility = planetVisibility(position);
    }
  `,

  fragment: /* glsl */ `
    uniform vec3 uColor;

    varying float vFlash;
    varying float vPulse;
    varying float vVisibility;

    // Sizes as a share of the sprite's radius.
    const float CORE_RADIUS = 0.22;
    const float RING_WIDTH = 0.08;
    const float RING_OPACITY = 0.55;

    void main() {
      float distanceFromCentre = length(gl_PointCoord - 0.5) * 2.0;
      if (distanceFromCentre > 1.0) discard;

      float core = 1.0 - smoothstep(0.0, CORE_RADIUS, distanceFromCentre);
      float ringRadius = mix(CORE_RADIUS, 1.0, vPulse);
      float ring = (1.0 - smoothstep(0.0, RING_WIDTH, abs(distanceFromCentre - ringRadius))) * (1.0 - vPulse);

      vec3 color = mix(uColor, vec3(1.0), 0.35 + 0.5 * vFlash);
      float alpha = core * (0.85 + vFlash) + ring * RING_OPACITY * (1.0 + vFlash);

      gl_FragColor = vec4(color, alpha * vVisibility);
      #include <colorspace_fragment>
    }
  `,
};
