import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import type { RefObject } from "react";
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
} from "three";
import type { ShaderMaterial } from "three";

import { cityMarkerShader } from "@/components/three/cityMarkerShader";
import { CITY_DIRECTIONS, CITIES } from "@/lib/cities";
import { BRAND_COLORS, CITY_MARKERS, PLANET } from "@/lib/constants";
import { sceneCurrent } from "@/lib/sceneStore";

interface CityMarkersProps {
  /** Shared with the arcs, which raise a city's `uFlash` entry when they land on it. */
  materialRef: RefObject<ShaderMaterial | null>;
  /** False holds the pulse rings still. */
  animated: boolean;
}

// Spread the pulses out so the cities do not ring in unison.
const GOLDEN_RATIO = 0.618034;

function createGeometry(): BufferGeometry {
  const radius = PLANET.radius * CITY_MARKERS.altitude;
  const positions = new Float32Array(CITIES.length * 3);
  const indices = new Float32Array(CITIES.length);
  const phases = new Float32Array(CITIES.length);

  CITY_DIRECTIONS.forEach(([x, y, z], index) => {
    positions.set([x * radius, y * radius, z * radius], index * 3);
    indices[index] = index;
    phases[index] = (index * GOLDEN_RATIO) % 1;
  });

  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(positions, 3));
  geometry.setAttribute("aIndex", new BufferAttribute(indices, 1));
  geometry.setAttribute("aPhase", new BufferAttribute(phases, 1));
  return geometry;
}

function createUniforms() {
  return {
    uTime: { value: 0 },
    uPointScale: { value: 1 },
    uSize: { value: CITY_MARKERS.size },
    uFlash: { value: new Float32Array(CITIES.length) },
    uColor: { value: new Color(BRAND_COLORS.cyan) },
    uPlanetRadius: { value: PLANET.radius },
    uSceneOpacity: { value: 1 },
  };
}

const DEFINES = { CITY_COUNT: CITIES.length };

export function CityMarkers({ materialRef, animated }: CityMarkersProps) {
  const geometry = useMemo(() => createGeometry(), []);
  useEffect(() => () => geometry.dispose(), [geometry]);

  const uniforms = useMemo(() => createUniforms(), []);

  useFrame((state, delta) => {
    const material = materialRef.current;
    if (!material) return;
    // Same scale PointsMaterial uses for size attenuation: half the drawing-buffer height.
    material.uniforms.uPointScale.value =
      (state.size.height * state.viewport.dpr) / 2;
    material.uniforms.uSceneOpacity.value = sceneCurrent.planet;
    if (!animated) return;

    material.uniforms.uTime.value += CITY_MARKERS.pulseSpeed * delta;
    const flash: Float32Array = material.uniforms.uFlash.value;
    for (let index = 0; index < flash.length; index++) {
      flash[index] = Math.max(
        0,
        flash[index] - delta / CITY_MARKERS.flashSeconds,
      );
    }
  });

  return (
    <points geometry={geometry}>
      <shaderMaterial
        ref={materialRef}
        vertexShader={cityMarkerShader.vertex}
        fragmentShader={cityMarkerShader.fragment}
        uniforms={uniforms}
        defines={DEFINES}
        transparent
        depthWrite={false}
        blending={AdditiveBlending}
      />
    </points>
  );
}
