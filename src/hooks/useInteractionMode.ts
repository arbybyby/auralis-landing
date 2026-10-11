import { useSyncExternalStore } from "react";

import { useDeviceTier } from "@/hooks/useDeviceTier";
import { useReducedMotion } from "@/hooks/useReducedMotion";

/** How the visitor can steer the scene: with a mouse or pen, by tilting the device, or not at all. */
export type InteractionMode = "pointer" | "tilt" | "none";

const FINE_POINTER_QUERY = "(pointer: fine)";

function subscribe(onChange: () => void): () => void {
  const query = window.matchMedia(FINE_POINTER_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

// Touch screens almost always come with a gyroscope; whether it reports anything is only known
// once events arrive (on iOS, after permission), so the API's presence is the best early signal.
function getSnapshot(): InteractionMode {
  if (window.matchMedia(FINE_POINTER_QUERY).matches) return "pointer";
  return "DeviceOrientationEvent" in window ? "tilt" : "none";
}

// The server cannot know the input device, so interaction starts after hydration.
function getServerSnapshot(): InteractionMode {
  return "none";
}

export function useInteractionMode(): InteractionMode {
  const input = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const prefersReducedMotion = useReducedMotion();
  const tier = useDeviceTier();

  // Reduced motion turns interaction off, and low-power devices have no 3D scene to steer.
  return prefersReducedMotion || tier === "low" ? "none" : input;
}
