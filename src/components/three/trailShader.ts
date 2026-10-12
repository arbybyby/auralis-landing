/**
 * The glowing trail behind the intro's leader. Points sit evenly along its path; only the stretch
 * just behind the leader shows, brightest and white-hot at the leader, cooling and fading behind.
 */
export const trailShader = {
  vertex: /* glsl */ `
    // Where the leader is along the path, and how far behind it the trail reaches.
    uniform float uHead;
    uniform float uSpan;
    uniform float uPointScale;
    uniform float uSize;

    // This point's place along the path, on the same scale as uHead.
    attribute float aProgress;

    varying float vFade;

    // Points far down the trail shrink to this share of the leader's.
    const float TAIL_SIZE = 0.35;

    void main() {
      float behind = uHead - aProgress;
      // 1 at the leader, falling to 0 a span behind it; nothing shows ahead of the leader.
      vFade = behind < 0.0 ? 0.0 : pow(1.0 - min(behind / uSpan, 1.0), 1.5);

      vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
      gl_Position = projectionMatrix * viewPosition;
      float modelScale = length(modelMatrix[0].xyz);
      float size = uSize * mix(TAIL_SIZE, 1.0, vFade) * modelScale * uPointScale / -viewPosition.z;
      gl_PointSize = vFade > 0.0 ? size : 0.0;
    }
  `,

  fragment: /* glsl */ `
    uniform float uOpacity;
    uniform vec3 uColorHot;
    uniform vec3 uColorCyan;
    uniform vec3 uColorViolet;

    varying float vFade;

    void main() {
      float alpha = 1.0 - smoothstep(0.0, 0.5, length(gl_PointCoord - 0.5));
      if (alpha <= 0.0) discard;

      vec3 color = mix(uColorViolet, uColorCyan, smoothstep(0.0, 0.6, vFade));
      color = mix(color, uColorHot, smoothstep(0.85, 1.0, vFade));
      gl_FragColor = vec4(color, alpha * vFade * uOpacity);
      #include <colorspace_fragment>
    }
  `,
};
