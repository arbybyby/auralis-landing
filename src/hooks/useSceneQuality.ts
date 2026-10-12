import { useMemo, useSyncExternalStore } from "react";

import type { SceneTierSettings } from "@/lib/constants";
import { getQualityLevel, subscribeQuality } from "@/lib/qualityStore";
import { buildQualityLadder } from "@/lib/sceneQuality";

// The canvas only renders in the browser; the server never sees a step down.
function getServerQualityLevel(): number {
  return 0;
}

/** The tier's quality ladder on this screen, and the rung the scene is on now. Browser only. */
export function useSceneQuality(settings: SceneTierSettings) {
  const ladder = useMemo(
    () => buildQualityLadder(settings, window.devicePixelRatio),
    [settings],
  );
  const level = useSyncExternalStore(
    subscribeQuality,
    getQualityLevel,
    getServerQualityLevel,
  );
  return { ladder, quality: ladder[Math.min(level, ladder.length - 1)] };
}
