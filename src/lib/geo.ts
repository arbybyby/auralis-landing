/**
 * The one globe convention: latitude runs along +y, longitude 0 faces +z (towards the camera before
 * the planet spins) and east runs towards +x, so the map is not mirrored when seen from outside.
 * The particle land mask and the city markers both go through these functions, which is what keeps
 * every city on its continent. Angles are in radians.
 */
export type Vector3Tuple = [x: number, y: number, z: number];

export interface LatLon {
  latitude: number;
  longitude: number;
}

export function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function latLonToVector(
  { latitude, longitude }: LatLon,
  radius = 1,
): Vector3Tuple {
  const ringRadius = Math.cos(latitude) * radius;
  return [
    ringRadius * Math.sin(longitude),
    Math.sin(latitude) * radius,
    ringRadius * Math.cos(longitude),
  ];
}

export function vectorToLatLon([x, y, z]: Vector3Tuple): LatLon {
  return {
    latitude: Math.atan2(y, Math.hypot(x, z)),
    longitude: Math.atan2(x, z),
  };
}
