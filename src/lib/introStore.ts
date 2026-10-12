import { INTRO } from "@/lib/intro";

/**
 * The intro's shared state: written by its GSAP timeline, read by the scene every frame. A plain
 * mutable object, so animating it never re-renders React.
 */
export interface IntroState {
  /** Seconds on the intro timeline, at desktop speed; at its end whenever no intro runs. */
  time: number;
  /** Brightness of the spark's core and strength of its halo. */
  spark: number;
  halo: number;
  /** Opacity of the trail the leader leaves behind. */
  trail: number;
  /** Swarm energy, 0 to 1: curl noise, size and glow of the points in flight. */
  energy: number;
  /** Multiplier on the bloom. */
  bloom: number;
  /** The wide shot: the globe's offset from its hero position, in scene units. */
  wideX: number;
  wideY: number;
  wideZ: number;
  /** Camera drift after the leader: pan in scene units, roll in radians. */
  panX: number;
  panY: number;
  roll: number;
  /** Strength of the camera shake, 0 to 1, and the scale pulse multiplier. */
  shake: number;
  pulse: number;
  /** Shockwave progress, 0 to 1; nothing shows at either end. */
  shockwave: number;
  /** The scene's other layers, 0 to 1; the atmosphere briefly flares above 1. */
  atmosphere: number;
  markers: number;
  stars: number;
  orbits: number;
  satellites: number;
  /** 0 holds the data arcs back; 1 lets them fly. */
  arcs: number;
  /**
   * True while the intro waits to start. The intro's own effects then draw invisibly, so the GPU
   * prepares their shaders before the show rather than freezing it on first use.
   */
  warmUp: boolean;
}

const FINISHED: Readonly<IntroState> = {
  time: INTRO.phases.end,
  spark: 0,
  halo: 0,
  trail: 0,
  energy: 0,
  bloom: 1,
  wideX: 0,
  wideY: 0,
  wideZ: 0,
  panX: 0,
  panY: 0,
  roll: 0,
  shake: 0,
  pulse: 1,
  shockwave: 0,
  atmosphere: 1,
  markers: 1,
  stars: 1,
  orbits: 1,
  satellites: 1,
  arcs: 1,
  warmUp: false,
};

/** Starts finished, so the scene renders normally whenever no intro runs. */
export const introState: IntroState = { ...FINISHED };

/** Sets the opening frame: an empty sky, with the globe pulled back to the wide shot. */
export function startIntroState(wideShot: {
  x: number;
  y: number;
  z: number;
}): void {
  Object.assign(introState, FINISHED, {
    warmUp: true,
    time: 0,
    wideX: wideShot.x,
    wideY: wideShot.y,
    wideZ: wideShot.z,
    atmosphere: 0,
    markers: 0,
    stars: 0,
    orbits: 0,
    satellites: 0,
    arcs: 0,
  });
}

/** Jumps the scene to its finished state, as if the intro had played. */
export function finishIntroState(): void {
  Object.assign(introState, FINISHED);
}

/** What the loader waits for before the intro plays. */
export type IntroMilestone = "fonts" | "scene" | "planet" | "shaders" | "frame";

type Listener = () => void;
const listeners = new Set<Listener>();
const reached = new Set<IntroMilestone>();
let running = false;

function notify(): void {
  listeners.forEach((listener) => listener());
}

/** True from the moment the intro takes over until it hands the page back. */
export function isIntroRunning(): boolean {
  return running;
}

export function setIntroRunning(value: boolean): void {
  if (running === value) return;
  running = value;
  notify();
}

export function markIntroReady(milestone: IntroMilestone): void {
  if (reached.has(milestone)) return;
  reached.add(milestone);
  notify();
}

export function hasReachedIntroMilestone(milestone: IntroMilestone): boolean {
  return reached.has(milestone);
}

/** Called whenever the intro starts or stops, or a milestone is reached. */
export function subscribeIntro(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
