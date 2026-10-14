import type { RefObject } from "react";

import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { MARQUEE } from "@/lib/motion";

/**
 * Speeds a CSS marquee up a little while the page scrolls fast, then eases it back. It changes
 * the running animation's playback rate, so the loop keeps its place. With reduced motion the
 * track has no animation, and there is nothing to do.
 */
export function useMarqueeBoost(trackRef: RefObject<HTMLElement | null>): void {
  useGSAP(
    () => {
      const animation = trackRef.current?.getAnimations()[0];
      if (!animation) return;

      const { fullAtVelocity, max, rise, settle, ease } = MARQUEE.boost;
      const speed = { rate: 1 };
      const apply = () => animation.updatePlaybackRate(speed.rate);
      const settleBack = () => {
        gsap.to(speed, { rate: 1, duration: settle, ease, onUpdate: apply });
      };

      ScrollTrigger.create({
        start: 0,
        end: "max",
        onUpdate: (self) => {
          const share = Math.min(
            Math.abs(self.getVelocity()) / fullAtVelocity,
            1,
          );
          gsap.to(speed, {
            rate: 1 + share * max,
            duration: rise,
            ease,
            overwrite: true,
            onUpdate: apply,
            onComplete: settleBack,
          });
        },
      });
    },
    { scope: trackRef },
  );
}
