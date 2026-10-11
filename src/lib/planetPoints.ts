import type { LandMask } from "@/lib/landMask";

export interface PlanetPointCounts {
  land: number;
  ocean: number;
}

export interface PlanetPoints {
  /** x, y, z per point, on a sphere of the requested radius. */
  positions: Float32Array;
  /** 1 for land points, 0 for ocean points. */
  land: Float32Array;
}

type Vector = [x: number, y: number, z: number];

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

/**
 * Spreads land and ocean points evenly over a sphere. Each gets its own Fibonacci sphere, sized
 * by the land fraction so the points that pass the mask come close to the requested count.
 */
export function createPlanetPoints(
  mask: LandMask,
  counts: PlanetPointCounts,
  radius: number,
): PlanetPoints {
  // Longitude 0 faces +z (the camera) and east runs towards +x, so the map is not mirrored.
  const isLand = ([x, y, z]: Vector) =>
    mask.isLand(Math.asin(y), Math.atan2(x, z));

  const landPoints = fibonacciSphere(
    Math.round(counts.land / mask.landFraction),
  ).filter(isLand);
  const oceanPoints = fibonacciSphere(
    Math.round(counts.ocean / (1 - mask.landFraction)),
  ).filter((point) => !isLand(point));

  const points = [...landPoints, ...oceanPoints];
  const positions = new Float32Array(points.length * 3);
  const land = new Float32Array(points.length);

  points.forEach(([x, y, z], index) => {
    positions.set([x * radius, y * radius, z * radius], index * 3);
    land[index] = index < landPoints.length ? 1 : 0;
  });

  return { positions, land };
}

/** Unit vectors spread evenly over a sphere along a golden-angle spiral. */
function fibonacciSphere(count: number): Vector[] {
  return Array.from({ length: count }, (_, index) => {
    const y = 1 - (2 * (index + 0.5)) / count;
    const ringRadius = Math.sqrt(1 - y * y);
    const angle = index * GOLDEN_ANGLE;
    return [Math.sin(angle) * ringRadius, y, Math.cos(angle) * ringRadius];
  });
}
