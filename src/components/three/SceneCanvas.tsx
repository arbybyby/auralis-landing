"use client";

import { Canvas } from "@react-three/fiber";
import type { RootState } from "@react-three/fiber";
import {
  lazy,
  Suspense,
  useEffect,
  useLayoutEffect,
  useRef,
  useSyncExternalStore,
} from "react";

import { FrameLimiter } from "@/components/three/FrameLimiter";
import { Scene } from "@/components/three/Scene";
import { usePageVisible } from "@/hooks/usePageVisible";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useSceneQuality } from "@/hooks/useSceneQuality";
import { CAMERA, SCENE_TIERS } from "@/lib/constants";
import type { DeviceTier } from "@/lib/deviceTier";
import { markIntroReady } from "@/lib/introStore";
import {
  getSceneHealth,
  getServerSceneHealth,
  reportContextLost,
  reportContextRestored,
  subscribeSceneHealth,
} from "@/lib/sceneHealth";
import {
  getLayerOpacity,
  isLayerVisible,
  subscribeSceneTarget,
} from "@/lib/sceneStore";

interface SceneCanvasProps {
  tier: Exclude<DeviceTier, "none">;
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

// Postprocessing loads only for tiers that bloom, in its own chunk, after the scene itself.
const Effects = lazy(() =>
  import("@/components/three/Effects").then((mod) => ({
    default: mod.Effects,
  })),
);

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

function onContextLost(event: Event): void {
  // Without this the browser never tries to bring the context back.
  event.preventDefault();
  reportContextLost();
}

function handleCreated(): void {
  markIntroReady("scene");
}

// The canvas only mounts in the browser, so the server answer is never used for rendering.
function layerVisibleOnServer(): boolean {
  return true;
}

function chooseFrameloop(
  isRunning: boolean,
  prefersReducedMotion: boolean,
  frameRate: number | null,
): RootState["frameloop"] {
  // Hidden tab, a scroll state that fades the layer out, or a lost context: stop drawing.
  if (!isRunning) return "never";
  // A still scene, or one held to a lower frame rate, draws only when asked to.
  return prefersReducedMotion || frameRate !== null ? "demand" : "always";
}

export function SceneCanvas({ tier }: SceneCanvasProps) {
  const isPageVisible = usePageVisible();
  const prefersReducedMotion = useReducedMotion();
  const settings = SCENE_TIERS[tier];
  const { ladder, quality } = useSceneQuality(settings);
  const isLayerShown = useSyncExternalStore(
    subscribeSceneTarget,
    isLayerVisible,
    layerVisibleOnServer,
  );
  const { contextLost } = useSyncExternalStore(
    subscribeSceneHealth,
    getSceneHealth,
    getServerSceneHealth,
  );
  const isRunning = isPageVisible && isLayerShown && !contextLost;

  // Listens on the canvas element itself, and stops before the canvas unmounts: tearing the
  // renderer down loses its context on purpose, and that must not count as a failure.
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let wasRestored = false;
    const onContextRestored = () => {
      wasRestored = true;
      reportContextRestored();
    };
    canvas.addEventListener("webglcontextlost", onContextLost);
    canvas.addEventListener("webglcontextrestored", onContextRestored);
    return () => {
      canvas.removeEventListener("webglcontextlost", onContextLost);
      canvas.removeEventListener("webglcontextrestored", onContextRestored);
      // A restored context is thrown away for a fresh canvas. Losing it again first makes the
      // teardown's deletes of GPU objects from before the loss silent; otherwise each one warns.
      if (wasRestored) {
        canvas
          .getContext("webgl2")
          ?.getExtension("WEBGL_lose_context")
          ?.loseContext();
      }
    };
  }, []);

  // Without bloom there is nothing for the intro to wait for on that count.
  useEffect(() => {
    if (!quality.bloom) markIntroReady("effects");
  }, [quality.bloom]);

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
        ref={canvasRef}
        dpr={[quality.dpr.min, quality.dpr.max]}
        frameloop={chooseFrameloop(
          isRunning,
          prefersReducedMotion,
          settings.frameRate,
        )}
        gl={GL_OPTIONS}
        camera={CAMERA_OPTIONS}
        onCreated={handleCreated}
        // The canvas wrapper sets pointer-events itself, so the parent's class alone is not enough.
        style={{ pointerEvents: "none" }}
      >
        <Scene
          settings={settings}
          quality={quality}
          ladder={ladder}
          animated={!prefersReducedMotion}
        />
        {settings.frameRate !== null && !prefersReducedMotion && (
          <FrameLimiter fps={settings.frameRate} />
        )}
        {quality.bloom && (
          <Suspense fallback={null}>
            <Effects bloom={quality.bloom} />
          </Suspense>
        )}
        {DevStats && (
          <Suspense fallback={null}>
            <DevStats />
          </Suspense>
        )}
      </Canvas>
    </div>
  );
}
