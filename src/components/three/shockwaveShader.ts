import { glslFloat as float } from "@/components/three/glsl";
import { INTRO } from "@/lib/intro";

/** A thin bright ring with a faint wash inside it, so it reads as a wave rather than a line. */
export const shockwaveShader = {
  vertex: /* glsl */ `
    // -1 to 1 across the sprite.
    varying vec2 vOffset;

    void main() {
      vOffset = uv * 2.0 - 1.0;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  fragment: /* glsl */ `
    // Ring radius, as a share of the sprite's half-width.
    uniform float uRadius;
    uniform float uOpacity;
    uniform vec3 uColor;

    varying vec2 vOffset;

    const float WIDTH = ${float(INTRO.shockwave.width)};
    // The wash fills this far inside the ring, at this share of its brightness.
    const float WASH_DEPTH = 0.25;
    const float WASH_STRENGTH = 0.15;

    void main() {
      float fromCentre = length(vOffset);
      float fromRing = (fromCentre - uRadius) / WIDTH;
      float ring = exp(-fromRing * fromRing);
      float wash = smoothstep(uRadius - WASH_DEPTH, uRadius, fromCentre) * step(fromCentre, uRadius);

      // Alpha follows the light: the canvas is transparent, so a solid alpha would darken the page.
      float light = (ring + wash * WASH_STRENGTH) * uOpacity;
      gl_FragColor = vec4(uColor, clamp(light, 0.0, 1.0));
      #include <colorspace_fragment>
    }
  `,
};
