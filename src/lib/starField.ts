import { createRandom } from "@/lib/random";

export interface StarField {
  /** x, y, z per star. */
  positions: Float32Array;
  /** Per-star random value in [0, 1), used for size, tint and twinkle phase. */
  seeds: Float32Array;
}

interface StarFieldOptions {
  count: number;
  radius: number;
  /** Half-angle of the cap around -z (away from the camera), in radians. */
  spread: number;
  seed: number;
}

/**
 * Scatters stars evenly over a spherical cap behind the scene. Only that patch of sky is ever in
 * view, so no stars are spent on directions the camera never faces.
 */
export function createStarField({
  count,
  radius,
  spread,
  seed,
}: StarFieldOptions): StarField {
  const random = createRandom(seed);
  const minDepth = Math.cos(spread);
  const positions = new Float32Array(count * 3);
  const seeds = new Float32Array(count);

  for (let index = 0; index < count; index++) {
    // On a sphere, area is uniform in depth, so a uniform depth gives a uniform spread of stars.
    const depth = minDepth + (1 - minDepth) * random();
    const ringRadius = Math.sqrt(1 - depth * depth);
    const angle = random() * 2 * Math.PI;
    positions.set(
      [
        Math.cos(angle) * ringRadius * radius,
        Math.sin(angle) * ringRadius * radius,
        -depth * radius,
      ],
      index * 3,
    );
    seeds[index] = random();
  }

  return { positions, seeds };
}
