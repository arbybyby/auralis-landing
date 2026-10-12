"use client";

import dynamic from "next/dynamic";
import { useEffect, useSyncExternalStore } from "react";

import { SceneScrollDriver } from "@/components/SceneScrollDriver";
import { SceneErrorBoundary } from "@/components/three/SceneErrorBoundary";
import { useDeviceTier } from "@/hooks/useDeviceTier";
import { getDeviceTier } from "@/lib/deviceTier";
import {
  getSceneHealth,
  getServerSceneHealth,
  showStaticPlanet,
  subscribeSceneHealth,
} from "@/lib/sceneHealth";

// Client-only, so three.js never reaches the server bundle or the page's first load.
const SceneCanvas = dynamic(
  () => import("@/components/three/SceneCanvas").then((mod) => mod.SceneCanvas),
  { ssr: false },
);

/**
 * Mounts the live scene on devices that can run it. Everywhere else, and once the scene has failed
 * for good, the static planet shows instead (it is part of the hero, revealed by a class).
 */
export function SceneLoader() {
  const tier = useDeviceTier();
  const health = useSyncExternalStore(
    subscribeSceneHealth,
    getSceneHealth,
    getServerSceneHealth,
  );

  // The boot script has usually done this already; it can only guess before the app runs.
  useEffect(() => {
    if (getDeviceTier() === "none") showStaticPlanet();
  }, []);

  if (tier === "none" || health.failed) return null;
  return (
    <>
      <SceneScrollDriver />
      {/* A new key after a restored WebGL context starts the scene over on a fresh canvas. */}
      <SceneErrorBoundary key={health.generation}>
        <SceneCanvas tier={tier} />
      </SceneErrorBoundary>
    </>
  );
}
