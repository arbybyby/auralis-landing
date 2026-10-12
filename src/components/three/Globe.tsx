import type { RefObject } from "react";

import { Atmosphere } from "@/components/three/Atmosphere";
import { DataArcs } from "@/components/three/DataArcs";
import { getIntroPath } from "@/components/three/introMotion";
import { IntroShockwave } from "@/components/three/IntroShockwave";
import { IntroSpark } from "@/components/three/IntroSpark";
import { IntroTrail } from "@/components/three/IntroTrail";
import { Orbits } from "@/components/three/Orbits";
import { ParallaxGroup } from "@/components/three/ParallaxGroup";
import { Planet } from "@/components/three/Planet";
import { Satellites } from "@/components/three/Satellites";
import { ScrollGroup } from "@/components/three/ScrollGroup";
import { useIsDesktop } from "@/hooks/useIsDesktop";
import { useShaderWarmUp } from "@/hooks/useShaderWarmUp";
import type { ParallaxInput } from "@/hooks/usePointerParallax";
import { PARALLAX } from "@/lib/constants";
import type { PlanetPointCounts } from "@/lib/planetPoints";

interface GlobeProps {
  pointCounts: PlanetPointCounts;
  /** Share of the planet's points that are drawn. */
  planetShare: number;
  /** Whether the side facing the pointer lights up. */
  pointerGlow: boolean;
  rotationSpeed: number;
  orbitCount: number;
  satellites: { count: number; trailLength: number };
  /** Share of the satellites that are drawn, and whether they draw their trails. */
  satelliteShare: number;
  trails: boolean;
  arcCount: number;
  /** False holds orbits, satellites and arcs in a still composition. */
  animated: boolean;
  /** Whether the intro's spark, trail, shockwave and swarm are built at all. */
  introEffects: boolean;
  /** Smoothed pointer or tilt input the globe turns towards. */
  parallax: RefObject<ParallaxInput>;
}

/**
 * Everything that belongs to the planet shares one transform, so whatever moves the globe moves
 * it all: scroll places the system, the pointer turns it, and the planet spins inside. Markers and
 * arcs sit inside the planet's spin; orbits and satellites do not. The intro's spark, trail and
 * shockwave live in the same frame, so its camera moves carry them too.
 */
export function Globe({
  pointCounts,
  planetShare,
  pointerGlow,
  rotationSpeed,
  orbitCount,
  satellites,
  satelliteShare,
  trails,
  arcCount,
  animated,
  introEffects,
  parallax,
}: GlobeProps) {
  const introPath = getIntroPath(useIsDesktop() ? "desktop" : "mobile");
  // The globe mounts all at once, so by now every one of its shaders is in the scene.
  useShaderWarmUp();

  return (
    <ScrollGroup>
      {introEffects && (
        <>
          <IntroTrail path={introPath} />
          <IntroSpark path={introPath} />
          <IntroShockwave />
        </>
      )}
      <ParallaxGroup input={parallax}>
        <Planet
          pointCounts={pointCounts}
          share={planetShare}
          rotationSpeed={rotationSpeed}
          pointer={parallax}
          pointerGlow={pointerGlow}
          introPath={introPath}
          introSwarm={introEffects}
        >
          <DataArcs count={arcCount} animated={animated} />
        </Planet>
        <Atmosphere />
        {/* Nested, so the orbit layer turns a little further than the planet. */}
        <ParallaxGroup input={parallax} factor={PARALLAX.orbitFactor - 1}>
          <Orbits count={orbitCount} animated={animated} />
          <Satellites
            count={satellites.count}
            trailLength={satellites.trailLength}
            share={satelliteShare}
            trails={trails}
            orbitCount={orbitCount}
            animated={animated}
          />
        </ParallaxGroup>
      </ParallaxGroup>
    </ScrollGroup>
  );
}
