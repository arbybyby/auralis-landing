import { getDeviceTier } from "@/lib/deviceTier";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { whenIdle } from "@/lib/idle";
import { isIntroRunning, subscribeIntro } from "@/lib/introStore";
import { MOTION_ALLOWED_QUERY, REVEAL } from "@/lib/motion";
import { isRevealVariant } from "@/lib/reveal";
import type { RevealVariant } from "@/lib/reveal";
import { lineIndexes } from "@/lib/textLines";

/** Set on <html> while the reveals run: only then does globals.css hide what is still waiting. */
const READY_CLASS = "reveals";
/** Marks an element that waits, hidden, to be revealed. */
const WAITING = "data-reveal-waiting";

function variantOrDefault(value: string | undefined): RevealVariant {
  return isRevealVariant(value) ? value : "fade-up";
}

/** Below the visible screen, the only place where an element can wait hidden without being missed. */
function isBelowFold(element: Element): boolean {
  return element.getBoundingClientRect().top >= window.innerHeight;
}

function rise(element: HTMLElement, withScale: boolean, delay: number) {
  return gsap.fromTo(
    element,
    {
      opacity: 0,
      y: REVEAL.rise,
      scale: withScale ? REVEAL.scaleFrom : 1,
    },
    {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: REVEAL.duration,
      ease: REVEAL.ease,
      delay,
      clearProps: "opacity,transform",
    },
  );
}

function fadeIn(element: HTMLElement, delay: number) {
  return gsap.fromTo(
    element,
    { opacity: 0 },
    {
      opacity: 1,
      duration: REVEAL.duration,
      ease: REVEAL.ease,
      delay,
      clearProps: "opacity",
    },
  );
}

/** The words of each line rise out of their masks together, one line after another. */
function maskLines(element: HTMLElement, delay: number) {
  const words = gsap.utils.toArray<HTMLElement>("[data-reveal-word]", element);
  const lineOf = lineIndexes(words);
  return gsap.fromTo(
    words,
    { yPercent: REVEAL.line.rise },
    {
      yPercent: 0,
      duration: REVEAL.line.duration,
      ease: REVEAL.line.ease,
      delay,
      stagger: (index: number) => lineOf[index] * REVEAL.line.stagger,
      clearProps: "transform",
    },
  );
}

/** The label fades in while a hairline draws under it; the line then fades, as in the hero. */
function eyebrow(element: HTMLElement, delay: number) {
  const { draw, hold, fade, fadeEase } = REVEAL.eyebrow;
  return gsap
    .timeline({ delay })
    .add(fadeIn(element, 0), 0)
    .fromTo(
      element,
      { "--reveal-line": 0, "--reveal-line-opacity": 1 },
      { "--reveal-line": 1, duration: draw, ease: REVEAL.ease },
      0,
    )
    .to(
      element,
      {
        "--reveal-line-opacity": 0,
        duration: fade,
        ease: fadeEase,
        clearProps: "--reveal-line,--reveal-line-opacity",
      },
      draw + hold,
    );
}

/** The animation that brings an element into view. It sets the hidden starting state at once. */
function revealAnimation(
  element: HTMLElement,
  variant: RevealVariant,
  lite: boolean,
  delay: number,
): gsap.core.Animation {
  switch (variant) {
    case "fade-up":
      return rise(element, false, delay);
    // The low tier keeps the rise but skips the scaling.
    case "scale-in":
      return rise(element, !lite, delay);
    case "fade-in":
      return fadeIn(element, delay);
    case "mask-line":
      return maskLines(element, delay);
    case "eyebrow":
      return eyebrow(element, delay);
  }
}

/**
 * Hides what is still below the fold and reveals each piece, once, as it scrolls into view.
 * Returns the cleanup, which shows everything again.
 */
function startReveals(): () => void {
  const root = document.documentElement;
  const lite = getDeviceTier() === "low";
  const waiting = new Set<HTMLElement>();
  const triggers: ScrollTrigger[] = [];

  const hold = (element: HTMLElement) => {
    element.setAttribute(WAITING, "");
    waiting.add(element);
  };

  /** Plays an element's reveal; null if it never waited or has already been shown. */
  const show = (element: HTMLElement, variant: RevealVariant, delay = 0) => {
    if (!waiting.delete(element)) return null;
    // The animation applies its hidden starting state before the CSS hold lifts, so nothing flashes.
    const animation = revealAnimation(element, variant, lite, delay);
    element.removeAttribute(WAITING);
    return animation;
  };

  const showEverything = () => {
    triggers.forEach((trigger) => trigger.kill());
    waiting.forEach((element) => element.removeAttribute(WAITING));
    waiting.clear();
    root.classList.remove(READY_CLASS);
  };

  // Armed before anything is hidden: if the reveals never finish starting up, the page shows in full.
  const safety = window.setTimeout(showEverything, REVEAL.safetyTimeoutMs);

  for (const unit of gsap.utils.toArray<HTMLElement>("[data-reveal]")) {
    const kind = unit.dataset.reveal;

    if (kind === "stagger") {
      const variant = variantOrDefault(unit.dataset.revealChild);
      const children = Array.from(unit.children).filter(
        (child): child is HTMLElement =>
          child instanceof HTMLElement && isBelowFold(child),
      );
      if (children.length === 0) continue;
      children.forEach(hold);
      // Children that reach the line together (one row of cards) follow one another.
      const batch = ScrollTrigger.batch(children, {
        start: REVEAL.start,
        once: true,
        onEnter: (arrived) =>
          arrived.forEach((child, index) => {
            if (child instanceof HTMLElement) {
              show(child, variant, index * REVEAL.stagger);
            }
          }),
      });
      triggers.push(...batch);
    } else if (kind === "sequence") {
      if (!isBelowFold(unit)) continue;
      const steps = gsap.utils.toArray<HTMLElement>("[data-reveal-step]", unit);
      steps.forEach(hold);
      const trigger = ScrollTrigger.create({
        trigger: unit,
        start: REVEAL.start,
        once: true,
        onEnter: () => {
          const timeline = gsap.timeline();
          let played = 0;
          for (const step of steps) {
            const animation = show(
              step,
              variantOrDefault(step.dataset.revealStep),
            );
            if (!animation) continue;
            // Each step starts just before the one before it ends.
            timeline.add(
              animation,
              played === 0 ? 0 : `>-${REVEAL.sequenceOverlap}`,
            );
            played += 1;
          }
        },
      });
      triggers.push(trigger);
    } else if (isRevealVariant(kind) && isBelowFold(unit)) {
      hold(unit);
      const trigger = ScrollTrigger.create({
        trigger: unit,
        start: REVEAL.start,
        once: true,
        onEnter: () => show(unit, kind),
      });
      triggers.push(trigger);
    }
  }
  root.classList.add(READY_CLASS);

  // Keyboard focus never lands on something invisible: whatever it reaches is revealed at once.
  const variantOf = (element: HTMLElement): RevealVariant => {
    if (element.dataset.revealStep) {
      return variantOrDefault(element.dataset.revealStep);
    }
    const group = element.parentElement;
    if (group?.dataset.reveal === "stagger") {
      return variantOrDefault(group.dataset.revealChild);
    }
    return variantOrDefault(element.dataset.reveal);
  };
  const onFocusIn = (event: FocusEvent) => {
    const held =
      event.target instanceof Element
        ? event.target.closest<HTMLElement>(`[${WAITING}]`)
        : null;
    if (held) show(held, variantOf(held));
  };
  document.addEventListener("focusin", onFocusIn);

  // Web fonts change line lengths and heights, so every trigger is measured again once they are
  // in. ScrollTrigger re-measures on resize by itself.
  let isActive = true;
  document.fonts.ready.then(() => {
    if (!isActive) return;
    window.clearTimeout(safety);
    ScrollTrigger.refresh();
  });

  return () => {
    isActive = false;
    window.clearTimeout(safety);
    document.removeEventListener("focusin", onFocusIn);
    waiting.forEach((element) => element.removeAttribute(WAITING));
    waiting.clear();
    root.classList.remove(READY_CLASS);
  };
}

/**
 * Runs the page's scroll reveals (lib/reveal.ts describes the markup). Whatever is on screen when
 * they start stays as it is; what is below the fold waits hidden and reveals, once, as it scrolls
 * into view. With reduced motion none of it runs and the page simply shows in full.
 *
 * Setting up some thirty triggers measures the whole page, so it waits for a quiet moment after
 * hydration, the longest task of the load, and for the intro to hand the page over: nothing can
 * scroll before that, and the intro never loses a frame to it.
 */
export function useReveal(): void {
  useGSAP(() => {
    const media = gsap.matchMedia();
    media.add(MOTION_ALLOWED_QUERY, (context) => {
      let stopReveals: (() => void) | undefined;
      let cancelStart = () => {};
      const start = context.add("start", () => {
        stopReveals = startReveals();
      });
      const startWhenQuiet = () => {
        cancelStart();
        cancelStart = whenIdle(() => {
          // The intro's hand-over schedules this again.
          if (isIntroRunning()) return;
          stopWaitingForIntro();
          start();
        }, REVEAL.startTimeoutMs);
      };
      const stopWaitingForIntro = subscribeIntro(() => {
        if (!isIntroRunning()) startWhenQuiet();
      });
      startWhenQuiet();

      return () => {
        stopWaitingForIntro();
        cancelStart();
        stopReveals?.();
      };
    });
    return () => media.revert();
  });
}
