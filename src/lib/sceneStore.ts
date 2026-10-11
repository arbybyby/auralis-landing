import { SCENE_SCROLL } from "@/lib/constants";
import { SCENE_KEYFRAMES } from "@/lib/sceneStates";
import type { SceneState } from "@/lib/sceneStates";

/**
 * The one shared scene state. The scroll driver writes `target` for the current scroll position;
 * the canvas eases `current` towards it each frame and draws from `current`. Plain mutable objects,
 * so neither side ever re-renders React.
 */
export const sceneTarget: SceneState = { ...SCENE_KEYFRAMES[0].desktop };
export const sceneCurrent: SceneState = { ...SCENE_KEYFRAMES[0].desktop };

/** Extra planet spin from scroll speed, in radians per second; eased by the canvas. */
export const sceneMotion = { spinBoost: 0 };

type Listener = () => void;
const listeners = new Set<Listener>();
let layerOpacity = 1;

/** Opacity of the whole canvas layer: it fades out as the planet does, below a threshold. */
export function getLayerOpacity(): number {
  return layerOpacity;
}

/** Whether the canvas is visible enough to be worth rendering. */
export function isLayerVisible(): boolean {
  return layerOpacity >= SCENE_SCROLL.pauseBelow;
}

/** Called by the scroll driver after it writes `sceneTarget`. */
export function publishSceneTarget(): void {
  layerOpacity = Math.min(1, sceneTarget.planet / SCENE_SCROLL.layerFadeBelow);
  listeners.forEach((listener) => listener());
}

export function subscribeSceneTarget(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
