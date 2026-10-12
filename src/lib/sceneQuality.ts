import { ADAPTIVE_QUALITY } from "@/lib/constants";
import type { BloomSettings, SceneTierSettings } from "@/lib/constants";

/**
 * The steps the scene takes down, in order, when it cannot keep its frame rate: lower resolution,
 * then no bloom, then fewer particles, satellites and arcs, then no satellite trails.
 */
export type QualityStep =
  "full" | "resolution" | "bloom" | "particles" | "trails";

/** What the scene draws at one level of quality. */
export interface SceneQuality {
  step: QualityStep;
  dpr: { min: number; max: number };
  bloom: BloomSettings | null;
  /** Shares of the planet's points and of the satellites that are drawn. */
  planetShare: number;
  satelliteShare: number;
  arcCount: number;
  trails: boolean;
}

function withStep(
  quality: SceneQuality,
  step: QualityStep,
  settings: SceneTierSettings,
): SceneQuality {
  switch (step) {
    case "resolution":
      return {
        ...quality,
        step,
        dpr: { min: settings.dpr.min, max: settings.dpr.min },
      };
    case "bloom":
      return { ...quality, step, bloom: null };
    case "particles":
      return {
        ...quality,
        step,
        planetShare: ADAPTIVE_QUALITY.planetShare,
        satelliteShare: ADAPTIVE_QUALITY.satelliteShare,
        arcCount: Math.max(
          1,
          Math.round(settings.arcCount * ADAPTIVE_QUALITY.arcShare),
        ),
      };
    case "trails":
      return { ...quality, step, trails: false };
    case "full":
      return quality;
  }
}

/** The pixel ratio a range gives on a screen, worked out the way R3F does. */
function resolveDpr(dpr: SceneQuality["dpr"], pixelRatio: number): number {
  return Math.min(Math.max(pixelRatio, dpr.min), dpr.max);
}

function isSame(a: SceneQuality, b: SceneQuality, pixelRatio: number): boolean {
  return (
    resolveDpr(a.dpr, pixelRatio) === resolveDpr(b.dpr, pixelRatio) &&
    a.bloom === b.bloom &&
    a.planetShare === b.planetShare &&
    a.satelliteShare === b.satelliteShare &&
    a.arcCount === b.arcCount &&
    a.trails === b.trails
  );
}

/**
 * Every level of quality a tier can drop to on a screen, best first. Steps that would change
 * nothing there (no bloom to turn off on "low", or a lower resolution on a screen that is already
 * at a pixel ratio of 1) are left out, so each step down is a real one.
 */
export function buildQualityLadder(
  settings: SceneTierSettings,
  pixelRatio: number,
): readonly SceneQuality[] {
  const ladder: SceneQuality[] = [
    {
      step: "full",
      dpr: settings.dpr,
      bloom: settings.bloom,
      planetShare: 1,
      satelliteShare: 1,
      arcCount: settings.arcCount,
      trails: settings.satellites.trailLength > 0,
    },
  ];
  const steps: QualityStep[] = ["resolution", "bloom", "particles", "trails"];
  for (const step of steps) {
    const last = ladder[ladder.length - 1];
    const next = withStep(last, step, settings);
    if (!isSame(last, next, pixelRatio)) ladder.push(next);
  }
  return ladder;
}
