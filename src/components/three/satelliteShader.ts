import { planetOcclusion } from "@/components/three/planetOcclusion";

/**
 * Satellites and their trails in one draw call. Every satellite is a head point plus trail points;
 * all of them are placed on the orbit from time, so a trail is just the same path a few moments
 * earlier and needs no history buffer.
 */
export const satelliteShader = {
  vertex: /* glsl */ `
    uniform float uTime;
    uniform float uPointScale;
    uniform float uHeadSize;
    uniform float uTrailSize;
    uniform float uTrailSpacing;

    // The orbital plane as two perpendicular unit axes, scaled by the orbit's radius.
    attribute vec3 aAxisU;
    attribute vec3 aAxisV;
    attribute float aRadius;
    attribute float aPhase;
    // Signed: negative speeds travel the other way round the orbit.
    attribute float aSpeed;
    // 0 for the head, then 1, 2, ... for each trail sample behind it.
    attribute float aTrailIndex;
    // 1 at the head, falling towards 0 at the end of the trail.
    attribute float aFade;
    attribute float aWarm;

    varying float vFade;
    varying float vWarm;
    varying float vIsHead;
    varying float vVisibility;

    ${planetOcclusion}

    void main() {
      float angle = aPhase + uTime * aSpeed - sign(aSpeed) * aTrailIndex * uTrailSpacing;
      vec3 orbitPosition = (cos(angle) * aAxisU + sin(angle) * aAxisV) * aRadius;

      vec4 viewPosition = modelViewMatrix * vec4(orbitPosition, 1.0);
      gl_Position = projectionMatrix * viewPosition;

      vIsHead = 1.0 - step(0.5, aTrailIndex);
      float size = mix(uTrailSize * aFade, uHeadSize, vIsHead);
      float modelScale = length(modelMatrix[0].xyz);
      gl_PointSize = size * modelScale * uPointScale / -viewPosition.z;

      vFade = aFade;
      vWarm = aWarm;
      vVisibility = planetVisibility(orbitPosition);
    }
  `,

  fragment: /* glsl */ `
    // Scroll-driven multiplier on this layer's opacity; 1 is the hero look.
    uniform float uSceneOpacity;
    uniform vec3 uColorCool;
    uniform vec3 uColorWarm;
    uniform float uTrailOpacity;

    varying float vFade;
    varying float vWarm;
    varying float vIsHead;
    varying float vVisibility;

    const float HEAD_WHITENING = 0.45;

    void main() {
      float alpha = 1.0 - smoothstep(0.0, 0.5, length(gl_PointCoord - 0.5));
      if (alpha <= 0.0) discard;

      vec3 color = mix(uColorCool, uColorWarm, vWarm);
      color = mix(color, vec3(1.0), vIsHead * HEAD_WHITENING);
      float strength = mix(uTrailOpacity * vFade, 1.0, vIsHead);

      gl_FragColor = vec4(color, alpha * strength * vVisibility * uSceneOpacity);
      #include <colorspace_fragment>
    }
  `,
};
