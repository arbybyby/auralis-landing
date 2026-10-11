import { Suspense } from "react";

import { Globe } from "@/components/three/Globe";
import { ParallaxGroup } from "@/components/three/ParallaxGroup";
import { Stars } from "@/components/three/Stars";
import { usePointerParallax } from "@/hooks/usePointerParallax";
import { PARALLAX, PLANET, SCENE_TIERS, STARS } from "@/lib/constants";

interface SceneProps {
  settings: (typeof SCENE_TIERS)[keyof typeof SCENE_TIERS];
  /** False holds every animation and ignores pointer and tilt input. */
  animated: boolean;
}

/** Everything inside the canvas, steered by one shared pointer or tilt input. */
export function Scene({ settings, animated }: SceneProps) {
  const parallax = usePointerParallax();

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
          rotationSpeed={animated ? PLANET.rotationSpeed : 0}
          orbitCount={settings.orbitCount}
          satellites={settings.satellites}
          arcCount={settings.arcCount}
          animated={animated}
          parallax={parallax}
        />
      </Suspense>
    </>
  );
}
