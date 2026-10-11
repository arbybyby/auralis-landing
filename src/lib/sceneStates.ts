/** How the globe looks while one section holds the screen. */
export interface SceneState {
  /** Position of the whole globe system, in scene units (the camera sits at z = 6). */
  x: number;
  y: number;
  z: number;
  scale: number;
  /** Extra turn about the vertical axis, in radians, on top of the planet's own spin. */
  rotationY: number;
  /** Multipliers on the hero look, where 1 changes nothing. */
  atmosphere: number;
  orbits: number;
  planet: number;
  bloom: number;
}

export interface SceneKeyframe {
  /** Id of the section element that holds this state while it is centred on screen. */
  sectionId: string;
  desktop: SceneState;
  mobile: SceneState;
}

export const SCENE_STATE_KEYS = [
  "x",
  "y",
  "z",
  "scale",
  "rotationY",
  "atmosphere",
  "orbits",
  "planet",
  "bloom",
] as const satisfies readonly (keyof SceneState)[];

// Readability comes first: wherever body copy runs across the planet, the planet is dimmed or
// moved aside, and it never sits under buttons or the form.
export const SCENE_KEYFRAMES: readonly SceneKeyframe[] = [
  {
    // Far enough right that the headline clears it from 1024px to 2560px wide; on mobile, small
    // and low so it rises from behind the buttons rather than the subtitle.
    sectionId: "top",
    desktop: {
      x: 2.3,
      y: -0.25,
      z: 0,
      scale: 0.9,
      rotationY: 0,
      atmosphere: 1,
      orbits: 1,
      planet: 1,
      bloom: 1,
    },
    mobile: {
      x: 0,
      y: -2.2,
      z: 0,
      scale: 0.62,
      rotationY: 0,
      atmosphere: 1,
      orbits: 1,
      planet: 1,
      bloom: 1,
    },
  },
  {
    // Centred, closer and larger, but faint: the problem and solution copy runs right across it.
    sectionId: "problem",
    desktop: {
      x: 0,
      y: 0,
      z: 0.6,
      scale: 1,
      rotationY: 0.7,
      atmosphere: 0.6,
      orbits: 0.4,
      planet: 0.14,
      bloom: 0.6,
    },
    mobile: {
      x: 0,
      y: 0.2,
      z: 0,
      scale: 0.75,
      rotationY: 0.7,
      atmosphere: 0.5,
      orbits: 0.4,
      planet: 0.12,
      bloom: 0.6,
    },
  },
  {
    // Smaller and half off the left edge on desktop, below the heading; at the top on mobile.
    // The cards cover most of it either way.
    sectionId: "platform",
    desktop: {
      x: -3.7,
      y: -0.1,
      z: -1,
      scale: 0.55,
      rotationY: 1.4,
      atmosphere: 1,
      orbits: 0.8,
      planet: 0.55,
      bloom: 1,
    },
    mobile: {
      x: 0,
      y: 1.9,
      z: -1,
      scale: 0.45,
      rotationY: 1.4,
      atmosphere: 1,
      orbits: 0.8,
      planet: 0.5,
      bloom: 1,
    },
  },
  {
    // Further back, the orbits brighter and the planet dimmer. On desktop it sits above the three
    // steps, right of the heading; on mobile, low and to the right.
    sectionId: "how",
    desktop: {
      x: 2.7,
      y: 1.5,
      z: -3,
      scale: 0.85,
      rotationY: 2.1,
      atmosphere: 0.8,
      orbits: 1.5,
      planet: 0.35,
      bloom: 1,
    },
    mobile: {
      x: 0.9,
      y: -1.6,
      z: -2,
      scale: 0.7,
      rotationY: 2.1,
      atmosphere: 0.6,
      orbits: 1.4,
      planet: 0.2,
      bloom: 1,
    },
  },
  {
    // Far in the background and dim, mostly hidden behind the metric cards.
    sectionId: "live",
    desktop: {
      x: 0,
      y: -0.6,
      z: -7,
      scale: 1,
      rotationY: 2.8,
      atmosphere: 0.6,
      orbits: 0.6,
      planet: 0.3,
      bloom: 0.7,
    },
    mobile: {
      x: 0,
      y: 0.5,
      z: -7,
      scale: 0.9,
      rotationY: 2.8,
      atmosphere: 0.6,
      orbits: 0.6,
      planet: 0.25,
      bloom: 0.7,
    },
  },
  {
    // Small, in the top-right corner, clear of the heading on the left.
    sectionId: "use-cases",
    desktop: {
      x: 2.9,
      y: 1.55,
      z: -0.5,
      scale: 0.32,
      rotationY: 3.4,
      atmosphere: 1,
      orbits: 0.7,
      planet: 0.8,
      bloom: 1,
    },
    mobile: {
      x: 0.75,
      y: 1.85,
      z: -0.5,
      scale: 0.25,
      rotationY: 3.4,
      atmosphere: 1,
      orbits: 0.7,
      planet: 0.8,
      bloom: 1,
    },
  },
  {
    // All but gone, so the quote stands alone; low enough that the canvas pauses.
    sectionId: "testimonial",
    desktop: {
      x: 0,
      y: 0,
      z: -4,
      scale: 0.8,
      rotationY: 4,
      atmosphere: 0.4,
      orbits: 0.2,
      planet: 0.02,
      bloom: 0.5,
    },
    mobile: {
      x: 0,
      y: 0,
      z: -4,
      scale: 0.8,
      rotationY: 4,
      atmosphere: 0.4,
      orbits: 0.2,
      planet: 0.02,
      bloom: 0.5,
    },
  },
  {
    // Large and rising from below the form, with a stronger atmosphere. The footer has a solid
    // background, so the planet rises from behind it rather than under its links.
    sectionId: "access",
    desktop: {
      x: 0,
      y: -3.6,
      z: 0,
      scale: 1.3,
      rotationY: 4.8,
      atmosphere: 1.9,
      orbits: 0.9,
      planet: 0.9,
      bloom: 1.1,
    },
    mobile: {
      x: 0,
      y: -2.6,
      z: 0,
      scale: 0.85,
      rotationY: 4.8,
      atmosphere: 1.9,
      orbits: 0.9,
      planet: 0.9,
      bloom: 1.1,
    },
  },
];

export function copySceneState(from: SceneState, to: SceneState): void {
  for (const key of SCENE_STATE_KEYS) to[key] = from[key];
}

/**
 * Writes the state for a scroll position into `out`. `anchors` are the scroll positions at which
 * each keyframe's section is centred, in keyframe order. Between two anchors the states blend with a
 * smoothstep, so the globe settles while a section is centred and moves while sections change.
 */
export function sampleSceneStates(
  scroll: number,
  anchors: readonly number[],
  states: readonly SceneState[],
  out: SceneState,
): void {
  const last = anchors.length - 1;
  if (scroll <= anchors[0]) return copySceneState(states[0], out);
  if (scroll >= anchors[last]) return copySceneState(states[last], out);

  let index = 0;
  while (scroll > anchors[index + 1]) index++;
  const span = anchors[index + 1] - anchors[index];
  const t = span > 0 ? (scroll - anchors[index]) / span : 1;
  const eased = t * t * (3 - 2 * t);

  const from = states[index];
  const to = states[index + 1];
  for (const key of SCENE_STATE_KEYS) {
    out[key] = from[key] + (to[key] - from[key]) * eased;
  }
}
