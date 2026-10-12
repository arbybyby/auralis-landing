import { useThree } from "@react-three/fiber";
import { useEffect } from "react";

import { FRAME_LIMITER } from "@/lib/constants";

interface FrameLimiterProps {
  /** Frames per second to hold the scene to. */
  fps: number;
}

/**
 * Asks an on-demand canvas for a new frame at most `fps` times a second. Display frames arrive in
 * steps of about 16.7 ms, so a little slack keeps 30 fps from slipping to 20.
 */
export function FrameLimiter({ fps }: FrameLimiterProps) {
  const invalidate = useThree((state) => state.invalidate);

  useEffect(() => {
    const interval = 1000 / fps - FRAME_LIMITER.slackMs;
    let last = 0;
    let request = 0;
    const tick = (time: number) => {
      if (time - last >= interval) {
        last = time;
        invalidate();
      }
      request = requestAnimationFrame(tick);
    };
    request = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(request);
  }, [fps, invalidate]);

  return null;
}
