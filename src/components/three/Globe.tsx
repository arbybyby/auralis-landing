import { useThree } from "@react-three/fiber";

import { Atmosphere } from "@/components/three/Atmosphere";
import { Planet } from "@/components/three/Planet";
import { DESKTOP_MIN_WIDTH, GLOBE_LAYOUT } from "@/lib/constants";
import type { PlanetPointCounts } from "@/lib/planetPoints";

interface GlobeProps {
  pointCounts: PlanetPointCounts;
  rotationSpeed: number;
}

/** The planet and its atmosphere share one transform, so whatever moves the globe moves both. */
export function Globe({ pointCounts, rotationSpeed }: GlobeProps) {
  const isDesktop = useThree((state) => state.size.width >= DESKTOP_MIN_WIDTH);
  const layout = isDesktop ? GLOBE_LAYOUT.desktop : GLOBE_LAYOUT.mobile;

  return (
    <group position={[layout.x, layout.y, 0]} scale={layout.scale}>
      <Planet pointCounts={pointCounts} rotationSpeed={rotationSpeed} />
      <Atmosphere />
    </group>
  );
}
