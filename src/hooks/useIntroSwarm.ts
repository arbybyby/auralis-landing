import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import type { RefObject } from "react";
import { Color, Matrix3, Matrix4, Vector3 } from "three";
import type { Group, ShaderMaterial } from "three";

import { PATH_POINTS, SWARM_END } from "@/components/three/introMotion";
import type { IntroPath } from "@/components/three/introMotion";
import { PLANET } from "@/lib/constants";
import { INTRO } from "@/lib/intro";
import { introState } from "@/lib/introStore";

// Reused every frame to build uToPlanet, so the frame loop allocates nothing.
const tilt = new Matrix4().makeRotationZ(PLANET.axialTilt);
const spin = new Matrix4();
const globeToPlanet = new Matrix4();

function createSwarmUniforms() {
  return {
    uIntro: { value: 0 },
    uTime: { value: 0 },
    uPath: { value: Array.from({ length: PATH_POINTS }, () => new Vector3()) },
    uDiskU: { value: new Vector3() },
    uDiskV: { value: new Vector3() },
    uDiskNormal: { value: new Vector3() },
    uSwarmRadii: { value: new Vector3() },
    uEntrySpeed: { value: 0 },
    uSwarmShare: { value: 1 },
    uEnergy: { value: 0 },
    uToPlanet: { value: new Matrix3() },
    uColorHot: { value: new Color(INTRO.swarm.hotColor) },
  };
}

/** The shader defines the swarm needs: the switch that compiles it in, and its path's length. */
export const SWARM_DEFINES = { INTRO_SWARM: true, PATH_POINTS };

/**
 * Flies the planet's points through the intro. Returns the uniforms to merge into the planet's
 * material, then keeps them in step: the layout's path and disk whenever the layout changes, and
 * the timeline's clock and the planet's current spin every frame.
 */
export function useIntroSwarm(
  materialRef: RefObject<ShaderMaterial | null>,
  spinRef: RefObject<Group | null>,
  path: IntroPath,
) {
  const uniforms = useMemo(() => createSwarmUniforms(), []);

  useEffect(() => {
    const material = materialRef.current;
    if (!material) return;
    const { uniforms: swarm } = material;
    path.points.forEach((point, index) => swarm.uPath.value[index].copy(point));
    swarm.uDiskU.value.copy(path.diskU);
    swarm.uDiskV.value.copy(path.diskV);
    swarm.uDiskNormal.value.copy(path.diskNormal);
    swarm.uSwarmRadii.value.copy(path.radii);
    swarm.uEntrySpeed.value = path.entrySpeed;
    swarm.uSwarmShare.value = path.layout.swarmShare;
  }, [materialRef, path]);

  useFrame(() => {
    const material = materialRef.current;
    const spinGroup = spinRef.current;
    if (!material || !spinGroup) return;
    const { uniforms: swarm } = material;
    swarm.uIntro.value = introState.time < SWARM_END ? 1 : 0;
    if (!swarm.uIntro.value) return;
    swarm.uTime.value = introState.time;
    swarm.uEnergy.value = introState.energy;
    // The swarm is laid out in the globe's frame; the points live inside the planet's tilt and
    // spin, so the inverse of those two rotations carries one into the other.
    globeToPlanet.multiplyMatrices(
      tilt,
      spin.makeRotationY(spinGroup.rotation.y),
    );
    swarm.uToPlanet.value.setFromMatrix4(globeToPlanet).transpose();
  });

  return uniforms;
}
