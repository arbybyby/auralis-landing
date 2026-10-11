// Devices below either threshold get the low-power (non-3D) experience.
export const LOW_POWER_LIMITS = {
  minCpuCores: 4,
  minMemoryGb: 4,
} as const;

// Devices below either threshold still get the 3D scene, with a lighter budget.
export const HIGH_POWER_LIMITS = {
  minCpuCores: 8,
  minMemoryGb: 8,
} as const;

/** Matches Tailwind's `lg` breakpoint (64rem). */
export const DESKTOP_MIN_WIDTH = 1024;

/** Mobile menu links rise in one after another once the overlay starts to fade in. */
export const MOBILE_MENU_REVEAL = {
  delayMs: 100,
  staggerMs: 50,
} as const;

/** Mirror --color-accent and --color-accent-2 in globals.css. */
export const BRAND_COLORS = {
  cyan: "#5ee7ff",
  violet: "#7c5cff",
} as const;

/**
 * Rendering budget per device tier. Low-tier devices get no 3D scene at all, so they have no entry.
 * The pixel-ratio cap is the main cost lever: every full-screen bloom pass scales with it.
 */
export const SCENE_TIERS = {
  high: {
    dpr: { min: 1, max: 1.75 },
    planetPoints: { land: 20_000, ocean: 3_000 },
    starCount: 1_200,
    bloom: { intensity: 0.9, luminanceThreshold: 0.15, radius: 0.7, levels: 8 },
  },
  medium: {
    dpr: { min: 1, max: 1.25 },
    planetPoints: { land: 12_000, ocean: 2_000 },
    starCount: 600,
    bloom: { intensity: 0.6, luminanceThreshold: 0.15, radius: 0.6, levels: 5 },
  },
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
} as const;

export const ATMOSPHERE = {
  /** Shell radius relative to the planet's. */
  radiusScale: 1.12,
  /** Peak opacity of the halo at the planet's edge; kept low so it reads as a thin atmosphere. */
  intensity: 0.11,
  /** Sphere segments; the halo is smooth, so this only needs to keep the silhouette round. */
  segments: 64,
} as const;

/** Where the planet and its atmosphere sit behind the hero, in scene units. */
export const GLOBE_LAYOUT = {
  // Far enough right that the headline and subtitle clear the planet from 1024px to 2560px wide.
  desktop: { x: 2.3, y: -0.25, scale: 0.9 },
  // Small and low, so the globe rises from behind the buttons instead of the subtitle.
  mobile: { x: 0, y: -2.2, scale: 0.62 },
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
