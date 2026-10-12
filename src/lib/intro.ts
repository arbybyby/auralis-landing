import type { Vector3Tuple } from "@/lib/geo";

/** A value to reach and the seconds it takes; a list of them plays back to back as one curve. */
export interface IntroKeyframe {
  to: number;
  duration: number;
}

/**
 * Everything about the intro that depends on the layout. Positions are in planet radii, in the
 * globe's own frame: the planet's centre is the origin and the camera looks down -z.
 */
export interface IntroLayout {
  /** Offset of the globe from its hero position while the intro plays wide, in scene units. */
  wideShot: { x: number; y: number; z: number };
  /** Camera drift that follows the leader during the launch: pan in scene units, roll in radians. */
  follow: { x: number; y: number; roll: number };
  /** Control points of the leader's path, from the spark to where it starts to curve into orbit. */
  path: readonly Vector3Tuple[];
  /**
   * The swarm's disk: radii of its inner and outer edge and of the orbit the leader joins, and the
   * angle round the disk, in radians, at which it joins.
   */
  swarm: { inner: number; outer: number; entry: number; entryAngle: number };
  /** Share of the planet's points that fly in the swarm; the rest gather in place as it condenses. */
  swarmShare: number;
  /** Playback speed of the shared timeline: mobile tells the same story in less time. */
  timeScale: number;
}

/** Where each phase starts on the timeline, in seconds. Desktop plays it at this speed. */
const PHASES = {
  spark: 0,
  launch: 0.9,
  swarm: 2.6,
  condense: 4.8,
  text: 5.2,
  end: 7.5,
} as const;

/**
 * The one blur size the headline's glows use. Every new blur size the GPU meets costs it a shader
 * compile, which on Windows can drop a few frames, so the letters' focus and the flash share it.
 */
const GLOW_RADIUS = "0.14em";

/** Timings and look of the opening sequence. Times are in seconds unless named otherwise. */
export const INTRO = {
  /** sessionStorage key set once the intro has played, so later loads only fade in. */
  storageKey: "auralis-intro-played",
  /** Set on <html> before first paint when the full intro may play: content waits hidden. */
  pendingClass: "intro-pending",
  /**
   * Set instead when the boot script already knows the full intro will not play (a return visit, a
   * link to a section, reduced motion): CSS fades the page in from first paint, without scripts.
   */
  quickClass: "intro-quick",
  /** Custom property on <html> that carries `fade` into that CSS fade. */
  fadeProperty: "--intro-fade",
  /** Set once the intro script has taken over, so the boot script's safety reveal stands down. */
  liveClass: "intro-live",
  /** If the intro script has not taken over by then, the boot script reveals everything itself. */
  safetyRevealMs: 9000,
  /** Longest wait for the scene; after this the intro is dropped and the page simply fades in. */
  readyTimeoutMs: 6000,
  /** Longest the sequence may run once it has started; past this it jumps to the end. */
  sequenceTimeoutMs: 9000,
  /** A load that starts further down than this (in px) is a restored scroll position. */
  midPageScroll: 4,
  /** Seconds for the loader counter to catch up with each readiness step. */
  counterCatchUp: 0.45,
  /** Plain fade of the finished page whenever the full intro does not play, reduced motion included. */
  fade: 0.4,
  phases: PHASES,

  layouts: {
    desktop: {
      wideShot: { x: -1.5, y: 0.25, z: -6 },
      follow: { x: -0.35, y: 0.15, roll: -0.05 },
      path: [
        [-1.67, 0.25, 1.25],
        [-0.75, -0.6, 1.6],
        [0.9, -1.1, 1],
        [2.3, -0.8, -0.3],
      ],
      swarm: { inner: 1.25, outer: 2.4, entry: 2.2, entryAngle: 0.7 },
      swarmShare: 0.8,
      timeScale: 1,
    },
    mobile: {
      wideShot: { x: 0, y: 2.2, z: -7 },
      follow: { x: -0.15, y: 0.1, roll: -0.04 },
      path: [
        [-0.69, 1.23, 1.5],
        [-0.2, 0.3, 1.8],
        [0.6, -0.4, 0.8],
        [1.3, 0.1, -0.6],
      ],
      swarm: { inner: 1.15, outer: 2, entry: 1.8, entryAngle: 1.4 },
      swarmShare: 0.5,
      timeScale: PHASES.end / 5.5,
    },
  } satisfies Record<"desktop" | "mobile", IntroLayout>,

  /** The swarm's disk faces the camera, then tips back (`tilt`) and turns within the view (`roll`). */
  disk: { tilt: 1, roll: -0.3 },
  /** How far before its orbit the leader's path lines up with it, in planet radii. */
  entryLeadIn: 0.75,
  /** The leader speeds up along its path: progress grows with time to this power. */
  launchPower: 2,
  /**
   * Frames the scene draws, intro effects included, before the intro may start. The GPU only
   * finishes preparing a shader once it has drawn with it.
   */
  warmUpFrames: 3,

  spark: {
    /** Width of the glow sprite, in planet radii. */
    size: 1,
    /** Core brightness over the spark phase: it flickers on, then pulses twice. */
    ignite: [
      { to: 0.8, duration: 0.05 },
      { to: 0.1, duration: 0.06 },
      { to: 1, duration: 0.07 },
      { to: 0.4, duration: 0.05 },
      { to: 1, duration: 0.08 },
      { to: 1.8, duration: 0.14 },
      { to: 1, duration: 0.17 },
      { to: 1.5, duration: 0.12 },
      { to: 1, duration: 0.16 },
    ] satisfies IntroKeyframe[],
    /** The faint halo builds behind the flicker. */
    halo: { start: 0.1, duration: 0.6 },
    /** Once in orbit, the leader dissolves into the swarm it has gathered. */
    fade: { start: 2.9, duration: 0.9 },
    /** The halo breathes: share of its strength, and speed in radians per second. */
    breath: { depth: 0.25, speed: 4.5 },
    /** Higher values make the core a tighter point; the halo falls off more slowly. */
    coreSharpness: 140,
    haloFalloff: 4,
    /** HDR gain on the core, so it reads as a light source and drives the bloom. */
    coreGain: 4,
    haloColor: "#bff6ff",
  },

  trail: {
    /** Points along the path; enough that they read as a continuous line. */
    samples: 480,
    /** Length of the visible trail behind the leader, as a share of the path. */
    span: 0.55,
    /** Point diameter at the leader's end, in scene units before perspective. */
    size: 0.11,
    show: { start: PHASES.launch, duration: 0.15 },
    fade: { start: 3, duration: 1.2 },
  },

  /** The swarm and the condensing planet, computed per point on the GPU. */
  swarm: {
    /** Points are born on the trail from `birthStart`, more and more of them, until `+ birthSpan`. */
    birthStart: 2.3,
    birthSpan: 1.5,
    /** Seconds a newborn point takes to ride the trail to its end and peel off into the disk. */
    flowSeconds: 0.8,
    /** Births start this far along the path (0 is the spark). */
    trailFrom: 0.35,
    /** Share of its ride after which a point leaves the trail for its place in the disk. */
    peelOff: 0.45,
    /** Below 1, orbits crowd towards the disk's outer edge. */
    radiusBias: 0.8,
    /** Spiral arms, how far they wind outwards, and their width in radians. */
    arms: 3,
    twist: 2.4,
    armWidth: 0.5,
    /** Thickness of the disk, in planet radii. */
    thickness: 0.22,
    /** How much faster the inner disk turns: angular speed scales with (entry radius / r)^falloff. */
    spinFalloff: 0.8,
    /**
     * The swirl speeds up by `acceleration` (radians per second squared) for `peak` seconds after
     * the swarm starts, then winds down at `decay` per second.
     */
    acceleration: 1.6,
    peak: 2,
    decay: 2.2,
    /** The streams spiral in to just above the surface (`lockRadius`, in planet radii). */
    inward: { start: PHASES.condense, end: 5.3 },
    lockRadius: 1.06,
    /** Each point locks onto the globe at its own moment: land first, ocean last. */
    lock: {
      start: 4.85,
      landSpread: 0.35,
      oceanDelay: 0.3,
      oceanSpread: 0.4,
      window: 0.45,
    },
    /** Curl noise: frequency per scene unit, drift speed, and strength in planet radii. */
    noise: { scale: 0.45, speed: 0.4, amount: 0.06 },
    /** Points in flight are larger, newborns larger still, and both grow with the energy. */
    size: 1.5,
    newbornSize: 1.5,
    energySize: 0.4,
    /** Extra brightness at full energy. */
    energyGlow: 0.6,
    opacity: 0.75,
    /** Newborns cool from white-hot within this many seconds; older outer points turn violet. */
    heatSeconds: 0.6,
    violet: { from: 0.5, to: 1.8 },
    hotColor: "#ffffff",
    /** Points that never fly gather in from this far out (radius multiple) as they lock. */
    gatherScale: 1.35,
    /** Seconds over which a newborn point fades in. */
    birthFade: 0.12,
  },

  /** Swarm energy: drives the curl noise, the size and the glow of the points in flight. */
  energy: { start: PHASES.swarm, rise: 1.9, fall: 0.9 },

  /** Bloom multiplier from the start of the timeline: spark pulses, swarm build-up, shockwave flash. */
  bloom: [
    { to: 1.6, duration: 0.2 },
    { to: 1.2, duration: 0.14 },
    { to: 2.4, duration: 0.14 },
    { to: 1.3, duration: 0.17 },
    { to: 2, duration: 0.12 },
    { to: 1.3, duration: 0.13 },
    { to: 1.5, duration: 1.7 },
    { to: 2.2, duration: 1.9 },
    { to: 1.2, duration: 1.25 },
    { to: 3, duration: 0.08 },
    { to: 1, duration: 0.8 },
  ] satisfies IntroKeyframe[],

  camera: {
    /** Drift after the leader during the launch, then back. */
    follow: { start: PHASES.launch, out: 1.3, back: 1.4 },
    /** The wide shot settles into the hero position before the headline lands next to it. */
    settle: { start: 4.3, duration: 0.9 },
    /** A brief shake at the swarm's peak: amplitude in scene units, frequencies in radians per second. */
    shake: {
      start: 4.15,
      rise: 0.3,
      fall: 0.45,
      amplitude: 0.05,
      frequency: { x: 31, y: 23 },
    },
    /** A slight scale pulse with the shake. */
    pulse: { start: 4.35, rise: 0.15, fall: 0.45, scale: 1.04 },
  },

  /** A ring that rushes out from the finished planet, in planet radii. */
  shockwave: {
    start: 5.75,
    duration: 0.85,
    from: 1,
    to: 3.2,
    /** Ring thickness, as a share of the sprite's half-width. */
    width: 0.035,
    color: "#a9f3ff",
  },

  /** The scene's other layers come in after the shockwave. */
  layers: {
    markers: { start: 5.85, duration: 0.45 },
    atmosphere: { start: 5.8, flare: 1.7, flareDuration: 0.35, settle: 0.6 },
    stars: { start: 5.9, duration: 1.1 },
    /** Orbit rings draw themselves in along their circumference. */
    orbits: { start: 6, duration: 1 },
    satellites: { start: 6.35, duration: 0.5 },
    /** The first data arcs launch here, one after another. */
    arcs: { start: 6.5, stagger: 0.25 },
  },

  /** Orbit stroke-reveal: soft edge as a share of the ring, and extra brightness at its head. */
  orbitDraw: { feather: 0.04, headBoost: 2.5 },

  text: {
    /** The hero's glow and the scrim behind the copy fade in before the headline lands. */
    backdrop: { start: 4.6, duration: 0.8 },
    /** Headline letters rise out of their line's mask, turning upright and coming into focus. */
    lead: { start: PHASES.text, duration: 1, stagger: 0.035 },
    /** "think." arrives last. */
    finale: { start: 6, duration: 0.9, stagger: 0.05 },
    /** Letters start below the mask (share of their height) and tilted (degrees). */
    rise: 130,
    rotation: 9,
    /**
     * Letters come into focus as a soft glow fades and the sharp letter appears. Animating a
     * blur's radius instead would make the GPU compile a shader for every step.
     */
    focusRadius: GLOW_RADIUS,
    /** "think" rises white with a cyan glow, then relaxes to its accent colour. */
    flash: {
      duration: 1,
      color: "#ffffff",
      shadow: `0 0 ${GLOW_RADIUS} rgba(94, 231, 255, 0.9)`,
      shadowEnd: `0 0 ${GLOW_RADIUS} rgba(94, 231, 255, 0)`,
    },
    /** Its italic arrives leaning further (degrees) and slightly larger, then settles. */
    settle: { skew: -14, scale: 1.12 },
    /**
     * A line draws in under the eyebrow and wipes its text in as it goes, then fades. The clip
     * reaches above and below the eyebrow so the line under it stays inside.
     */
    eyebrow: {
      start: 6.35,
      duration: 0.5,
      lineFade: 0.35,
      clipFrom: "inset(-50% 100% -150% 0%)",
      clipTo: "inset(-50% 0% -150% 0%)",
    },
    /** Subtitle words fade up (share of their height) one after another. */
    subtitle: {
      start: 6.55,
      duration: 0.6,
      stagger: 0.017,
      rise: 60,
    },
    /** Buttons scale in; the primary one pulses a glow. */
    buttons: {
      start: 6.85,
      duration: 0.55,
      stagger: 0.08,
      scale: 0.88,
      glow: {
        start: 7,
        rise: 0.2,
        fall: 0.3,
        shadow: "0 0 2.5rem 0.25rem rgba(94, 231, 255, 0.55)",
        shadowEnd: "0 0 2.5rem 0.25rem rgba(94, 231, 255, 0)",
      },
    },
    /** The navigation slides down into its bar. */
    nav: { start: 6.95, duration: 0.5 },
    hints: { start: 7.1, duration: 0.4 },
  },

  loader: {
    /** As the spark ignites, the counter runs out to 100; then the counter and its bar fade. */
    finish: 0.3,
    hide: { start: 0.35, duration: 0.3 },
    /** The skip control stays until the story is nearly told. */
    skipHide: { start: 6.7, duration: 0.3 },
  },
} as const;

/**
 * Runs at the top of the page while the HTML is parsed, before first paint. When the full intro
 * will not play, it starts the plain CSS fade straight away. Otherwise it hides the hero for the
 * intro, and reveals everything on its own if the app's scripts never take over.
 */
export const INTRO_BOOT_SCRIPT = `(function () {
  var root = document.documentElement;
  var quick;
  try {
    quick =
      sessionStorage.getItem("${INTRO.storageKey}") ||
      location.hash ||
      matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch (error) {
    quick = true;
  }
  if (quick) {
    root.style.setProperty("${INTRO.fadeProperty}", "${INTRO.fade}s");
    root.classList.add("${INTRO.quickClass}");
    return;
  }
  root.classList.add("${INTRO.pendingClass}");
  setTimeout(function () {
    if (root.classList.contains("${INTRO.liveClass}")) return;
    root.classList.remove("${INTRO.pendingClass}");
  }, ${INTRO.safetyRevealMs});
})();`;
