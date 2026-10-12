import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { ReactNode } from "react";
import type { Group } from "three";

import { INTRO } from "@/lib/intro";
import { introState } from "@/lib/introStore";
import { sceneCurrent } from "@/lib/sceneStore";

const { amplitude, frequency } = INTRO.camera.shake;

/**
 * Places its children where the current scroll state puts the globe. The intro moves the whole
 * system like a camera would: a wide shot, a drift after the leader, a shake and a pulse at the
 * swarm's peak. Every one of those ends at zero, so the intro lands exactly on the scroll state.
 */
export function ScrollGroup({ children }: { children: ReactNode }) {
  const groupRef = useRef<Group>(null);

  useFrame(() => {
    const group = groupRef.current;
    if (!group) return;
    const { time, shake, pulse } = introState;
    // Two sines at unrelated frequencies make a shake that is irregular yet smooth frame to frame.
    const shakeX = shake * amplitude * Math.sin(time * frequency.x);
    const shakeY = shake * amplitude * Math.cos(time * frequency.y);
    group.position.set(
      sceneCurrent.x + introState.wideX + introState.panX + shakeX,
      sceneCurrent.y + introState.wideY + introState.panY + shakeY,
      sceneCurrent.z + introState.wideZ,
    );
    group.scale.setScalar(sceneCurrent.scale * pulse);
    group.rotation.set(0, sceneCurrent.rotationY, introState.roll);
  });

  return <group ref={groupRef}>{children}</group>;
}
