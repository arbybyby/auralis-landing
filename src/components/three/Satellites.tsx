import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  Euler,
  Vector3,
} from "three";
import type { ShaderMaterial } from "three";

import { satelliteShader } from "@/components/three/satelliteShader";
import { BRAND_COLORS, ORBITS, PLANET, SATELLITES } from "@/lib/constants";
import { orbitRotation } from "@/lib/orbits";
import { createRandom, randomBetween } from "@/lib/random";
import { sceneCurrent } from "@/lib/sceneStore";

interface SatellitesProps {
  count: number;
  /** Trail samples behind each satellite; 0 draws heads only. */
  trailLength: number;
  /** Satellites are shared out over this many of the configured rings. */
  orbitCount: number;
  /** False freezes every satellite in place. */
  animated: boolean;
}

const FULL_TURN = Math.PI * 2;

function createGeometry(
  count: number,
  trailLength: number,
  orbitCount: number,
): BufferGeometry {
  const random = createRandom(SATELLITES.seed);
  const pointsPerSatellite = trailLength + 1;
  const total = count * pointsPerSatellite;

  const axisU = new Float32Array(total * 3);
  const axisV = new Float32Array(total * 3);
  const radius = new Float32Array(total);
  const phase = new Float32Array(total);
  const speed = new Float32Array(total);
  const trailIndex = new Float32Array(total);
  const fade = new Float32Array(total);
  const warm = new Float32Array(total);

  const rotation = new Euler();
  const u = new Vector3();
  const v = new Vector3();

  for (let satellite = 0; satellite < count; satellite++) {
    const ring = ORBITS.rings[satellite % orbitCount];
    rotation.set(...orbitRotation(ring));
    // The same rotation the ring uses, applied to the circle's two in-plane axes.
    u.set(1, 0, 0).applyEuler(rotation);
    v.set(0, 0, 1).applyEuler(rotation);

    const startPhase = random() * FULL_TURN;
    const direction = random() < SATELLITES.retrogradeShare ? -1 : 1;
    const angularSpeed =
      direction *
      randomBetween(random, SATELLITES.speed.min, SATELLITES.speed.max);
    const isWarm =
      satellite % SATELLITES.warmEvery === SATELLITES.warmEvery - 1;

    for (let sample = 0; sample < pointsPerSatellite; sample++) {
      const index = satellite * pointsPerSatellite + sample;
      axisU.set([u.x, u.y, u.z], index * 3);
      axisV.set([v.x, v.y, v.z], index * 3);
      radius[index] = PLANET.radius * ring.radiusScale;
      phase[index] = startPhase;
      speed[index] = angularSpeed;
      trailIndex[index] = sample;
      fade[index] = 1 - sample / pointsPerSatellite;
      warm[index] = isWarm ? 1 : 0;
    }
  }

  const geometry = new BufferGeometry();
  // Positions come from the shader; this buffer only gives the draw call its vertex count.
  geometry.setAttribute(
    "position",
    new BufferAttribute(new Float32Array(total * 3), 3),
  );
  geometry.setAttribute("aAxisU", new BufferAttribute(axisU, 3));
  geometry.setAttribute("aAxisV", new BufferAttribute(axisV, 3));
  geometry.setAttribute("aRadius", new BufferAttribute(radius, 1));
  geometry.setAttribute("aPhase", new BufferAttribute(phase, 1));
  geometry.setAttribute("aSpeed", new BufferAttribute(speed, 1));
  geometry.setAttribute("aTrailIndex", new BufferAttribute(trailIndex, 1));
  geometry.setAttribute("aFade", new BufferAttribute(fade, 1));
  geometry.setAttribute("aWarm", new BufferAttribute(warm, 1));
  return geometry;
}

function createUniforms() {
  return {
    uTime: { value: 0 },
    uPointScale: { value: 1 },
    uHeadSize: { value: SATELLITES.size.head },
    uTrailSize: { value: SATELLITES.size.trail },
    uTrailSpacing: { value: SATELLITES.trailSpacing },
    uTrailOpacity: { value: SATELLITES.trailOpacity },
    uColorCool: { value: new Color(BRAND_COLORS.cyan) },
    uColorWarm: { value: new Color(BRAND_COLORS.warm) },
    uPlanetRadius: { value: PLANET.radius },
    uSceneOpacity: { value: 1 },
  };
}

export function Satellites({
  count,
  trailLength,
  orbitCount,
  animated,
}: SatellitesProps) {
  const materialRef = useRef<ShaderMaterial>(null);

  const geometry = useMemo(
    () => createGeometry(count, trailLength, orbitCount),
    [count, trailLength, orbitCount],
  );
  useEffect(() => () => geometry.dispose(), [geometry]);

  const uniforms = useMemo(() => createUniforms(), []);

  useFrame((state, delta) => {
    const material = materialRef.current;
    if (!material) return;
    // Same scale PointsMaterial uses for size attenuation: half the drawing-buffer height.
    material.uniforms.uPointScale.value =
      (state.size.height * state.viewport.dpr) / 2;
    material.uniforms.uSceneOpacity.value = sceneCurrent.orbits;
    if (animated) material.uniforms.uTime.value += delta;
  });

  return (
    // Positions are computed in the shader, so the geometry's bounds are no use for culling.
    <points geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        ref={materialRef}
        vertexShader={satelliteShader.vertex}
        fragmentShader={satelliteShader.fragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={AdditiveBlending}
      />
    </points>
  );
}
