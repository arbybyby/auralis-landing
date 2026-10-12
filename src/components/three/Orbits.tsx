import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
} from "three";
import type { LineLoop, ShaderMaterial } from "three";

import { orbitShader } from "@/components/three/orbitShader";
import { BRAND_COLORS, ORBITS, PLANET } from "@/lib/constants";
import { introState } from "@/lib/introStore";
import { orbitRotation } from "@/lib/orbits";
import type { OrbitRing } from "@/lib/orbits";
import { sceneCurrent } from "@/lib/sceneStore";

interface OrbitsProps {
  /** How many of the configured rings to draw, innermost first. */
  count: number;
  /** False holds every ring still. */
  animated: boolean;
}

interface OrbitProps {
  ring: OrbitRing;
  geometry: BufferGeometry;
  animated: boolean;
}

/** Unit circle in the XZ plane; each ring scales it to its own radius in the shader. */
function createCircle(segments: number): BufferGeometry {
  const positions = new Float32Array(segments * 3);
  for (let index = 0; index < segments; index++) {
    const angle = (index / segments) * Math.PI * 2;
    positions.set([Math.cos(angle), 0, Math.sin(angle)], index * 3);
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(positions, 3));
  return geometry;
}

function Orbit({ ring, geometry, animated }: OrbitProps) {
  const spinRef = useRef<LineLoop>(null);
  const materialRef = useRef<ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uRadius: { value: PLANET.radius * ring.radiusScale },
      uPlanetRadius: { value: PLANET.radius },
      uColor: { value: new Color(BRAND_COLORS[ring.color]) },
      uMinOpacity: { value: ORBITS.opacity.min },
      uMaxOpacity: { value: ORBITS.opacity.max },
      uSharpness: { value: ORBITS.highlightSharpness },
      uSceneOpacity: { value: 1 },
      uDraw: { value: 1 },
    }),
    [ring],
  );

  useFrame((_, delta) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uSceneOpacity.value = sceneCurrent.orbits;
      materialRef.current.uniforms.uDraw.value = introState.orbits;
    }
    // Spinning a circle about its own axis leaves the path in place and sweeps the highlight round.
    if (animated && spinRef.current) {
      spinRef.current.rotation.y += ring.spinSpeed * delta;
    }
  });

  return (
    <group rotation={orbitRotation(ring)}>
      {/* The shader scales the ring, so the unit circle's bounds are no use for culling. */}
      <lineLoop ref={spinRef} geometry={geometry} frustumCulled={false}>
        <shaderMaterial
          ref={materialRef}
          vertexShader={orbitShader.vertex}
          fragmentShader={orbitShader.fragment}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </lineLoop>
    </group>
  );
}

export function Orbits({ count, animated }: OrbitsProps) {
  const geometry = useMemo(() => createCircle(ORBITS.segments), []);
  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <>
      {ORBITS.rings.slice(0, count).map((ring) => (
        <Orbit
          key={ring.radiusScale}
          ring={ring}
          geometry={geometry}
          animated={animated}
        />
      ))}
    </>
  );
}
