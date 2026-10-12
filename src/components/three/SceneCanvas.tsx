"use client";

import { Canvas } from "@react-three/fiber";
import type { RootState } from "@react-three/fiber";
import { lazy, Suspense, useEffect, useRef, useSyncExternalStore } from "react";

import { Effects } from "@/components/three/Effects";
import { Scene } from "@/components/three/Scene";
import type { DeviceTier } from "@/hooks/useDeviceTier";
import { usePageVisible } from "@/hooks/usePageVisible";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { CAMERA, SCENE_TIERS } from "@/lib/constants";
import { markIntroReady } from "@/lib/introStore";
import {
  getLayerOpacity,
  isLayerVisible,
  subscribeSceneTarget,
} from "@/lib/sceneStore";

interface SceneCanvasProps {
  tier: Exclude<DeviceTier, "low">;
}

// Everything drawn is a soft-edged sprite or halo, so hardware antialiasing would only cost fill rate.
const GL_OPTIONS = {
  antialias: false,
  alpha: true,
  powerPreference: "high-performance",
} as const;

const CAMERA_OPTIONS = {
  fov: CAMERA.fov,
  position: [0, 0, CAMERA.distance],
} as const;

// A static import would keep stats.js in the production bundle even when never rendered.
// Inside this branch the import is dropped from production builds entirely.
const DevStats =
  process.env.NODE_ENV === "development"
    ? lazy(() =>
        import("@/components/three/DevStats").then((mod) => ({
          default: mod.DevStats,
        })),
      )
    : null;

function markSceneReady(): void {
  markIntroReady("scene");
}

// The canvas only mounts in the browser, so the server answer is never used for rendering.
function layerVisibleOnServer(): boolean {
  return true;
}

function chooseFrameloop(
  isVisible: boolean,
  prefersReducedMotion: boolean,
): RootState["frameloop"] {
  // Hidden tab, or a scroll state that fades the layer out: stop drawing until it comes back.
  if (!isVisible) return "never";
  // A still scene only needs a new frame when something changes, such as a resize.
  return prefersReducedMotion ? "demand" : "always";
}

export function SceneCanvas({ tier }: SceneCanvasProps) {
  const isPageVisible = usePageVisible();
  const prefersReducedMotion = useReducedMotion();
  const settings = SCENE_TIERS[tier];
  const isLayerShown = useSyncExternalStore(
    subscribeSceneTarget,
    isLayerVisible,
    layerVisibleOnServer,
  );

  // Written straight to the element, so fading with the scroll never re-renders React and keeps
  // working while the canvas itself is paused.
  const layerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const applyOpacity = () => {
      if (layerRef.current) {
        layerRef.current.style.opacity = String(getLayerOpacity());
      }
    };
    applyOpacity();
    return subscribeSceneTarget(applyOpacity);
  }, []);

  return (
    // Sits below the sections' -z-10 glows so they blend over the planet.
    <div
      ref={layerRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-20"
    >
      <Canvas
        dpr={[settings.dpr.min, settings.dpr.max]}
        frameloop={chooseFrameloop(
          isPageVisible && isLayerShown,
          prefersReducedMotion,
        )}
        gl={GL_OPTIONS}
        camera={CAMERA_OPTIONS}
        onCreated={markSceneReady}
        // The canvas wrapper sets pointer-events itself, so the parent's class alone is not enough.
        style={{ pointerEvents: "none" }}
      >
        <Scene settings={settings} animated={!prefersReducedMotion} />
        <Effects bloom={settings.bloom} />
        {DevStats && (
          <Suspense fallback={null}>
            <DevStats />
          </Suspense>
        )}
      </Canvas>
    </div>
  );
}
