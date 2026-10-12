import { SCENE_RECOVERY, STATIC_PLANET } from "@/lib/constants";
import { storeDeviceTier } from "@/lib/deviceTier";
import { reportSceneFailed } from "@/lib/introStore";

/** Whether the live scene can run, and which canvas it is on. */
export interface SceneHealth {
  /** Bumped to give the scene a fresh canvas after its WebGL context came back. */
  generation: number;
  /** The context is gone for now; nothing should draw until it returns. */
  contextLost: boolean;
  /** The scene has failed for good; the static planet stands in for it. */
  failed: boolean;
}

const INITIAL: SceneHealth = {
  generation: 0,
  contextLost: false,
  failed: false,
};

type Listener = () => void;
const listeners = new Set<Listener>();
let health = INITIAL;
let remounts = 0;
let restoreTimer: number | undefined;

function update(change: Partial<SceneHealth>): void {
  health = { ...health, ...change };
  listeners.forEach((listener) => listener());
}

export function getSceneHealth(): SceneHealth {
  return health;
}

/** What the server renders: a healthy scene, which the browser then sets up. */
export function getServerSceneHealth(): SceneHealth {
  return INITIAL;
}

export function subscribeSceneHealth(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function showStaticPlanet(): void {
  document.documentElement.classList.add(STATIC_PLANET.className);
}

/**
 * Gives up on the live scene for the rest of the session: the static planet takes its place,
 * later loads skip straight to it, and the intro hands the page over at once.
 */
export function reportSceneFailure(): void {
  if (health.failed) return;
  window.clearTimeout(restoreTimer);
  showStaticPlanet();
  storeDeviceTier("none");
  reportSceneFailed();
  update({ failed: true, contextLost: false });
}

/** The WebGL context was lost: pause, and wait a moment for the browser to bring it back. */
export function reportContextLost(): void {
  window.clearTimeout(restoreTimer);
  if (remounts >= SCENE_RECOVERY.maxRemounts) {
    reportSceneFailure();
    return;
  }
  update({ contextLost: true });
  restoreTimer = window.setTimeout(
    reportSceneFailure,
    SCENE_RECOVERY.restoreTimeoutMs,
  );
}

/**
 * The context is back. Rather than trust every buffer and shader to have survived, the scene
 * starts over on a fresh canvas.
 */
export function reportContextRestored(): void {
  if (health.failed) return;
  window.clearTimeout(restoreTimer);
  remounts += 1;
  update({ generation: health.generation + 1, contextLost: false });
}
