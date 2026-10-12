import { glslFloat as float } from "@/components/three/glsl";
import { planetOcclusion } from "@/components/three/planetOcclusion";
import { INTRO } from "@/lib/intro";

/**
 * Thin orbit ring with one bright stretch that fades away round the loop. The ring is a unit
 * circle in the XZ plane, scaled here, so every ring shares one geometry. During the intro the
 * ring draws itself in round its circumference, led by a brighter head.
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
    // Scroll-driven multiplier on this layer's opacity; 1 is the hero look.
    uniform float uSceneOpacity;
    uniform vec3 uColor;
    uniform float uMinOpacity;
    uniform float uMaxOpacity;
    uniform float uSharpness;
    // Share of the ring drawn so far: 0 shows nothing, 1 the whole loop.
    uniform float uDraw;

    varying vec2 vCircle;
    varying float vVisibility;

    const float TAU = 6.2831853;
    const float DRAW_FEATHER = ${float(INTRO.orbitDraw.feather)};
    const float HEAD_BOOST = ${float(INTRO.orbitDraw.headBoost)};

    void main() {
      // Angle from the interpolated position, not a per-vertex value, so the loop has no seam.
      float angle = atan(vCircle.y, vCircle.x);
      float highlight = pow(0.5 + 0.5 * cos(angle), uSharpness);
      float opacity = mix(uMinOpacity, uMaxOpacity, highlight) * vVisibility * uSceneOpacity;

      // The drawn stretch ends in a soft edge, reaching past the loop's end once fully drawn.
      float along = angle / TAU + 0.5;
      float edge = uDraw * (1.0 + DRAW_FEATHER);
      float drawn = 1.0 - smoothstep(edge - DRAW_FEATHER, edge, along);
      float fromHead = (along - edge) / DRAW_FEATHER;
      float head = exp(-fromHead * fromHead) * (1.0 - step(1.0, uDraw));
      opacity *= drawn * (1.0 + head * HEAD_BOOST);

      gl_FragColor = vec4(uColor, opacity);
      #include <colorspace_fragment>
    }
  `,
};
