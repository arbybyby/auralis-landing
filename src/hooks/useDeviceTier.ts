import { useSyncExternalStore } from "react";

import { HIGH_POWER_LIMITS, LOW_POWER_LIMITS } from "@/lib/constants";

export type DeviceTier = "high" | "medium" | "low";

interface HardwareLimits {
  minCpuCores: number;
  minMemoryGb: number;
}

// deviceMemory is Chromium-only, so it is missing from the standard DOM types.
interface NavigatorWithMemory extends Navigator {
  deviceMemory?: number;
}

let cachedTier: DeviceTier | undefined;

function supportsWebGL2(): boolean {
  return document.createElement("canvas").getContext("webgl2") !== null;
}

function isBelow(limits: HardwareLimits): boolean {
  const { hardwareConcurrency, deviceMemory } =
    navigator as NavigatorWithMemory;
  const isWeakCpu = hardwareConcurrency < limits.minCpuCores;
  const isLowMemory =
    deviceMemory !== undefined && deviceMemory < limits.minMemoryGb;

  return isWeakCpu || isLowMemory;
}

function detectTier(): DeviceTier {
  if (!supportsWebGL2() || isBelow(LOW_POWER_LIMITS)) return "low";
  return isBelow(HIGH_POWER_LIMITS) ? "medium" : "high";
}

// Hardware does not change during a session, so there is nothing to subscribe to.
function subscribe(): () => void {
  return () => {};
}

/** The device tier, for browser code outside React rendering (the hook is for components). */
export function getDeviceTier(): DeviceTier {
  cachedTier ??= detectTier();
  return cachedTier;
}

// Render the low-power fallback on the server; capable devices upgrade after hydration.
function getServerSnapshot(): DeviceTier {
  return "low";
}

export function useDeviceTier(): DeviceTier {
  return useSyncExternalStore(subscribe, getDeviceTier, getServerSnapshot);
}
