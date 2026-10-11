/**
 * Fresnel halo for a shell slightly larger than the planet. Only the shell's far side is drawn, so
 * the facing ratio maps cleanly to how far a fragment sits from the globe's centre on screen. The
 * glow peaks at the planet's silhouette and fades to exactly nothing at the shell's edge, with no
 * slope left there to read as a ring.
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

    // How far inside the planet's silhouette the glow starts, in shell radii.
    const float INNER_FADE = 0.2;
    // Higher values thin the halo out faster beyond the planet's edge.
    const float OUTER_FALLOFF = 2.5;

    void main() {
      float facing = abs(dot(normalize(vNormal), normalize(vToCamera)));
      // Distance from the centre of the shell on screen: 0 at the centre, 1 at its silhouette.
      float radial = sqrt(max(1.0 - facing * facing, 0.0));

      float outward = smoothstep(uPlanetEdge, 1.0, radial);
      float inward = smoothstep(uPlanetEdge - INNER_FADE, uPlanetEdge, radial);
      float glow = inward * pow(1.0 - outward, OUTER_FALLOFF);

      vec3 color = mix(uColorInner, uColorOuter, outward);
      gl_FragColor = vec4(color, glow * uIntensity);
      #include <colorspace_fragment>
    }
  `,
};
