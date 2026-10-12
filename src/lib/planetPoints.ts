import { vectorToLatLon } from "@/lib/geo";
import type { Vector3Tuple } from "@/lib/geo";
import type { LandMask } from "@/lib/landMask";
import { createRandom } from "@/lib/random";

export interface PlanetPointCounts {
  land: number;
  ocean: number;
}

export interface PlanetPoints {
  /** x, y, z per point, on a sphere of the requested radius. */
  positions: Float32Array;
  /** 1 for land points, 0 for ocean points. */
  land: Float32Array;
  /** A stable random value in [0, 1) per point. */
  seeds: Float32Array;
  /** Four more per point, from a separate sequence so they leave `seeds` unchanged. */
  randoms: Float32Array;
}

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

/**
 * Spreads land and ocean points evenly over a sphere. Each gets its own Fibonacci sphere, sized
 * by the land fraction so the points that pass the mask come close to the requested count.
 *
 * The points are stored in a shuffled order, so any leading share of them is an even sample of
 * the whole planet: drawing fewer of them thins the globe out instead of cutting part of it away.
 */
export function createPlanetPoints(
  mask: LandMask,
  counts: PlanetPointCounts,
  radius: number,
  seed: number,
): PlanetPoints {
  const isLand = (point: Vector3Tuple) => {
    const { latitude, longitude } = vectorToLatLon(point);
    return mask.isLand(latitude, longitude);
  };

  const landPoints = fibonacciSphere(
    Math.round(counts.land / mask.landFraction),
  ).filter(isLand);
  const oceanPoints = fibonacciSphere(
    Math.round(counts.ocean / (1 - mask.landFraction)),
  ).filter((point) => !isLand(point));

  const points = [...landPoints, ...oceanPoints];
  const positions = new Float32Array(points.length * 3);
  const land = new Float32Array(points.length);
  const seeds = new Float32Array(points.length);
  const randoms = new Float32Array(points.length * 4);
  const random = createRandom(seed);
  const extraRandom = createRandom(seed + 1);
  const slots = shuffledIndices(points.length, createRandom(seed + 2));

  points.forEach(([x, y, z], index) => {
    const slot = slots[index];
    positions.set([x * radius, y * radius, z * radius], slot * 3);
    land[slot] = index < landPoints.length ? 1 : 0;
    seeds[slot] = random();
    randoms.set(
      [extraRandom(), extraRandom(), extraRandom(), extraRandom()],
      slot * 4,
    );
  });

  return { positions, land, seeds, randoms };
}

/** The numbers 0 to count - 1 in a random order (a Fisher-Yates shuffle). */
function shuffledIndices(count: number, random: () => number): Uint32Array {
  const indices = Uint32Array.from({ length: count }, (_, index) => index);
  for (let last = count - 1; last > 0; last--) {
    const other = Math.floor(random() * (last + 1));
    [indices[last], indices[other]] = [indices[other], indices[last]];
  }
  return indices;
}

/** Unit vectors spread evenly over a sphere along a golden-angle spiral. */
function fibonacciSphere(count: number): Vector3Tuple[] {
  return Array.from({ length: count }, (_, index) => {
    const y = 1 - (2 * (index + 0.5)) / count;
    const ringRadius = Math.sqrt(1 - y * y);
    const angle = index * GOLDEN_ANGLE;
    return [Math.sin(angle) * ringRadius, y, Math.cos(angle) * ringRadius];
  });
}
