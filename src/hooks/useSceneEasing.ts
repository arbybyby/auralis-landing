import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { MathUtils } from "three";

import { SCENE_SCROLL } from "@/lib/constants";
import { copySceneState, SCENE_STATE_KEYS } from "@/lib/sceneStates";
import { sceneCurrent, sceneMotion, sceneTarget } from "@/lib/sceneStore";

/**
 * Eases the drawn scene state (`sceneCurrent`) towards the scroll target, and turns scroll speed
 * into a little extra planet spin. With motion reduced, the scene snaps to the target instead.
 * Must be used inside the canvas, once.
 */
export function useSceneEasing(animated: boolean): void {
  const hasStarted = useRef(false);
  const lastScrollY = useRef(0);

  // Runs ahead of every default-priority frame callback, so all of them draw this frame's state.
  useFrame((_, delta) => {
    const scrollY = window.scrollY;
    // The first frame starts on the target, so loading mid-page does not sweep in from the hero.
    if (!animated || !hasStarted.current) {
      copySceneState(sceneTarget, sceneCurrent);
      sceneMotion.spinBoost = 0;
      lastScrollY.current = scrollY;
      hasStarted.current = true;
      return;
    }

    for (const key of SCENE_STATE_KEYS) {
      sceneCurrent[key] = MathUtils.damp(
        sceneCurrent[key],
        sceneTarget[key],
        SCENE_SCROLL.damping,
        delta,
      );
    }

    // Screens per second, so the boost feels the same on any viewport height.
    const speed =
      Math.abs(scrollY - lastScrollY.current) /
      Math.max(delta, Number.EPSILON) /
      window.innerHeight;
    lastScrollY.current = scrollY;
    const boost = Math.min(
      speed * SCENE_SCROLL.velocitySpin,
      SCENE_SCROLL.maxVelocitySpin,
    );
    sceneMotion.spinBoost = MathUtils.damp(
      sceneMotion.spinBoost,
      boost,
      SCENE_SCROLL.damping,
      delta,
    );
  }, -2);
}
