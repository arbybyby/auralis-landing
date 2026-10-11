/**
 * GLSL helper that hides whatever the solid planet would cover. The planet is a point cloud and
 * writes no depth, so a depth test cannot do this; instead the ray from the camera to each vertex
 * is tested against the sphere. It relies on the object being centred on the planet with no scale
 * of its own: its model matrix origin is then the planet's centre, and its scale the globe's.
 * Needs a `uPlanetRadius` uniform (the planet's radius in local units).
 */
export const planetOcclusion = /* glsl */ `
  uniform float uPlanetRadius;

  // Share of the radius over which hidden points fade, so nothing pops at the silhouette.
  const float OCCLUSION_SOFTNESS = 0.08;

  float planetVisibility(vec3 localPosition) {
    vec3 point = (modelMatrix * vec4(localPosition, 1.0)).xyz;
    vec3 center = (modelMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
    float radius = uPlanetRadius * length(modelMatrix[0].xyz);

    vec3 toPoint = point - cameraPosition;
    float pointDistance = length(toPoint);
    vec3 direction = toPoint / pointDistance;
    vec3 toCenter = center - cameraPosition;
    float closest = dot(toCenter, direction);
    float missSquared = dot(toCenter, toCenter) - closest * closest;
    float radiusSquared = radius * radius;
    if (missSquared >= radiusSquared) return 1.0;

    // Where the ray first meets the sphere; anything past it is behind the planet.
    float entry = closest - sqrt(radiusSquared - missSquared);
    float behind = smoothstep(0.0, OCCLUSION_SOFTNESS * radius, pointDistance - entry);
    float nearSilhouette = smoothstep(radiusSquared * (1.0 - OCCLUSION_SOFTNESS), radiusSquared, missSquared);
    return 1.0 - behind * (1.0 - nearSilhouette);
  }
`;
