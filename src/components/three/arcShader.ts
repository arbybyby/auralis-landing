import { planetOcclusion } from "@/components/three/planetOcclusion";

/**
 * One data arc between two cities. The path is a great circle lifted off the surface, computed
 * here from the two endpoints, so picking a new pair only changes uniforms. A bright pulse runs
 * from source to destination and the line is drawn only behind it.
 */
export const arcShader = {
  vertex: /* glsl */ `
    uniform vec3 uStart;
    uniform vec3 uEnd;
    // Angle between the two endpoints, in radians.
    uniform float uAngle;
    // Peak height above the surface, relative to the radius.
    uniform float uLift;

    // 0 at the source city, 1 at the destination.
    attribute float aT;

    varying float vT;
    varying float vVisibility;

    const float PI = 3.14159265;

    ${planetOcclusion}

    void main() {
      vec3 direction = normalize(sin((1.0 - aT) * uAngle) * uStart + sin(aT * uAngle) * uEnd);
      vec3 arcPosition = direction * uPlanetRadius * (1.0 + uLift * sin(PI * aT));

      vT = aT;
      vVisibility = planetVisibility(arcPosition);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(arcPosition, 1.0);
    }
  `,

  fragment: /* glsl */ `
    uniform vec3 uColor;
    // Position of the pulse along the arc, 0 to 1.
    uniform float uProgress;
    // Overall fade, used when the arc retires.
    uniform float uOpacity;

    varying float vT;
    varying float vVisibility;

    const float LINE_OPACITY = 0.3;
    const float TRAIL_LENGTH = 0.35;
    const float TRAIL_OPACITY = 0.5;
    const float PULSE_WIDTH = 0.035;
    const float PULSE_WHITENING = 0.6;

    void main() {
      float drawn = 1.0 - smoothstep(uProgress - 0.01, uProgress, vT);
      float trail = smoothstep(uProgress - TRAIL_LENGTH, uProgress, vT) * drawn;
      float offset = (vT - uProgress) / PULSE_WIDTH;
      float pulse = exp(-offset * offset);

      float alpha = (LINE_OPACITY * drawn + TRAIL_OPACITY * trail + pulse) * uOpacity * vVisibility;
      vec3 color = mix(uColor, vec3(1.0), pulse * PULSE_WHITENING);

      gl_FragColor = vec4(color, alpha);
      #include <colorspace_fragment>
    }
  `,
};
