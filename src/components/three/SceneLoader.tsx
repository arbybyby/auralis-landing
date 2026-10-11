"use client";

import dynamic from "next/dynamic";

import { useDeviceTier } from "@/hooks/useDeviceTier";

// Client-only, so three.js never reaches the server bundle.
const SceneCanvas = dynamic(
  () => import("@/components/three/SceneCanvas").then((mod) => mod.SceneCanvas),
  { ssr: false },
);

export function SceneLoader() {
  const tier = useDeviceTier();
  // The server, low-power devices and browsers without WebGL2 all report "low" and get no 3D layer.
  if (tier === "low") return null;
  return <SceneCanvas tier={tier} />;
}
