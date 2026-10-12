import { useFrame } from "@react-three/fiber";
import { use, useEffect, useMemo, useRef } from "react";
import type { ReactNode, RefObject } from "react";
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  Vector3,
} from "three";
import type { Group, ShaderMaterial } from "three";

import type { IntroPath } from "@/components/three/introMotion";
import { planetShader } from "@/components/three/planetShader";
import { SWARM_DEFINES, useIntroSwarm } from "@/hooks/useIntroSwarm";
import type { ParallaxInput } from "@/hooks/usePointerParallax";
import { BRAND_COLORS, PLANET, POINTER_GLOW } from "@/lib/constants";
import { INTRO } from "@/lib/intro";
import { markIntroReady } from "@/lib/introStore";
import { loadLandMask } from "@/lib/landMask";
import type { LandMask } from "@/lib/landMask";
import { createPlanetPoints } from "@/lib/planetPoints";
import type { PlanetPointCounts } from "@/lib/planetPoints";
import { sceneCurrent, sceneMotion } from "@/lib/sceneStore";

interface PlanetProps {
  /** Target particle counts; lower device tiers pass a smaller budget. */
  pointCounts: PlanetPointCounts;
  /** Spin around the tilted axis, in radians per second. 0 holds a still frame. */
  rotationSpeed: number;
  /** Smoothed pointer input; the side of the planet facing the pointer brightens slightly. */
  pointer: RefObject<ParallaxInput>;
  /** The intro's path and swarm for the current layout; the points fly it before they settle. */
  introPath: IntroPath;
  /** Surface features, such as city markers and arcs, that turn with the planet. */
  children?: ReactNode;
}

// Reused every frame for the pointer glow, so the frame loop allocates nothing.
const centreOnScreen = new Vector3();

function createGeometry(
  mask: LandMask,
  counts: PlanetPointCounts,
): BufferGeometry {
  const { positions, land, seeds, randoms } = createPlanetPoints(
    mask,
    counts,
    PLANET.radius,
    PLANET.seed,
  );
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(positions, 3));
  geometry.setAttribute("aLand", new BufferAttribute(land, 1));
  geometry.setAttribute("aSeed", new BufferAttribute(seeds, 1));
  geometry.setAttribute("aRandom", new BufferAttribute(randoms, 4));
  return geometry;
}

function createUniforms() {
  return {
    uPointScale: { value: 1 },
    uLandSize: { value: PLANET.pointSize.land },
    uOceanSize: { value: PLANET.pointSize.ocean },
    uLandOpacity: { value: PLANET.opacity.land },
    uOceanOpacity: { value: PLANET.opacity.ocean },
    uColorEquator: { value: new Color(BRAND_COLORS.cyan) },
    uColorPole: { value: new Color(BRAND_COLORS.violet) },
    uGlowDirection: { value: new Vector3(0, 0, 1) },
    uGlowStrength: { value: 0 },
    uSceneOpacity: { value: 1 },
  };
}

export function Planet({
  pointCounts,
  rotationSpeed,
  pointer,
  introPath,
  children,
}: PlanetProps) {
  const landMask = use(loadLandMask());
  const tiltRef = useRef<Group>(null);
  const spinRef = useRef<Group>(null);
  const materialRef = useRef<ShaderMaterial>(null);

  const geometry = useMemo(
    () => createGeometry(landMask, pointCounts),
    [landMask, pointCounts],
  );
  useEffect(() => () => geometry.dispose(), [geometry]);

  const swarmUniforms = useIntroSwarm(materialRef, spinRef, introPath);
  const uniforms = useMemo(
    () => ({ ...createUniforms(), ...swarmUniforms }),
    [swarmUniforms],
  );
  // Frames run so far, up to the warm-up count. The GPU finishes preparing a shader only once it
  // has drawn with it, and a few frames in, the first ones have surely gone through.
  const framesRun = useRef(0);

  // Rendering this component means the land mask is ready and the points are built.
  useEffect(() => markIntroReady("planet"), []);

  useFrame((state, delta) => {
    if (framesRun.current < INTRO.warmUpFrames) {
      framesRun.current += 1;
      if (framesRun.current === INTRO.warmUpFrames) markIntroReady("frame");
    }
    if (spinRef.current) {
      spinRef.current.rotation.y +=
        (rotationSpeed + sceneMotion.spinBoost) * delta;
    }

    const material = materialRef.current;
    const tilt = tiltRef.current;
    if (!material || !tilt) return;
    // Same scale PointsMaterial uses for size attenuation: half the drawing-buffer height.
    material.uniforms.uPointScale.value =
      (state.size.height * state.viewport.dpr) / 2;
    material.uniforms.uSceneOpacity.value = sceneCurrent.planet;

    // Light the side facing the pointer: the direction runs from the planet's centre on screen
    // towards the pointer, in view space, leaning towards the viewer.
    const { x, y, presence } = pointer.current;
    centreOnScreen
      .setFromMatrixPosition(tilt.matrixWorld)
      .project(state.camera);
    material.uniforms.uGlowDirection.value
      .set(
        (x - centreOnScreen.x) * state.viewport.aspect,
        y - centreOnScreen.y,
        POINTER_GLOW.forwardBias,
      )
      .normalize();
    material.uniforms.uGlowStrength.value = presence * POINTER_GLOW.strength;
  });

  return (
    <group ref={tiltRef} rotation-z={PLANET.axialTilt}>
      <group ref={spinRef}>
        {/* The intro flies the points far outside the sphere, so its bounds are no use for culling. */}
        <points geometry={geometry} frustumCulled={false}>
          <shaderMaterial
            ref={materialRef}
            vertexShader={planetShader.vertex}
            fragmentShader={planetShader.fragment}
            uniforms={uniforms}
            defines={SWARM_DEFINES}
            transparent
            depthWrite={false}
            blending={AdditiveBlending}
          />
        </points>
        {children}
      </group>
    </group>
  );
}
