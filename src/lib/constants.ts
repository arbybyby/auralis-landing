import type { CityId } from "@/lib/cities";
import type { OrbitRing } from "@/lib/orbits";

/**
 * How much 3D a device gets (lib/deviceTier.ts); every threshold lives here. "none" means no
 * usable GPU WebGL2 at all and shows the static planet; "low", "medium" and "high" are budgets
 * for the live scene (SCENE_TIERS).
 */
export const DEVICE_TIER = {
  /** sessionStorage key: the tier is measured once per session, and the boot script reads it. */
  storageKey: "auralis-device-tier",
  /** Below either limit a device gets "low". */
  lowBelow: { cpuCores: 4, memoryGb: 4 },
  /** Below either limit it gets "medium" at most. */
  highFrom: { cpuCores: 8, memoryGb: 8 },
  /**
   * Screens with more physical pixels than this (about 4K) get "medium" at most: every pass the
   * scene draws scales with them.
   */
  maxHighTierPixels: 8_300_000,
  /** Connections on which data matters more than visuals: "low". */
  lowConnections: ["slow-2g", "2g"],
  /** Connections that get "medium" at most. */
  mediumConnections: ["3g"],
  /** GPU renderer names that mean WebGL runs on the CPU, where the scene would crawl: "none". */
  softwareRenderers:
    /swiftshader|llvmpipe|softpipe|software rasterizer|basic render driver/i,
} as const;

/** Tailwind's `lg` breakpoint (64rem): the desktop scene layout applies from here up. */
export const DESKTOP_QUERY = "(min-width: 64rem)";

export const SMOOTH_SCROLL = {
  /** Share of the remaining distance covered each frame; lower is smoother but laggier. */
  lerp: 0.1,
} as const;

/** How scrolling drives the scene. */
export const SCENE_SCROLL = {
  /** Seconds the scene trails the scroll position (GSAP scrub). */
  scrub: 0.8,
  /** Damping rate as the canvas eases towards the scroll target; higher settles faster. */
  damping: 4,
  /** Extra planet spin per viewport height per second of scrolling, in radians per second. */
  velocitySpin: 0.6,
  /** Cap on that extra spin, in radians per second. */
  maxVelocitySpin: 0.9,
  /** Planet opacity below which the whole canvas layer fades out with it. */
  layerFadeBelow: 0.25,
  /** Layer opacity below which the canvas stops rendering until it comes back. */
  pauseBelow: 0.1,
} as const;

/** Mobile menu links rise in one after another once the overlay starts to fade in. */
export const MOBILE_MENU_REVEAL = {
  delayMs: 100,
  staggerMs: 50,
} as const;

/** Mirror --color-accent, --color-accent-2 and --color-warm in globals.css. */
export const BRAND_COLORS = {
  cyan: "#5ee7ff",
  violet: "#7c5cff",
  warm: "#ffb86b",
} as const;

export interface BloomSettings {
  intensity: number;
  luminanceThreshold: number;
  radius: number;
  /** Mipmap blur levels; fewer levels mean fewer passes and a tighter glow. */
  levels: number;
}

/** What one device tier may spend on the scene. */
export interface SceneTierSettings {
  dpr: { min: number; max: number };
  planetPoints: { land: number; ocean: number };
  starCount: number;
  /** null leaves postprocessing out entirely, code and all. */
  bloom: BloomSettings | null;
  orbitCount: number;
  satellites: { count: number; trailLength: number };
  arcCount: number;
  /** Frames per second the scene is held to; null follows the display. */
  frameRate: number | null;
  /** Whether the planet's side facing the pointer lights up. */
  pointerGlow: boolean;
  /** Whether the full opening sequence plays; otherwise the page simply fades in. */
  fullIntro: boolean;
}

/**
 * Rendering budget per device tier ("none" gets the static planet, so it has no entry). The
 * pixel-ratio cap is the main cost lever: every full-screen bloom pass scales with it.
 */
export const SCENE_TIERS = {
  high: {
    dpr: { min: 1, max: 1.75 },
    planetPoints: { land: 20_000, ocean: 3_000 },
    starCount: 1_200,
    bloom: { intensity: 0.9, luminanceThreshold: 0.15, radius: 0.7, levels: 8 },
    orbitCount: 3,
    satellites: { count: 12, trailLength: 8 },
    arcCount: 7,
    frameRate: null,
    pointerGlow: true,
    fullIntro: true,
  },
  medium: {
    dpr: { min: 1, max: 1.25 },
    planetPoints: { land: 12_000, ocean: 2_000 },
    starCount: 600,
    bloom: { intensity: 0.6, luminanceThreshold: 0.15, radius: 0.6, levels: 5 },
    orbitCount: 2,
    satellites: { count: 8, trailLength: 5 },
    arcCount: 4,
    frameRate: null,
    pointerGlow: true,
    fullIntro: true,
  },
  // No bloom, no trails, no pointer glow, half the frame rate: the planet still turns and arcs fly.
  low: {
    dpr: { min: 1, max: 1 },
    planetPoints: { land: 8_000, ocean: 1_200 },
    starCount: 300,
    bloom: null,
    orbitCount: 2,
    satellites: { count: 6, trailLength: 0 },
    arcCount: 3,
    frameRate: 30,
    pointerGlow: false,
    fullIntro: false,
  },
} satisfies Record<"high" | "medium" | "low", SceneTierSettings>;

/**
 * Runtime quality: once the intro has handed over, the scene steps down for good whenever it
 * cannot keep up, one step at a time (see lib/sceneQuality.ts for the order of the steps).
 */
export const ADAPTIVE_QUALITY = {
  /** Frame rate a scene without a frame-rate cap should hold. */
  targetFps: 60,
  /** Seconds a fresh scene settles (shaders, first frames) before it is judged. */
  settleSeconds: 2,
  /** Seconds of frames averaged for each judgement. */
  sampleSeconds: 2.5,
  /** Step down when the average frame rate falls below this share of the target. */
  minRatio: 0.8,
  /** Seconds after a step before the scene is judged again, so one slow moment costs one step. */
  cooldownSeconds: 4,
  /** A frame longer than this (in seconds) is a pause, such as a hidden tab, not slowness. */
  maxFrameSeconds: 0.5,
  /** Shares the "fewer particles" step keeps. */
  planetShare: 0.6,
  satelliteShare: 0.5,
  arcShare: 0.5,
} as const;

/** Holding a scene to a lower frame rate (components/three/FrameLimiter.tsx). */
export const FRAME_LIMITER = {
  /** Milliseconds of slack per frame, so a display frame that arrives a touch early still counts. */
  slackMs: 2,
} as const;

/** Recovery from a lost WebGL context. */
export const SCENE_RECOVERY = {
  /**
   * Lost contexts the scene survives by starting over on a fresh canvas; one more and the static
   * planet takes over.
   */
  maxRemounts: 1,
  /** Milliseconds to wait for a lost context to return before giving up on it. */
  restoreTimeoutMs: 3000,
} as const;

/** The planet shown when there is no live scene (components/three/StaticPlanetFallback.tsx). */
export const STATIC_PLANET = {
  /** Set on <html> (by the boot script or once the scene fails) to show the static planet. */
  className: "scene-static",
  /** The hero planet and its atmosphere, rendered from the real scene onto black (square). */
  poster: "/planet-poster.webp",
  /** The poster spans this many planet diameters, leaving room for the atmosphere's glow. */
  posterScale: 1.3,
} as const;

export const CAMERA = {
  fov: 40,
  distance: 6,
} as const;

export const PLANET = {
  radius: 2,
  /** Earth's axial tilt (23.4°), in radians. */
  axialTilt: 0.41,
  /** Idle spin around the tilted axis, in radians per second. */
  rotationSpeed: 0.04,
  /** Point diameter in scene units, before perspective. */
  pointSize: {
    land: 0.05,
    ocean: 0.035,
  },
  opacity: {
    land: 0.9,
    ocean: 0.22,
  },
  /** Fixed seed for the per-point randomness (size, hue and the intro assembly order). */
  seed: 3,
} as const;

export const ATMOSPHERE = {
  /** Shell radius relative to the planet's. */
  radiusScale: 1.12,
  /** Peak opacity of the halo at the planet's edge; kept low so it reads as a thin atmosphere. */
  intensity: 0.11,
  /** Sphere segments; the halo is smooth, so this only needs to keep the silhouette round. */
  segments: 64,
} as const;

/** How the scene turns to follow the pointer or the device's tilt. The camera never moves. */
export const PARALLAX = {
  /** Globe rotation at full input, in radians, on top of the planet's own spin. */
  range: { x: 0.18, y: 0.28 },
  /** Orbits and satellites turn this much further than the planet, so the layers separate. */
  orbitFactor: 1.15,
  /** Stars turn the other way, by this share of the globe's rotation. */
  starFactor: -0.15,
  /** Damping rate of the smoothed input; higher settles faster. */
  damping: 3.5,
  /** Tilt away from the starting pose, in degrees, that counts as full input. */
  tiltRangeDegrees: 20,
} as const;

/** The planet brightens slightly on the side facing the pointer. */
export const POINTER_GLOW = {
  /** Extra brightness at the centre of the lit side. */
  strength: 0.55,
  /** Leans the lit side towards the viewer, so it stays on the visible face. */
  forwardBias: 0.9,
} as const;

export const STARS = {
  /** Radius of the shell the stars sit on, centred on the scene origin. */
  radius: 25,
  /** Half-angle of the patch of sky behind the planet that holds the stars, in radians. */
  spread: 1,
  /** Point diameter in CSS pixels. */
  size: { min: 1, max: 2 },
  opacity: 0.4,
  /** Share of stars tinted cyan or violet; the rest stay white. */
  tintedShare: 0.35,
  /** Twinkle speed, in radians of the brightness wave per second. */
  twinkleSpeed: 0.8,
  /** Fixed seed so the sky looks the same on every visit. */
  seed: 7,
} as const;

// Steep nodes keep the rings upright beside the planet, clear of the hero copy on the left.
export const ORBITS = {
  rings: [
    {
      radiusScale: 1.35,
      inclination: 0.6,
      node: -1.1,
      spinSpeed: 0.06,
      color: "cyan",
    },
    {
      radiusScale: 1.6,
      inclination: 0.75,
      node: 1.25,
      spinSpeed: -0.045,
      color: "violet",
    },
    {
      radiusScale: 1.9,
      inclination: 0.5,
      node: -1.4,
      spinSpeed: 0.03,
      color: "cyan",
    },
  ] satisfies OrbitRing[],
  /** Line segments per ring; enough that the ellipse never looks polygonal. */
  segments: 192,
  /** Opacity at the dimmest and brightest point along each ring. */
  opacity: { min: 0.04, max: 0.32 },
  /** Higher values shorten the bright stretch of each ring. */
  highlightSharpness: 4,
} as const;

export const SATELLITES = {
  /** Angular speed along the orbit, in radians per second. */
  speed: { min: 0.12, max: 0.28 },
  /** Share of satellites that travel against the others. */
  retrogradeShare: 0.35,
  /** Every nth satellite is drawn in the warm accent colour. */
  warmEvery: 5,
  /** Angle between trail samples, in radians. */
  trailSpacing: 0.016,
  /** Point diameter in scene units, before perspective. */
  size: { head: 0.085, trail: 0.05 },
  trailOpacity: 0.55,
  seed: 11,
} as const;

export const CITY_MARKERS = {
  /** Radius relative to the planet's; just off the surface so occlusion never clips them. */
  altitude: 1.006,
  /** Sprite diameter in scene units, large enough to hold the pulse ring. */
  size: 0.26,
  /** Pulse rings per second. */
  pulseSpeed: 0.45,
  /** Seconds for an arrival flash to fade. */
  flashSeconds: 0.9,
} as const;

export const DATA_ARCS = {
  /** Vertices along each arc. */
  segments: 64,
  /** Peak height above the surface per radian travelled, relative to the planet's radius. */
  liftPerRadian: 0.18,
  /** City pairs closer or further apart than this, in radians, are skipped. */
  distance: { min: 0.35, max: 2.2 },
  travelSeconds: { base: 0.8, perRadian: 0.9 },
  fadeSeconds: 0.9,
  /** Pause before a slot picks its next pair. */
  gapSeconds: { min: 0.3, max: 1.6 },
  /** Share of arcs drawn in violet; the rest are cyan. */
  violetShare: 0.3,
  /** Arcs held mid-flight when motion is reduced. */
  staticRoutes: [
    ["london", "newYork"],
    ["lagos", "dubai"],
    ["nairobi", "capeTown"],
  ] satisfies [CityId, CityId][],
  staticProgress: 0.72,
} as const;
