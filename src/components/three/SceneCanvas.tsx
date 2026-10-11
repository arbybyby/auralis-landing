"use client";

import { Canvas } from "@react-three/fiber";
import type { RootState } from "@react-three/fiber";
import { lazy, Suspense } from "react";

import { Effects } from "@/components/three/Effects";
import { Globe } from "@/components/three/Globe";
import { Stars } from "@/components/three/Stars";
import type { DeviceTier } from "@/hooks/useDeviceTier";
import { usePageVisible } from "@/hooks/usePageVisible";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { CAMERA, PLANET, SCENE_TIERS, STARS } from "@/lib/constants";

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

function chooseFrameloop(
  isPageVisible: boolean,
  prefersReducedMotion: boolean,
): RootState["frameloop"] {
  if (!isPageVisible) return "never";
  // A still scene only needs a new frame when something changes, such as a resize.
  return prefersReducedMotion ? "demand" : "always";
}

export function SceneCanvas({ tier }: SceneCanvasProps) {
  const isPageVisible = usePageVisible();
  const prefersReducedMotion = useReducedMotion();
  const settings = SCENE_TIERS[tier];

  return (
    // Sits below the sections' -z-10 glows so they blend over the planet.
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-20">
      <Canvas
        dpr={[settings.dpr.min, settings.dpr.max]}
        frameloop={chooseFrameloop(isPageVisible, prefersReducedMotion)}
        gl={GL_OPTIONS}
        camera={CAMERA_OPTIONS}
        // The canvas wrapper sets pointer-events itself, so the parent's class alone is not enough.
        style={{ pointerEvents: "none" }}
      >
        <Stars
          count={settings.starCount}
          twinkleSpeed={prefersReducedMotion ? 0 : STARS.twinkleSpeed}
        />
        <Suspense fallback={null}>
          <Globe
            pointCounts={settings.planetPoints}
            rotationSpeed={prefersReducedMotion ? 0 : PLANET.rotationSpeed}
          />
        </Suspense>
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
