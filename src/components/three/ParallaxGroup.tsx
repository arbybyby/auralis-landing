import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { ReactNode, RefObject } from "react";
import type { Group } from "three";

import type { ParallaxInput } from "@/hooks/usePointerParallax";
import { PARALLAX } from "@/lib/constants";

interface ParallaxGroupProps {
  input: RefObject<ParallaxInput>;
  /** Share of the full parallax range; negative turns against the pointer. */
  factor?: number;
  children: ReactNode;
}

/** Turns its children towards the pointer: up and down about X, left and right about Y. */
export function ParallaxGroup({
  input,
  factor = 1,
  children,
}: ParallaxGroupProps) {
  const groupRef = useRef<Group>(null);

  useFrame(() => {
    const group = groupRef.current;
    if (!group) return;
    group.rotation.x = -input.current.y * PARALLAX.range.x * factor;
    group.rotation.y = input.current.x * PARALLAX.range.y * factor;
  });

  return <group ref={groupRef}>{children}</group>;
}
