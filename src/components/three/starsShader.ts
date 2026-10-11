/**
 * Faint, fixed-size star points. Most are white, a share pick up the brand cyan or violet, and each
 * one's brightness drifts on its own phase.
 */
export const starsShader = {
  vertex: /* glsl */ `
    uniform float uPixelRatio;
    uniform float uMinSize;
    uniform float uMaxSize;
    uniform float uTime;
    uniform float uTintedShare;
    uniform vec3 uColorCyan;
    uniform vec3 uColorViolet;

    attribute float aSeed;

    varying vec3 vColor;
    varying float vTwinkle;

    const float TWINKLE_DEPTH = 0.35;
    const float TAU = 6.2831853;

    void main() {
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      // Squaring the seed favours small stars, with only a few larger ones.
      gl_PointSize = mix(uMinSize, uMaxSize, aSeed * aSeed) * uPixelRatio;

      // Spread the one seed into separate values so tint and phase do not track size.
      float tintPick = fract(aSeed * 17.0);
      vec3 tint = tintPick < uTintedShare * 0.5 ? uColorCyan : uColorViolet;
      vColor = tintPick < uTintedShare ? tint : vec3(1.0);

      float phase = fract(aSeed * 29.0) * TAU;
      vTwinkle = 1.0 - TWINKLE_DEPTH + TWINKLE_DEPTH * sin(uTime + phase);
    }
  `,

  fragment: /* glsl */ `
    uniform float uOpacity;

    varying vec3 vColor;
    varying float vTwinkle;

    void main() {
      float alpha = 1.0 - smoothstep(0.0, 0.5, length(gl_PointCoord - 0.5));
      if (alpha <= 0.0) discard;

      gl_FragColor = vec4(vColor, alpha * uOpacity * vTwinkle);
      #include <colorspace_fragment>
    }
  `,
};
