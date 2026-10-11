import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { ReactNode } from "react";
import type { Group } from "three";

import { sceneCurrent } from "@/lib/sceneStore";

/** Places its children where the current scroll state puts the globe. */
export function ScrollGroup({ children }: { children: ReactNode }) {
  const groupRef = useRef<Group>(null);

  useFrame(() => {
    const group = groupRef.current;
    if (!group) return;
    group.position.set(sceneCurrent.x, sceneCurrent.y, sceneCurrent.z);
    group.scale.setScalar(sceneCurrent.scale);
    group.rotation.y = sceneCurrent.rotationY;
  });

  return <group ref={groupRef}>{children}</group>;
}
