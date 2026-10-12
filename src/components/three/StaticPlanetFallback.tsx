import type { CSSProperties } from "react";

import { CAMERA, PLANET, STATIC_PLANET } from "@/lib/constants";
import { SCENE_KEYFRAMES } from "@/lib/sceneStates";
import type { SceneState } from "@/lib/sceneStates";

// React's style type has no entry for custom properties.
type CustomProperties = CSSProperties & Record<`--${string}`, string>;

const TAN_HALF_FOV = Math.tan((CAMERA.fov * Math.PI) / 360);

/**
 * Where the live scene draws the planet in a given state, as CSS lengths: its centre, measured from
 * the top-left corner of the first screen, and the poster's side. The camera looks straight down
 * the z axis, so at the planet's depth one scene unit is a fixed share of the screen's height.
 */
function placePlanet(state: SceneState) {
  const distance = CAMERA.distance - state.z;
  const toSvh = (units: number) =>
    (units / (2 * distance * TAN_HALF_FOV)) * 100;
  const radius = PLANET.radius * state.scale;
  // Seen in perspective, a sphere's outline is a little wider than the sphere itself.
  const outline = (radius * distance) / Math.sqrt(distance ** 2 - radius ** 2);
  return {
    x: `calc(50% + ${toSvh(state.x).toFixed(2)}svh)`,
    y: `${(50 - toSvh(state.y)).toFixed(2)}svh`,
    size: `${toSvh(2 * outline * STATIC_PLANET.posterScale).toFixed(2)}svh`,
  };
}

const mobile = placePlanet(SCENE_KEYFRAMES[0].mobile);
const desktop = placePlanet(SCENE_KEYFRAMES[0].desktop);
const variables: CustomProperties = {
  "--planet-poster": `url(${STATIC_PLANET.poster})`,
  "--planet-x": mobile.x,
  "--planet-y": mobile.y,
  "--planet-size": mobile.size,
  "--planet-x-lg": desktop.x,
  "--planet-y-lg": desktop.y,
  "--planet-size-lg": desktop.size,
};

/**
 * The hero planet for devices without the live scene: a picture rendered from the real scene, in
 * the very spot the scene would draw it, with a soft glow and a few stars. Hidden unless the page
 * shows the static planet (see globals.css). The picture is a CSS background, so it costs no script
 * and is only downloaded where it shows.
 */
export function StaticPlanetFallback() {
  return (
    <div
      aria-hidden
      data-static-planet
      style={variables}
      // An opaque sky in the page's own colour, so the picture's black blends away into it. The
      // bottom fades out, as the hero clips everything below its edge.
      className="pointer-events-none absolute inset-0 -z-20 bg-void starfield mask-b-from-85%"
    >
      <div className="absolute top-(--planet-y) left-(--planet-x) size-(--planet-size) -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(closest-side,rgb(94_231_255/0.12),rgb(124_92_255/0.06)_65%,transparent)] lg:top-(--planet-y-lg) lg:left-(--planet-x-lg) lg:size-(--planet-size-lg)">
        {/* The bloom's faint haze reaches the picture's edges; feathering them hides the seam. */}
        <div className="size-full bg-(image:--planet-poster) mask-radial-from-80% mask-radial-closest-side bg-cover mix-blend-screen" />
      </div>
    </div>
  );
}
