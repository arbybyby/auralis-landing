import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import type { RefObject } from "react";
import { MathUtils } from "three";

import { useInteractionMode } from "@/hooks/useInteractionMode";
import { PARALLAX } from "@/lib/constants";
import { isIntroRunning } from "@/lib/introStore";

export interface ParallaxInput {
  /** -1 at the left edge to 1 at the right. */
  x: number;
  /** -1 at the bottom edge to 1 at the top. */
  y: number;
  /** 1 while a mouse or pen is over the page, 0 once it leaves; always 0 for device tilt. */
  presence: number;
}

// iOS adds a static permission request that the standard DOM types do not declare.
type OrientationEventWithPermission = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<"granted" | "denied">;
};

const AT_REST: Readonly<ParallaxInput> = { x: 0, y: 0, presence: 0 };

function rest(input: ParallaxInput): void {
  input.x = 0;
  input.y = 0;
  input.presence = 0;
}

function listenToPointer(input: ParallaxInput, signal: AbortSignal): void {
  window.addEventListener(
    "pointermove",
    (event) => {
      if (event.pointerType === "touch") return;
      input.x = (event.clientX / window.innerWidth) * 2 - 1;
      input.y = 1 - (event.clientY / window.innerHeight) * 2;
      input.presence = 1;
    },
    { passive: true, signal },
  );
  // A pointerout with no element to go to means the pointer has left the window.
  window.addEventListener(
    "pointerout",
    (event) => {
      if (!event.relatedTarget) rest(input);
    },
    { passive: true, signal },
  );
  window.addEventListener("blur", () => rest(input), { signal });
}

function listenToTilt(input: ParallaxInput, signal: AbortSignal): void {
  let neutral: { beta: number; gamma: number } | undefined;

  window.addEventListener(
    "deviceorientation",
    ({ beta, gamma }) => {
      if (beta === null || gamma === null) return;
      // However the device is held at first counts as level.
      neutral ??= { beta, gamma };
      const range = PARALLAX.tiltRangeDegrees;
      input.x = MathUtils.clamp((gamma - neutral.gamma) / range, -1, 1);
      input.y = MathUtils.clamp((beta - neutral.beta) / range, -1, 1);
    },
    { passive: true, signal },
  );

  // Where motion access needs permission (iOS), events only start once it is granted, and the
  // request must come from a user gesture. Rather than prompt on load, ask on the first tap; if
  // the visitor declines or the request fails, no events arrive and the scene simply stays still.
  const { requestPermission } =
    DeviceOrientationEvent as OrientationEventWithPermission;
  if (!requestPermission) return;
  window.addEventListener(
    "touchend",
    () => {
      requestPermission.call(DeviceOrientationEvent).catch(() => undefined);
    },
    { once: true, passive: true, signal },
  );
}

/**
 * Pointer position (or device tilt on touch screens) as a smoothed -1..1 vector, kept in a ref so
 * reading it never re-renders. It eases back to rest when the pointer leaves the window, and stays
 * at rest with no listeners at all when motion is reduced. Must be used inside the canvas.
 */
export function usePointerParallax(): RefObject<ParallaxInput> {
  const mode = useInteractionMode();
  const target = useRef<ParallaxInput>({ x: 0, y: 0, presence: 0 });
  const smoothed = useRef<ParallaxInput>({ x: 0, y: 0, presence: 0 });

  useEffect(() => {
    const input = target.current;
    if (mode === "none") return;

    const listeners = new AbortController();
    if (mode === "pointer") listenToPointer(input, listeners.signal);
    else listenToTilt(input, listeners.signal);

    return () => {
      listeners.abort();
      rest(input);
    };
  }, [mode]);

  // A negative priority runs before every default-priority frame callback, so whatever reads the
  // input sees this frame's value. Without it, a still frame could hold a stale offset.
  useFrame((_, delta) => {
    const from = smoothed.current;
    // The intro owns the globe until it hands over; the pointer then eases in from rest.
    const to = isIntroRunning() ? AT_REST : target.current;
    if (mode === "none") {
      rest(from);
      return;
    }
    from.x = MathUtils.damp(from.x, to.x, PARALLAX.damping, delta);
    from.y = MathUtils.damp(from.y, to.y, PARALLAX.damping, delta);
    from.presence = MathUtils.damp(
      from.presence,
      to.presence,
      PARALLAX.damping,
      delta,
    );
  }, -1);

  return smoothed;
}
