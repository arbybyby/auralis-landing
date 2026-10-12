import { DEVICE_TIER } from "@/lib/constants";

/**
 * How much 3D the device gets. "high", "medium" and "low" are budgets for the live scene (see
 * SCENE_TIERS); "none" means no WebGL2 on a real GPU, and the page shows the static planet.
 */
export type DeviceTier = "none" | "low" | "medium" | "high";

const TIERS: readonly DeviceTier[] = ["none", "low", "medium", "high"];

// deviceMemory and connection are Chromium-only, so the standard DOM types lack them.
interface NavigatorHints extends Navigator {
  deviceMemory?: number;
  connection?: { saveData?: boolean; effectiveType?: string };
}

type Listener = () => void;
const listeners = new Set<Listener>();
let cachedTier: DeviceTier | undefined;

function isTier(value: unknown): value is DeviceTier {
  return TIERS.some((tier) => tier === value);
}

function isOneOf(value: string | undefined, list: readonly string[]): boolean {
  return value !== undefined && list.includes(value);
}

function isBelow(limits: { cpuCores: number; memoryGb: number }): boolean {
  const { hardwareConcurrency, deviceMemory } = navigator as NavigatorHints;
  return (
    hardwareConcurrency < limits.cpuCores ||
    (deviceMemory !== undefined && deviceMemory < limits.memoryGb)
  );
}

/**
 * Whether WebGL2 runs on a real GPU. The context refuses to start where the browser would fall
 * back to a slow path, and the renderer's name catches software rasterisers that slip through.
 */
function hasGpuWebGL(): boolean {
  const gl = document
    .createElement("canvas")
    .getContext("webgl2", { failIfMajorPerformanceCaveat: true });
  if (!gl) return false;
  const debug = gl.getExtension("WEBGL_debug_renderer_info");
  const renderer = String(
    gl.getParameter(debug ? debug.UNMASKED_RENDERER_WEBGL : gl.RENDERER),
  );
  // Browsers allow only a few contexts at once; hand this one back now rather than at collection.
  gl.getExtension("WEBGL_lose_context")?.loseContext();
  return !DEVICE_TIER.softwareRenderers.test(renderer);
}

/**
 * Measures the device. The boot script (lib/intro.ts) repeats the GPU check and the signs of "low"
 * before first paint, so the two must stay in step.
 */
function detectTier(): DeviceTier {
  if (!hasGpuWebGL()) return "none";

  const { connection } = navigator as NavigatorHints;
  const { lowBelow, highFrom, lowConnections, mediumConnections } = DEVICE_TIER;
  if (
    connection?.saveData ||
    isOneOf(connection?.effectiveType, lowConnections) ||
    isBelow(lowBelow)
  ) {
    return "low";
  }

  const physicalPixels =
    window.screen.width * window.screen.height * window.devicePixelRatio ** 2;
  const atMostMedium =
    isBelow(highFrom) ||
    // Touch-first devices are phones and tablets, which throttle under sustained load.
    window.matchMedia("(pointer: coarse)").matches ||
    physicalPixels > DEVICE_TIER.maxHighTierPixels ||
    isOneOf(connection?.effectiveType, mediumConnections);
  return atMostMedium ? "medium" : "high";
}

/** Development only: `?tier=low` previews a tier. Production builds drop this branch entirely. */
function previewTier(): DeviceTier | undefined {
  if (process.env.NODE_ENV !== "development") return undefined;
  const requested = new URLSearchParams(window.location.search).get("tier");
  return isTier(requested) ? requested : undefined;
}

function storedTier(): DeviceTier | undefined {
  try {
    const stored = sessionStorage.getItem(DEVICE_TIER.storageKey);
    return isTier(stored) ? stored : undefined;
  } catch {
    return undefined;
  }
}

function rememberTier(tier: DeviceTier): void {
  cachedTier = tier;
  try {
    sessionStorage.setItem(DEVICE_TIER.storageKey, tier);
  } catch {
    // Storage can be unavailable (private modes); the next load simply measures again.
  }
}

/** Sets the tier for the rest of the session, such as "none" once the scene has failed for good. */
export function storeDeviceTier(tier: DeviceTier): void {
  rememberTier(tier);
  listeners.forEach((listener) => listener());
}

/** The device tier, measured once per session. For code outside React; components use the hook. */
export function getDeviceTier(): DeviceTier {
  if (cachedTier) return cachedTier;
  const preview = previewTier();
  if (preview) {
    cachedTier = preview;
    return preview;
  }
  const tier = storedTier() ?? detectTier();
  rememberTier(tier);
  return tier;
}

export function subscribeDeviceTier(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
