"use client";

import { useInteractionMode } from "@/hooks/useInteractionMode";

interface InteractionHintProps {
  /** Shown when a mouse or pen steers the scene. */
  pointer: string;
  /** Shown on touch screens, where tilting the device steers it. */
  tilt: string;
}

/** Tells visitors how to steer the scene, or nothing when the scene does not react. */
export function InteractionHint({ pointer, tilt }: InteractionHintProps) {
  const mode = useInteractionMode();
  if (mode === "none") return null;
  return <span>{mode === "pointer" ? pointer : tilt}</span>;
}
