import { BRAND_COLORS, DESKTOP_QUERY } from "@/lib/constants";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { INTRO } from "@/lib/intro";
import type { IntroKeyframe, IntroLayout } from "@/lib/intro";
import {
  finishIntroState,
  hasReachedIntroMilestone,
  introState,
  markIntroReady,
  setIntroRunning,
  startIntroState,
  subscribeIntro,
} from "@/lib/introStore";
import type { IntroMilestone, IntroState } from "@/lib/introStore";
import { startSmoothScroll, stopSmoothScroll } from "@/lib/smoothScroll";

/** The full sequence, or a plain fade of the finished page. */
export type IntroMode = "full" | "quick";

export interface IntroHandle {
  /** Finishes the intro at once and hands the page back. */
  skip(): void;
  /** Stops everything without marking the intro as played (unmount, or a development re-run). */
  dispose(): void;
}

/** The hero's parts the intro brings in, found once in the page. */
interface IntroElements {
  /** Everything marked `data-intro`: hidden until the intro reveals it. */
  all: HTMLElement[];
  /** The headline's letters up to "think". */
  leadChars: HTMLElement[];
  /** "think", which arrives last. */
  accentChars: HTMLElement[];
  /** What follows it: the closing full stop. */
  closingChars: HTMLElement[];
  /** The headline's and subtitle's own boxes, shown as their letters and words begin. */
  headline: HTMLElement[];
  subtitle: HTMLElement[];
  eyebrow: HTMLElement[];
  eyebrowLine: HTMLElement[];
  words: HTMLElement[];
  buttons: HTMLElement[];
  nav: HTMLElement[];
  hints: HTMLElement[];
  backdrop: HTMLElement[];
}

/** The loader's parts the timeline moves. */
interface LoaderParts {
  root: HTMLElement;
  /** The counter and its bar together, which fade as the spark ignites. */
  progress: HTMLElement[];
  counter: HTMLElement | null;
  bar: HTMLElement | null;
  track: HTMLElement | null;
}

const MILESTONES: readonly IntroMilestone[] = [
  "fonts",
  "scene",
  "planet",
  "shaders",
  "frame",
];

/** Every inline style the intro writes, cleared once it is over so the stylesheet rules again. */
const ANIMATED_PROPS =
  "opacity,visibility,transform,clipPath,color,textShadow,boxShadow";

const PHASE_LABELS = Object.entries(INTRO.phases);

function findAll(selector: string): HTMLElement[] {
  return gsap.utils.toArray<HTMLElement>(selector);
}

function findElements(): IntroElements {
  const finaleChars = findAll('[data-intro-finale] [data-intro="char"]');
  const accentChars = findAll('[data-intro-accent] [data-intro="char"]');
  return {
    all: findAll("[data-intro]"),
    leadChars: findAll('[data-intro="char"]').filter(
      (char) => !finaleChars.includes(char),
    ),
    accentChars,
    closingChars: finaleChars.filter((char) => !accentChars.includes(char)),
    headline: findAll('[data-intro="headline"]'),
    subtitle: findAll('[data-intro="subtitle"]'),
    eyebrow: findAll('[data-intro="eyebrow"]'),
    eyebrowLine: findAll("[data-intro-line]"),
    words: findAll('[data-intro="word"]'),
    buttons: findAll('[data-intro="button"]'),
    nav: findAll('[data-intro="nav"]'),
    hints: findAll('[data-intro="hints"]'),
    backdrop: findAll('[data-intro="backdrop"]'),
  };
}

function findLoaderParts(root: HTMLElement): LoaderParts {
  return {
    root,
    progress: gsap.utils.toArray<HTMLElement>("[data-intro-progress]", root),
    counter: root.querySelector("[data-intro-counter]"),
    bar: root.querySelector("[data-intro-bar]"),
    track: root.querySelector('[role="progressbar"]'),
  };
}

/**
 * From and to values that bring letters into focus without animating a blur radius: a soft glow
 * of fixed size in the letter's own colour fades out as the sharp letter fades in.
 */
function focusVars(letter: HTMLElement | undefined) {
  const color = letter
    ? getComputedStyle(letter).color
    : INTRO.text.flash.color;
  const [red, green, blue] = gsap.utils.splitColor(color);
  const tint = (alpha: number) => `rgba(${red}, ${green}, ${blue}, ${alpha})`;
  const glow = (alpha: number) =>
    `0 0 ${INTRO.text.focusRadius} ${tint(alpha)}`;
  return {
    from: { color: tint(0), textShadow: glow(1) },
    to: { color: tint(1), textShadow: glow(0) },
  };
}

function currentLayout(): IntroLayout {
  return window.matchMedia(DESKTOP_QUERY).matches
    ? INTRO.layouts.desktop
    : INTRO.layouts.mobile;
}

function hasPlayedThisSession(): boolean {
  try {
    return sessionStorage.getItem(INTRO.storageKey) !== null;
  } catch {
    return true;
  }
}

/**
 * The full intro needs motion, the 3D scene and a page that starts at the top. Reduced motion, a
 * return visit in the same session, a link to a section, a restored scroll position or a device
 * without the scene all get the plain fade instead.
 */
export function chooseIntroMode(hasScene: boolean): IntroMode {
  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const startsMidPage = window.scrollY > INTRO.midPageScroll;
  const skipsIntro =
    reducedMotion ||
    !hasScene ||
    hasPlayedThisSession() ||
    location.hash !== "" ||
    startsMidPage;
  return skipsIntro ? "quick" : "full";
}

/** Plays a keyframed curve on one property of the intro state, starting at `start`. */
function addKeyframes(
  timeline: gsap.core.Timeline,
  property: keyof IntroState,
  frames: readonly IntroKeyframe[],
  start: number,
  ease: string,
): void {
  timeline.to(
    introState,
    {
      keyframes: frames.map(({ to, duration }) => ({
        [property]: to,
        duration,
        ease,
      })),
    },
    start,
  );
}

/** The 3D story: spark, launch, swarm and condense. The scene reads every value each frame. */
function addSceneTweens(
  timeline: gsap.core.Timeline,
  layout: IntroLayout,
): void {
  const { spark, trail, energy, camera, shockwave, layers, phases } = INTRO;

  // Spark: the point flickers on and pulses twice, its halo builds, and the bloom flares with it.
  addKeyframes(timeline, "spark", spark.ignite, phases.spark, "none");
  addKeyframes(timeline, "bloom", INTRO.bloom, phases.spark, "sine.inOut");
  timeline.to(
    introState,
    { halo: 1, duration: spark.halo.duration, ease: "power2.out" },
    spark.halo.start,
  );

  // Launch: the leader leaves its trail, and the camera drifts after it before easing back.
  timeline
    .to(
      introState,
      { trail: 1, duration: trail.show.duration },
      trail.show.start,
    )
    .to(
      introState,
      {
        panX: layout.follow.x,
        panY: layout.follow.y,
        roll: layout.follow.roll,
        duration: camera.follow.out,
        ease: "sine.inOut",
      },
      camera.follow.start,
    )
    .to(
      introState,
      {
        panX: 0,
        panY: 0,
        roll: 0,
        duration: camera.follow.back,
        ease: "sine.inOut",
      },
      camera.follow.start + camera.follow.out,
    );

  // Swarm: the leader and its trail dissolve into the swarm as its energy builds to a peak,
  // marked by a brief shake and pulse.
  timeline
    .to(
      introState,
      { spark: 0, halo: 0, duration: spark.fade.duration, ease: "power2.in" },
      spark.fade.start,
    )
    .to(
      introState,
      { trail: 0, duration: trail.fade.duration, ease: "power1.in" },
      trail.fade.start,
    )
    .to(
      introState,
      { energy: 1, duration: energy.rise, ease: "power2.in" },
      energy.start,
    )
    .to(
      introState,
      { energy: 0, duration: energy.fall, ease: "power2.out" },
      energy.start + energy.rise,
    )
    .to(
      introState,
      { shake: 1, duration: camera.shake.rise, ease: "power2.in" },
      camera.shake.start,
    )
    .to(
      introState,
      { shake: 0, duration: camera.shake.fall, ease: "power2.out" },
      camera.shake.start + camera.shake.rise,
    )
    .to(
      introState,
      {
        pulse: camera.pulse.scale,
        duration: camera.pulse.rise,
        ease: "power2.out",
      },
      camera.pulse.start,
    )
    .to(
      introState,
      { pulse: 1, duration: camera.pulse.fall, ease: "power2.inOut" },
      camera.pulse.start + camera.pulse.rise,
    );

  // Condense: the wide shot settles into the hero position as the planet locks together; the
  // finished planet sends out a shockwave, and the rest of the scene follows it in.
  timeline
    .to(
      introState,
      {
        wideX: 0,
        wideY: 0,
        wideZ: 0,
        duration: camera.settle.duration,
        ease: "power3.inOut",
      },
      camera.settle.start,
    )
    .to(
      introState,
      { shockwave: 1, duration: shockwave.duration, ease: "expo.out" },
      shockwave.start,
    )
    .to(
      introState,
      { markers: 1, duration: layers.markers.duration },
      layers.markers.start,
    )
    .to(
      introState,
      {
        atmosphere: layers.atmosphere.flare,
        duration: layers.atmosphere.flareDuration,
        ease: "power2.out",
      },
      layers.atmosphere.start,
    )
    .to(
      introState,
      {
        atmosphere: 1,
        duration: layers.atmosphere.settle,
        ease: "power2.inOut",
      },
      layers.atmosphere.start + layers.atmosphere.flareDuration,
    )
    .to(
      introState,
      { stars: 1, duration: layers.stars.duration, ease: "power1.inOut" },
      layers.stars.start,
    )
    .to(
      introState,
      { orbits: 1, duration: layers.orbits.duration, ease: "power2.inOut" },
      layers.orbits.start,
    )
    .to(
      introState,
      { satellites: 1, duration: layers.satellites.duration },
      layers.satellites.start,
    )
    .set(introState, { arcs: 1 }, layers.arcs.start);
}

/** The copy: headline, eyebrow, subtitle, buttons, navigation and hints, after the backdrop. */
function addTextTweens(
  timeline: gsap.core.Timeline,
  elements: IntroElements,
): void {
  const { text } = INTRO;
  const { flash, eyebrow, subtitle, buttons, nav, hints } = text;
  const [primaryButton] = elements.buttons;

  // Rises from the faint strength the stylesheet holds it at while the scene loads.
  timeline.to(
    elements.backdrop,
    { opacity: 1, duration: text.backdrop.duration, ease: "power1.inOut" },
    text.backdrop.start,
  );

  // Each letter rises out of its word's mask and turns upright. All but "think" also come into
  // focus, from a soft glow to the sharp letter; "think" has its own flash below.
  const below = { opacity: 0, yPercent: text.rise, rotation: text.rotation };
  const upright = { opacity: 1, yPercent: 0, rotation: 0, ease: "expo.out" };
  const focus = focusVars(elements.leadChars[0]);
  timeline
    .set(elements.headline, { opacity: 1 }, text.lead.start)
    .fromTo(
      elements.leadChars,
      { ...below, ...focus.from },
      {
        ...upright,
        ...focus.to,
        duration: text.lead.duration,
        stagger: text.lead.stagger,
      },
      text.lead.start,
    )
    .fromTo(
      elements.accentChars,
      below,
      {
        ...upright,
        duration: text.finale.duration,
        stagger: text.finale.stagger,
      },
      text.finale.start,
    )
    .fromTo(
      elements.closingChars,
      { ...below, ...focus.from },
      { ...upright, ...focus.to, duration: text.finale.duration },
      text.finale.start + elements.accentChars.length * text.finale.stagger,
    );

  // "think" arrives leaning further and a little larger, settles into its italic, and flashes
  // white with a cyan glow before relaxing to its accent colour.
  timeline
    .fromTo(
      elements.accentChars,
      { skewX: text.settle.skew, scale: text.settle.scale },
      {
        skewX: 0,
        scale: 1,
        duration: text.finale.duration,
        stagger: text.finale.stagger,
        ease: "back.out(2)",
      },
      text.finale.start,
    )
    .fromTo(
      elements.accentChars,
      { color: flash.color, textShadow: flash.shadow },
      {
        color: BRAND_COLORS.cyan,
        textShadow: flash.shadowEnd,
        duration: flash.duration,
        ease: "power2.out",
      },
      text.finale.start,
    );

  timeline
    .fromTo(
      elements.eyebrow,
      { opacity: 1, clipPath: eyebrow.clipFrom },
      {
        clipPath: eyebrow.clipTo,
        duration: eyebrow.duration,
        ease: "power2.inOut",
      },
      eyebrow.start,
    )
    .fromTo(
      elements.eyebrowLine,
      { opacity: 1, scaleX: 0 },
      { scaleX: 1, duration: eyebrow.duration, ease: "power2.inOut" },
      eyebrow.start,
    )
    .to(
      elements.eyebrowLine,
      { opacity: 0, duration: eyebrow.lineFade },
      eyebrow.start + eyebrow.duration,
    );

  timeline.set(elements.subtitle, { opacity: 1 }, subtitle.start).fromTo(
    elements.words,
    { opacity: 0, yPercent: subtitle.rise },
    {
      opacity: 1,
      yPercent: 0,
      duration: subtitle.duration,
      stagger: subtitle.stagger,
      ease: "power3.out",
    },
    subtitle.start,
  );

  timeline.fromTo(
    elements.buttons,
    { opacity: 0, scale: buttons.scale },
    {
      opacity: 1,
      scale: 1,
      duration: buttons.duration,
      stagger: buttons.stagger,
      ease: "back.out(1.6)",
    },
    buttons.start,
  );
  if (primaryButton) {
    timeline
      .fromTo(
        primaryButton,
        { boxShadow: buttons.glow.shadowEnd },
        {
          boxShadow: buttons.glow.shadow,
          duration: buttons.glow.rise,
          ease: "power2.out",
        },
        buttons.glow.start,
      )
      .to(
        primaryButton,
        {
          boxShadow: buttons.glow.shadowEnd,
          duration: buttons.glow.fall,
          ease: "power2.in",
        },
        buttons.glow.start + buttons.glow.rise,
      );
  }

  timeline
    .fromTo(
      elements.nav,
      { opacity: 0, yPercent: -100 },
      { opacity: 1, yPercent: 0, duration: nav.duration, ease: "power3.out" },
      nav.start,
    )
    .fromTo(
      elements.hints,
      { opacity: 0 },
      { opacity: 1, duration: hints.duration, ease: "power1.out" },
      hints.start,
    );
}

/**
 * Plays the opening sequence. A tiny counter waits for real readiness (fonts, canvas, planet,
 * first frame); then one timeline tells the story in phases (spark, launch, swarm, condense and
 * text) while scroll and pointer input stay locked. `onFinish` runs once the page is handed back.
 */
export function runIntro(
  mode: IntroMode,
  loaderElement: HTMLElement,
  onFinish: () => void,
): IntroHandle {
  const root = document.documentElement;
  const elements = findElements();
  const loader = findLoaderParts(loaderElement);

  root.classList.add(INTRO.liveClass);
  const context = gsap.context(() => undefined);
  const cleanups: (() => void)[] = [];
  // Whichever timeline is running: the intro itself or a fade.
  let active: gsap.core.Timeline | null = null;
  let hasStarted = false;
  let finished = false;

  const unlock = () => {
    setIntroRunning(false);
    root.style.overflow = "";
    startSmoothScroll();
  };

  const finish = () => {
    if (finished) return;
    finished = true;
    cleanups.forEach((cleanup) => cleanup());
    finishIntroState();
    unlock();
    root.classList.remove(
      INTRO.pendingClass,
      INTRO.quickClass,
      INTRO.liveClass,
    );
    root.style.removeProperty(INTRO.fadeProperty);
    gsap.set([...elements.all, ...elements.eyebrowLine], {
      clearProps: ANIMATED_PROPS,
    });
    try {
      sessionStorage.setItem(INTRO.storageKey, "1");
    } catch {
      // Storage can be unavailable (private modes); the intro then simply plays again.
    }
    ScrollTrigger.refresh();
    onFinish();
  };

  /** Shows the finished page with a plain fade: the scene is complete from the first frame. */
  const fadeIn = (duration: number) => {
    active?.kill();
    finishIntroState();
    context.add(() => {
      active = gsap
        .timeline({ onComplete: finish })
        .to(loader.root, { autoAlpha: 0, duration }, 0)
        .fromTo(elements.all, { opacity: 0 }, { opacity: 1, duration }, 0);
    });
  };

  const skip = () => {
    if (finished) return;
    if (!active) fadeIn(0);
    active?.progress(1);
  };

  const dispose = () => {
    cleanups.forEach((cleanup) => cleanup());
    // Once finished, reverting would undo the final state.
    if (finished) {
      context.kill();
      return;
    }
    context.revert();
    finishIntroState();
    unlock();
  };

  // The boot script started the CSS fade at first paint; hand over once it has surely run out.
  if (root.classList.contains(INTRO.quickClass)) {
    const fadeEnd = window.setTimeout(finish, INTRO.fade * 1000);
    cleanups.push(() => window.clearTimeout(fadeEnd));
    return { skip, dispose };
  }

  // Scripts arrived so late that the boot script's safety reveal already showed the page.
  if (!root.classList.contains(INTRO.pendingClass)) {
    finish();
    return { skip, dispose };
  }

  // Only scripts can tell a restored scroll position or a device without the scene.
  if (mode === "quick") {
    fadeIn(INTRO.fade);
    return { skip, dispose };
  }

  const layout = currentLayout();
  setIntroRunning(true);
  root.style.overflow = "hidden";
  stopSmoothScroll();
  startIntroState(layout.wideShot);

  // The counter follows real readiness, eases towards it and never runs backwards.
  const shown = { value: 0 };
  const renderCounter = () => {
    const percent = Math.round(shown.value * 100);
    if (loader.counter) {
      loader.counter.textContent = String(percent).padStart(3, "0");
    }
    if (loader.bar) loader.bar.style.transform = `scaleX(${shown.value})`;
    loader.track?.setAttribute("aria-valuenow", String(percent));
  };

  const play = () => {
    hasStarted = true;
    introState.warmUp = false;
    // Anything that stalls the sequence (a hidden tab, a lost context) ends in the finished page.
    const watchdog = window.setTimeout(skip, INTRO.sequenceTimeoutMs);
    cleanups.push(() => window.clearTimeout(watchdog));

    context.add(() => {
      // Each tween sets its starting values only when it starts. Setting them all up front would
      // have the browser paint every hidden effect at once, just as the show begins.
      const timeline = gsap.timeline({
        onComplete: finish,
        defaults: { immediateRender: false },
      });
      PHASE_LABELS.forEach(([label, time]) => timeline.addLabel(label, time));
      // The scene's clock: every point of the swarm is a function of it.
      timeline.fromTo(
        introState,
        { time: 0 },
        { time: INTRO.phases.end, duration: INTRO.phases.end, ease: "none" },
        0,
      );
      // The counter finishes fast as the spark ignites; the skip control stays till near the end.
      timeline
        .to(
          shown,
          {
            value: 1,
            duration: INTRO.loader.finish,
            ease: "power2.out",
            overwrite: true,
            onUpdate: renderCounter,
          },
          0,
        )
        .to(
          loader.progress,
          { autoAlpha: 0, duration: INTRO.loader.hide.duration },
          INTRO.loader.hide.start,
        )
        .to(
          loader.root,
          { autoAlpha: 0, duration: INTRO.loader.skipHide.duration },
          INTRO.loader.skipHide.start,
        );
      addSceneTweens(timeline, layout);
      addTextTweens(timeline, elements);
      timeline.timeScale(layout.timeScale);
      active = timeline;
    });
  };

  const onProgress = () => {
    if (hasStarted || finished) return;
    const ready = MILESTONES.filter(hasReachedIntroMilestone).length;
    if (ready === MILESTONES.length) {
      play();
      return;
    }
    context.add(() => {
      gsap.to(shown, {
        value: Math.max(shown.value, ready / MILESTONES.length),
        duration: INTRO.counterCatchUp,
        ease: "power2.out",
        overwrite: true,
        onUpdate: renderCounter,
      });
    });
  };
  cleanups.push(subscribeIntro(onProgress));
  onProgress();
  document.fonts.ready.then(() => markIntroReady("fonts"));

  // Not ready in time, or the scene failed: show the page rather than keep it waiting.
  const giveUp = window.setTimeout(() => {
    if (!hasStarted) fadeIn(INTRO.fade);
  }, INTRO.readyTimeoutMs);
  cleanups.push(() => window.clearTimeout(giveUp));

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape") skip();
  };
  // The browser can restore a scroll position after the intro has started; follow it.
  const onScroll = () => {
    if (window.scrollY > INTRO.midPageScroll) skip();
  };
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("scroll", onScroll, { passive: true });
  cleanups.push(() => {
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("scroll", onScroll);
  });

  return { skip, dispose };
}
