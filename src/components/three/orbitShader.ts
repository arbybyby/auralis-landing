import { planetOcclusion } from "@/components/three/planetOcclusion";

/**
 * Thin orbit ring with one bright stretch that fades away round the loop. The ring is a unit
 * circle in the XZ plane, scaled here, so every ring shares one geometry.
 */
export const orbitShader = {
  vertex: /* glsl */ `
    uniform float uRadius;

    varying vec2 vCircle;
    varying float vVisibility;

    ${planetOcclusion}

    void main() {
      vec3 ringPosition = position * uRadius;
      vCircle = position.xz;
      vVisibility = planetVisibility(ringPosition);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(ringPosition, 1.0);
    }
  `,

  fragment: /* glsl */ `
    uniform vec3 uColor;
    uniform float uMinOpacity;
    uniform float uMaxOpacity;
    uniform float uSharpness;

    varying vec2 vCircle;
    varying float vVisibility;

    void main() {
      // Angle from the interpolated position, not a per-vertex value, so the loop has no seam.
      float angle = atan(vCircle.y, vCircle.x);
      float highlight = pow(0.5 + 0.5 * cos(angle), uSharpness);
      float opacity = mix(uMinOpacity, uMaxOpacity, highlight) * vVisibility;

      gl_FragColor = vec4(uColor, opacity);
      #include <colorspace_fragment>
    }
  `,
};
