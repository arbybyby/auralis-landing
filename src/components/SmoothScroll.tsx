"use client";

import Lenis from "lenis";
import { useEffect } from "react";

import { useReducedMotion } from "@/hooks/useReducedMotion";
import { SMOOTH_SCROLL } from "@/lib/constants";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { isIntroRunning } from "@/lib/introStore";
import { scrollToElement, setSmoothScroll } from "@/lib/smoothScroll";

// GSAP's own lag-smoothing defaults, restored when smooth scrolling is torn down.
const GSAP_LAG_SMOOTHING = { threshold: 500, adjustedLag: 33 };

/** Sends same-page anchor links through the smooth scroller instead of the browser's jump. */
function handleAnchorClick(event: MouseEvent): void {
  const plainClick =
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey;
  if (event.defaultPrevented || !plainClick) return;

  const link =
    event.target instanceof Element
      ? event.target.closest<HTMLAnchorElement>('a[href^="#"]')
      : null;
  const hash = link?.getAttribute("href");
  const target = hash ? document.getElementById(hash.slice(1)) : null;
  if (!hash || !target) return;

  event.preventDefault();
  scrollToElement(target);
  history.pushState(null, "", hash);
  // Match the browser: a focusable target (such as the skip link's <main>) takes focus.
  if (target.hasAttribute("tabindex")) target.focus({ preventScroll: true });
}

/**
 * Smooth wheel scrolling with Lenis, driven by GSAP's ticker so ScrollTrigger and the page move
 * in step. Touch keeps native scrolling. With reduced motion, Lenis is never created and anchor
 * links jump natively.
 */
export function SmoothScroll() {
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) return;

    const lenis = new Lenis({ lerp: SMOOTH_SCROLL.lerp, syncTouch: false });
    // The intro may already hold the page still; it starts Lenis again when it hands over.
    if (isIntroRunning()) lenis.stop();
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    // Lenis already smooths frame gaps; GSAP's own catch-up would make it lurch.
    gsap.ticker.lagSmoothing(0);
    setSmoothScroll(lenis);
    document.addEventListener("click", handleAnchorClick);

    return () => {
      document.removeEventListener("click", handleAnchorClick);
      setSmoothScroll(null);
      gsap.ticker.remove(tick);
      gsap.ticker.lagSmoothing(
        GSAP_LAG_SMOOTHING.threshold,
        GSAP_LAG_SMOOTHING.adjustedLag,
      );
      lenis.destroy();
    };
  }, [prefersReducedMotion]);

  return null;
}
