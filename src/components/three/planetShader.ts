/**
 * Soft round particles on a sphere. Points shrink with distance like PointsMaterial, run from cyan
 * at the equator to violet at the poles, and brighten towards the silhouette.
 */
export const planetShader = {
  vertex: /* glsl */ `
    uniform float uPointScale;
    uniform float uLandSize;
    uniform float uOceanSize;

    attribute float aLand;

    varying float vLand;
    varying float vFacing;
    varying float vGradient;

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

      float latitude = abs(normalize(position).y);
      vGradient = clamp(latitude + (seed - 0.5) * 0.3, 0.0, 1.0);
      vLand = aLand;
    }
  `,

  fragment: /* glsl */ `
    uniform vec3 uColorEquator;
    uniform vec3 uColorPole;
    uniform float uLandOpacity;
    uniform float uOceanOpacity;

    varying float vLand;
    varying float vFacing;
    varying float vGradient;

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

      vec3 color = mix(uColorEquator, uColorPole, vGradient) * (1.0 + rim * RIM_BOOST);
      gl_FragColor = vec4(color, alpha * opacity);
      #include <colorspace_fragment>
    }
  `,
};
