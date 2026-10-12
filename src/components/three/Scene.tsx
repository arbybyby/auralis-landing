import { useThree } from "@react-three/fiber";
import { Suspense, useEffect } from "react";

import { Globe } from "@/components/three/Globe";
import { ParallaxGroup } from "@/components/three/ParallaxGroup";
import { Stars } from "@/components/three/Stars";
import { useAdaptiveQuality } from "@/hooks/useAdaptiveQuality";
import { usePointerParallax } from "@/hooks/usePointerParallax";
import { useSceneEasing } from "@/hooks/useSceneEasing";
import { ADAPTIVE_QUALITY, PARALLAX, PLANET, STARS } from "@/lib/constants";
import type { SceneTierSettings } from "@/lib/constants";
import type { SceneQuality } from "@/lib/sceneQuality";
import { subscribeSceneTarget } from "@/lib/sceneStore";

interface SceneProps {
  settings: SceneTierSettings;
  /** The rung of the quality ladder the scene is on, and the whole ladder below it. */
  quality: SceneQuality;
  ladder: readonly SceneQuality[];
  /** False holds every animation and ignores pointer and tilt input. */
  animated: boolean;
}

/** Everything inside the canvas, placed by scroll and steered by one shared pointer or tilt input. */
export function Scene({ settings, quality, ladder, animated }: SceneProps) {
  const parallax = usePointerParallax();
  useSceneEasing(animated);
  // A still scene draws only on demand, so its frame rate says nothing about the device.
  useAdaptiveQuality(
    ladder,
    settings.frameRate ?? ADAPTIVE_QUALITY.targetFps,
    animated,
  );

  // A still scene only renders on demand, so a new scroll state has to ask for a frame.
  const invalidate = useThree((state) => state.invalidate);
  useEffect(() => subscribeSceneTarget(() => invalidate()), [invalidate]);

  return (
    <>
      <ParallaxGroup input={parallax} factor={PARALLAX.starFactor}>
        <Stars
          count={settings.starCount}
          twinkleSpeed={animated ? STARS.twinkleSpeed : 0}
        />
      </ParallaxGroup>
      <Suspense fallback={null}>
        <Globe
          pointCounts={settings.planetPoints}
          planetShare={quality.planetShare}
          pointerGlow={settings.pointerGlow}
          rotationSpeed={animated ? PLANET.rotationSpeed : 0}
          orbitCount={settings.orbitCount}
          satellites={settings.satellites}
          satelliteShare={quality.satelliteShare}
          trails={quality.trails}
          arcCount={quality.arcCount}
          animated={animated}
          introEffects={settings.fullIntro}
          parallax={parallax}
        />
      </Suspense>
    </>
  );
}
