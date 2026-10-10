import { useSyncExternalStore } from "react";

import { LOW_POWER_LIMITS } from "@/lib/constants";

export type DeviceTier = "high" | "low";

// deviceMemory is Chromium-only, so it is missing from the standard DOM types.
interface NavigatorWithMemory extends Navigator {
  deviceMemory?: number;
}

let cachedTier: DeviceTier | undefined;

function supportsWebGL2(): boolean {
  return document.createElement("canvas").getContext("webgl2") !== null;
}

function detectTier(): DeviceTier {
  const { hardwareConcurrency, deviceMemory } =
    navigator as NavigatorWithMemory;
  const isWeakCpu = hardwareConcurrency < LOW_POWER_LIMITS.minCpuCores;
  const isLowMemory =
    deviceMemory !== undefined && deviceMemory < LOW_POWER_LIMITS.minMemoryGb;

  return isWeakCpu || isLowMemory || !supportsWebGL2() ? "low" : "high";
}

// Hardware does not change during a session, so there is nothing to subscribe to.
function subscribe(): () => void {
  return () => {};
}

function getSnapshot(): DeviceTier {
  cachedTier ??= detectTier();
  return cachedTier;
}

// Render the low-power fallback on the server; capable devices upgrade after hydration.
function getServerSnapshot(): DeviceTier {
  return "low";
}

export function useDeviceTier(): DeviceTier {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
