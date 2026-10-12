import { useSyncExternalStore } from "react";

import { getDeviceTier, subscribeDeviceTier } from "@/lib/deviceTier";
import type { DeviceTier } from "@/lib/deviceTier";

// The server cannot know the device, so it renders no scene; the browser decides after hydration.
function getServerSnapshot(): DeviceTier {
  return "none";
}

/** The device tier for components (see lib/deviceTier.ts). */
export function useDeviceTier(): DeviceTier {
  return useSyncExternalStore(
    subscribeDeviceTier,
    getDeviceTier,
    getServerSnapshot,
  );
}
