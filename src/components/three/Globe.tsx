import type { RefObject } from "react";

import { Atmosphere } from "@/components/three/Atmosphere";
import { DataArcs } from "@/components/three/DataArcs";
import { Orbits } from "@/components/three/Orbits";
import { ParallaxGroup } from "@/components/three/ParallaxGroup";
import { Planet } from "@/components/three/Planet";
import { Satellites } from "@/components/three/Satellites";
import { ScrollGroup } from "@/components/three/ScrollGroup";
import type { ParallaxInput } from "@/hooks/usePointerParallax";
import { PARALLAX } from "@/lib/constants";
import type { PlanetPointCounts } from "@/lib/planetPoints";

interface GlobeProps {
  pointCounts: PlanetPointCounts;
  rotationSpeed: number;
  orbitCount: number;
  satellites: { count: number; trailLength: number };
  arcCount: number;
  /** False holds orbits, satellites and arcs in a still composition. */
  animated: boolean;
  /** Smoothed pointer or tilt input the globe turns towards. */
  parallax: RefObject<ParallaxInput>;
}

/**
 * Everything that belongs to the planet shares one transform, so whatever moves the globe moves
 * it all: scroll places the system, the pointer turns it, and the planet spins inside. Markers and
 * arcs sit inside the planet's spin; orbits and satellites do not.
 */
export function Globe({
  pointCounts,
  rotationSpeed,
  orbitCount,
  satellites,
  arcCount,
  animated,
  parallax,
}: GlobeProps) {
  return (
    <ScrollGroup>
      <ParallaxGroup input={parallax}>
        <Planet
          pointCounts={pointCounts}
          rotationSpeed={rotationSpeed}
          pointer={parallax}
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
            orbitCount={orbitCount}
            animated={animated}
          />
        </ParallaxGroup>
      </ParallaxGroup>
    </ScrollGroup>
  );
}
