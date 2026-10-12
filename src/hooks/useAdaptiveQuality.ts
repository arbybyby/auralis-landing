import { useFrame } from "@react-three/fiber";
import { useRef } from "react";

import { ADAPTIVE_QUALITY } from "@/lib/constants";
import { INTRO } from "@/lib/intro";
import { introState, isIntroRunning } from "@/lib/introStore";
import { getQualityLevel, stepDownQuality } from "@/lib/qualityStore";
import type { SceneQuality } from "@/lib/sceneQuality";

interface FrameSample {
  /** Seconds before frames count again: time to settle, or a cooldown after a step. */
  wait: number;
  frames: number;
  /** Seconds the counted frames took. */
  elapsed: number;
}

/**
 * Watches the real frame rate once the page is settled and steps the scene's quality down a rung
 * whenever it falls short of `targetFps`. Never during the intro, which is meant to be heavy;
 * never back up; at most one step per cooldown. Must be used inside the canvas.
 */
export function useAdaptiveQuality(
  ladder: readonly SceneQuality[],
  targetFps: number,
  enabled: boolean,
): void {
  const sample = useRef<FrameSample>({
    wait: ADAPTIVE_QUALITY.settleSeconds,
    frames: 0,
    elapsed: 0,
  });

  useFrame((_, delta) => {
    const state = sample.current;
    // A long gap is a pause (a hidden tab, a paused canvas), not slowness: start over after it.
    const isSettled =
      enabled &&
      !isIntroRunning() &&
      introState.time >= INTRO.phases.end &&
      delta <= ADAPTIVE_QUALITY.maxFrameSeconds;
    if (!isSettled) {
      state.wait = ADAPTIVE_QUALITY.settleSeconds;
      state.frames = 0;
      state.elapsed = 0;
      return;
    }
    if (state.wait > 0) {
      state.wait -= delta;
      return;
    }

    state.frames += 1;
    state.elapsed += delta;
    if (state.elapsed < ADAPTIVE_QUALITY.sampleSeconds) return;
    const fps = state.frames / state.elapsed;
    state.frames = 0;
    state.elapsed = 0;
    if (fps >= targetFps * ADAPTIVE_QUALITY.minRatio) return;

    if (stepDownQuality(ladder.length - 1)) {
      state.wait = ADAPTIVE_QUALITY.cooldownSeconds;
      if (process.env.NODE_ENV === "development") {
        console.info(
          `[quality] ${fps.toFixed(1)} fps against ${targetFps}: ${ladder[getQualityLevel()].step}`,
        );
      }
    }
  });
}
