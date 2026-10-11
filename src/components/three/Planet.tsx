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

import { planetShader } from "@/components/three/planetShader";
import type { ParallaxInput } from "@/hooks/usePointerParallax";
import { BRAND_COLORS, PLANET, POINTER_GLOW } from "@/lib/constants";
import { loadLandMask } from "@/lib/landMask";
import type { LandMask } from "@/lib/landMask";
import { createPlanetPoints } from "@/lib/planetPoints";
import type { PlanetPointCounts } from "@/lib/planetPoints";

interface PlanetProps {
  /** Target particle counts; lower device tiers pass a smaller budget. */
  pointCounts: PlanetPointCounts;
  /** Spin around the tilted axis, in radians per second. 0 holds a still frame. */
  rotationSpeed: number;
  /** Smoothed pointer input; the side of the planet facing the pointer brightens slightly. */
  pointer: RefObject<ParallaxInput>;
  /** Surface features, such as city markers and arcs, that turn with the planet. */
  children?: ReactNode;
}

// Reused every frame for the pointer glow, so the frame loop allocates nothing.
const centreOnScreen = new Vector3();

function createGeometry(
  mask: LandMask,
  counts: PlanetPointCounts,
): BufferGeometry {
  const { positions, land } = createPlanetPoints(mask, counts, PLANET.radius);
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(positions, 3));
  geometry.setAttribute("aLand", new BufferAttribute(land, 1));
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
  };
}

export function Planet({
  pointCounts,
  rotationSpeed,
  pointer,
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

  const uniforms = useMemo(() => createUniforms(), []);

  useFrame((state, delta) => {
    if (spinRef.current) spinRef.current.rotation.y += rotationSpeed * delta;

    const material = materialRef.current;
    const tilt = tiltRef.current;
    if (!material || !tilt) return;
    // Same scale PointsMaterial uses for size attenuation: half the drawing-buffer height.
    material.uniforms.uPointScale.value =
      (state.size.height * state.viewport.dpr) / 2;

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
        <points geometry={geometry}>
          <shaderMaterial
            ref={materialRef}
            vertexShader={planetShader.vertex}
            fragmentShader={planetShader.fragment}
            uniforms={uniforms}
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
