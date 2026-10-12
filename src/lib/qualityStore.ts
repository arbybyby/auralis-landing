type Listener = () => void;
const listeners = new Set<Listener>();
/**
 * How many steps down the quality ladder (lib/sceneQuality.ts) the scene has taken this page load.
 * It only ever goes down, so the scene cannot flicker between two levels.
 */
let level = 0;

export function getQualityLevel(): number {
  return level;
}

/** Takes one step down, unless `floor` (the ladder's last level) is reached. */
export function stepDownQuality(floor: number): boolean {
  if (level >= floor) return false;
  level += 1;
  listeners.forEach((listener) => listener());
  return true;
}

export function subscribeQuality(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
