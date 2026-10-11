/** Small seeded PRNG (Mulberry32): the same seed always yields the same sequence in [0, 1). */
export function createRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

/** A value in [min, max) from a random source. */
export function randomBetween(
  random: () => number,
  min: number,
  max: number,
): number {
  return min + (max - min) * random();
}
