/**
 * Timing for the page's scroll motion: every duration, offset and easing the reveals, the counters
 * and the marquee use. Durations are in seconds unless a name says otherwise; eases are GSAP ease
 * names. The CSS-only hover effects keep their timings in globals.css, beside the rules using them.
 */

/** Matches when the visitor has not asked for reduced motion: the only time anything moves. */
export const MOTION_ALLOWED_QUERY = "(prefers-reduced-motion: no-preference)";

interface Tween {
  duration: number;
  ease: string;
}

interface RevealMotion extends Tween {
  /** ScrollTrigger start: the point at which an element counts as scrolled into view. */
  start: string;
  /** Pixels that fade-up and scale-in elements rise into place. */
  rise: number;
  /** Scale that scale-in elements grow from. */
  scaleFrom: number;
  /** Delay between elements that reveal together, such as the cards of one row. */
  stagger: number;
  /** mask-line: words rise from below their masks (a percentage of their own height), line by line. */
  line: Tween & { rise: number; stagger: number };
  /** sequence: how long before the previous step ends the next one starts. */
  sequenceOverlap: number;
  /** eyebrow: a hairline draws in under the label, holds, then fades away. */
  eyebrow: { draw: number; hold: number; fade: number; fadeEase: string };
  /** The reveals start once the browser is idle after the load, or after this long at the latest. */
  startTimeoutMs: number;
  /** If the reveals have not finished starting up by now, every element is shown instead. */
  safetyTimeoutMs: number;
}

export const REVEAL = {
  // clamp() keeps the point reachable for elements so near the end of the page that "top 85%"
  // would lie past the furthest the page can scroll.
  start: "clamp(top 85%)",
  duration: 0.9,
  ease: "power3.out",
  rise: 28,
  scaleFrom: 0.96,
  stagger: 0.09,
  line: { rise: 135, duration: 1, ease: "power4.out", stagger: 0.1 },
  sequenceOverlap: 0.35,
  eyebrow: { draw: 0.9, hold: 0.5, fade: 0.6, fadeEase: "power1.out" },
  startTimeoutMs: 2000,
  safetyTimeoutMs: 6000,
} as const satisfies RevealMotion;

/** Stats counting up from zero (components/ui/CountUp.tsx). */
export const COUNT_UP = {
  duration: 1.8,
  ease: "power3.out",
} as const satisfies Tween;

interface MarqueeMotion {
  /** Seconds for the track to travel one copy of the list. */
  loopSeconds: number;
  /** Fast scrolling speeds the loop up by as much as `max` (added to the playback rate). */
  boost: {
    /** Scroll speed, in pixels per second, that earns the full boost. */
    fullAtVelocity: number;
    max: number;
    /** Seconds to reach the boost, then to settle back to normal speed. */
    rise: number;
    settle: number;
    ease: string;
  };
}

/** The partner marquee in the trust strip (components/ui/Marquee.tsx). */
export const MARQUEE = {
  loopSeconds: 40,
  boost: {
    fullAtVelocity: 3000,
    max: 1.5,
    rise: 0.25,
    settle: 1.2,
    ease: "power2.out",
  },
} as const satisfies MarqueeMotion;
