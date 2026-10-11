"use client";

import { CAMERA, DESKTOP_QUERY, SCENE_SCROLL } from "@/lib/constants";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import {
  copySceneState,
  sampleSceneStates,
  SCENE_KEYFRAMES,
} from "@/lib/sceneStates";
import type { SceneState } from "@/lib/sceneStates";
import { publishSceneTarget, sceneTarget } from "@/lib/sceneStore";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const HALF_FOV_TANGENT = Math.tan(((CAMERA.fov / 2) * Math.PI) / 180);

/** How far one screen pixel spans in the scene, at a given depth in front of the camera. */
function sceneUnitsPerPixel(z: number): number {
  return (2 * (CAMERA.distance - z) * HALF_FOV_TANGENT) / window.innerHeight;
}

/** Scrubs the scene smoothly between section states as the page scrolls. */
function scrubBetweenSections(
  sections: HTMLElement[],
  states: SceneState[],
): void {
  // Measuring triggers only: each `start` is the scroll position at which its section sits
  // centred on screen, and ScrollTrigger keeps it current through resizes and refreshes.
  const centres = sections.map((section) =>
    ScrollTrigger.create({ trigger: section, start: "center center" }),
  );
  const anchors = centres.map(() => 0);
  // Stands in for the scroll position, trailing it by the scrub time.
  const scroll = { position: 0 };

  const update = () => {
    const maxScroll = ScrollTrigger.maxScroll(window);
    for (let index = 0; index < centres.length; index++) {
      anchors[index] = Math.min(centres[index].start, maxScroll);
    }
    sampleSceneStates(scroll.position, anchors, states, sceneTarget);
    // Past the last section centre the page keeps scrolling but there is no state left to
    // blend to. Carry the globe up with the page, so the footer cannot slide over the last state.
    const overshoot = scroll.position - anchors[anchors.length - 1];
    if (overshoot > 0) {
      sceneTarget.y += overshoot * sceneUnitsPerPixel(sceneTarget.z);
    }
    publishSceneTarget();
  };

  gsap.fromTo(
    scroll,
    { position: 0 },
    {
      position: () => ScrollTrigger.maxScroll(window),
      ease: "none",
      onUpdate: update,
      scrollTrigger: {
        start: 0,
        end: "max",
        scrub: SCENE_SCROLL.scrub,
        invalidateOnRefresh: true,
      },
    },
  );
  scroll.position = window.scrollY;
  update();
}

/** Reduced motion: no scrubbing, the scene simply switches when another section takes over. */
function switchBetweenSections(
  sections: HTMLElement[],
  states: SceneState[],
): void {
  copySceneState(states[0], sceneTarget);
  publishSceneTarget();
  sections.forEach((section, index) =>
    ScrollTrigger.create({
      trigger: section,
      start: "top center",
      end: "bottom center",
      onToggle: ({ isActive }) => {
        if (!isActive) return;
        copySceneState(states[index], sceneTarget);
        publishSceneTarget();
      },
    }),
  );
}

/**
 * Turns scrolling into scene state: writes `sceneTarget` for the current position. Desktop and
 * mobile keep separate states, and crossing the breakpoint rebuilds everything for the new layout.
 */
export function SceneScrollDriver() {
  useGSAP(() => {
    const media = gsap.matchMedia();
    media.add(
      {
        isDesktop: DESKTOP_QUERY,
        // matchMedia only runs the setup while at least one condition matches, so mobile needs
        // a condition of its own, not just the absence of the desktop one.
        isMobile: `not all and ${DESKTOP_QUERY}`,
        reduceMotion: REDUCED_MOTION_QUERY,
      },
      ({ conditions }) => {
        // Keyframes whose section is missing from the page are skipped.
        const present = SCENE_KEYFRAMES.flatMap((keyframe) => {
          const section = document.getElementById(keyframe.sectionId);
          const state = conditions?.isDesktop
            ? keyframe.desktop
            : keyframe.mobile;
          return section ? [{ section, state }] : [];
        });
        const sections = present.map(({ section }) => section);
        const states = present.map(({ state }) => state);

        if (conditions?.reduceMotion) switchBetweenSections(sections, states);
        else scrubBetweenSections(sections, states);
      },
    );
    return () => media.revert();
  });

  return null;
}
