/**
 * Fresnel halo for a shell slightly larger than the planet. Only the shell's far side is drawn, so
 * every fragment sees it from inside: brightest just past the planet's edge, fading to nothing at
 * the shell's own edge and towards its centre.
 */
export const atmosphereShader = {
  vertex: /* glsl */ `
    varying vec3 vNormal;
    varying vec3 vToCamera;

    void main() {
      vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
      gl_Position = projectionMatrix * viewPosition;
      vNormal = normalMatrix * normal;
      vToCamera = -viewPosition.xyz;
    }
  `,

  fragment: /* glsl */ `
    uniform vec3 uColorInner;
    uniform vec3 uColorOuter;
    uniform float uIntensity;
    uniform float uPlanetEdge;

    varying vec3 vNormal;
    varying vec3 vToCamera;

    const float FALLOFF = 4.0;
    const float EDGE_FADE = 0.35;

    void main() {
      // 1 behind the centre of the shell, 0 at its silhouette.
      float facing = abs(dot(normalize(vNormal), normalize(vToCamera)));
      float rim = 1.0 - facing;

      float glow = pow(rim, FALLOFF) * smoothstep(0.0, EDGE_FADE, facing);
      vec3 color = mix(uColorInner, uColorOuter, smoothstep(uPlanetEdge, 1.0, rim));

      gl_FragColor = vec4(color, glow * uIntensity);
      #include <colorspace_fragment>
    }
  `,
};
