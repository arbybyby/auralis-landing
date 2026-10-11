/**
 * Soft round particles on a sphere. Points shrink with distance like PointsMaterial, run from cyan
 * at the equator to violet at the poles, brighten towards the silhouette, and lift a little on the
 * side facing the pointer.
 */
export const planetShader = {
  vertex: /* glsl */ `
    uniform float uPointScale;
    uniform float uLandSize;
    uniform float uOceanSize;
    // View-space direction towards the pointer, and how strongly that side lights up.
    uniform vec3 uGlowDirection;
    uniform float uGlowStrength;

    attribute float aLand;

    varying float vLand;
    varying float vFacing;
    varying float vGradient;
    varying float vGlow;

    // Narrows the lit side to a soft patch rather than a whole hemisphere.
    const float GLOW_FOCUS = 3.0;

    // Stable per-point random in [0, 1), so neighbouring points differ in size and hue.
    float hash(vec3 p) {
      return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453);
    }

    void main() {
      vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
      gl_Position = projectionMatrix * viewPosition;

      float seed = hash(position);
      // Follow the planet's scale so the smaller mobile globe gets proportionally finer points.
      float modelScale = length(modelMatrix[0].xyz);
      float size = mix(uOceanSize, uLandSize, aLand) * mix(0.7, 1.3, seed);
      gl_PointSize = size * modelScale * uPointScale / -viewPosition.z;

      // 1 facing the camera, 0 on the silhouette, negative on the far hemisphere.
      vec3 viewNormal = normalize(normalMatrix * position);
      vFacing = dot(viewNormal, normalize(-viewPosition.xyz));
      vGlow = pow(max(dot(viewNormal, uGlowDirection), 0.0), GLOW_FOCUS) * uGlowStrength;

      float latitude = abs(normalize(position).y);
      vGradient = clamp(latitude + (seed - 0.5) * 0.3, 0.0, 1.0);
      vLand = aLand;
    }
  `,

  fragment: /* glsl */ `
    // Scroll-driven multiplier on this layer's opacity; 1 is the hero look.
    uniform float uSceneOpacity;
    uniform vec3 uColorEquator;
    uniform vec3 uColorPole;
    uniform float uLandOpacity;
    uniform float uOceanOpacity;

    varying float vLand;
    varying float vFacing;
    varying float vGradient;
    varying float vGlow;

    // The far hemisphere shows faintly through the near one, so the globe keeps its depth.
    const float BACK_OPACITY = 0.12;
    const float RIM_BOOST = 1.5;
    const float RIM_SHARPNESS = 3.0;

    void main() {
      float alpha = 1.0 - smoothstep(0.0, 0.5, length(gl_PointCoord - 0.5));
      if (alpha <= 0.0) discard;

      float rim = pow(1.0 - abs(vFacing), RIM_SHARPNESS);
      float hemisphere = mix(BACK_OPACITY, 1.0, smoothstep(-0.3, 0.1, vFacing));
      float opacity = mix(uOceanOpacity, uLandOpacity, vLand) * hemisphere;

      vec3 color = mix(uColorEquator, uColorPole, vGradient) * (1.0 + rim * RIM_BOOST + vGlow);
      gl_FragColor = vec4(color, alpha * opacity * uSceneOpacity);
      #include <colorspace_fragment>
    }
  `,
};
