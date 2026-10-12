import { glslFloat as float } from "@/components/three/glsl";
import { INTRO } from "@/lib/intro";

const { spark } = INTRO;

/**
 * The intro's leader: a tiny, intensely bright core inside a soft halo that breathes. The core is
 * pushed well past 1 so the bloom picks it up as a light source.
 */
export const sparkShader = {
  vertex: /* glsl */ `
    // -1 to 1 across the sprite.
    varying vec2 vOffset;

    void main() {
      vOffset = uv * 2.0 - 1.0;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  fragment: /* glsl */ `
    uniform float uCore;
    uniform float uHalo;
    uniform float uTime;
    uniform vec3 uHaloColor;

    varying vec2 vOffset;

    const float CORE_SHARPNESS = ${float(spark.coreSharpness)};
    const float CORE_GAIN = ${float(spark.coreGain)};
    const float HALO_FALLOFF = ${float(spark.haloFalloff)};
    const float BREATH_DEPTH = ${float(spark.breath.depth)};
    const float BREATH_SPEED = ${float(spark.breath.speed)};

    void main() {
      float fromCentre = length(vOffset);
      float core = exp(-fromCentre * fromCentre * CORE_SHARPNESS) * uCore * CORE_GAIN;
      float breath = 1.0 + BREATH_DEPTH * sin(uTime * BREATH_SPEED);
      // Falls to exactly nothing before the sprite's edge, so its square outline never shows.
      float halo = exp(-fromCentre * HALO_FALLOFF) * (1.0 - smoothstep(0.6, 1.0, fromCentre)) * uHalo * breath;

      // Alpha follows the light: the canvas is transparent, so a solid alpha would darken the
      // page behind the sprite's square.
      vec3 light = vec3(core) + uHaloColor * halo;
      float alpha = clamp(core + halo, 0.0, 1.0);
      gl_FragColor = vec4(light / max(alpha, 0.0001), alpha);
      #include <colorspace_fragment>
    }
  `,
};
