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
  const random = mulberry32(seed);
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

/** Small seeded PRNG (Mulberry32), so the same seed always yields the same sky. */
function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}
