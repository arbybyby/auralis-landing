import { extend, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  Line,
  Vector3,
} from "three";
import type { IUniform, ShaderMaterial } from "three";

import { arcShader } from "@/components/three/arcShader";
import { CityMarkers } from "@/components/three/CityMarkers";
import { CITY_DIRECTIONS, cityAngle, cityIndex, pickRoute } from "@/lib/cities";
import type { Route } from "@/lib/cities";
import { BRAND_COLORS, DATA_ARCS, PLANET } from "@/lib/constants";
import { randomBetween } from "@/lib/random";

interface DataArcsProps {
  /** Arcs in flight at once. */
  count: number;
  /** False shows a few arcs frozen mid-flight instead of the live cycle. */
  animated: boolean;
}

type ArcPhase = "waiting" | "travelling" | "fading";

/** Where one arc is in its cycle: wait, fly to the destination, then fade out. */
interface ArcSlot extends Route {
  phase: ArcPhase;
  elapsed: number;
  duration: number;
}

type ArcUniforms = Record<string, IUniform>;

// <line> belongs to SVG in JSX, so R3F only knows THREE.Line once it is registered as <threeLine>.
extend({ ThreeLine: Line });

const CITY_VECTORS = CITY_DIRECTIONS.map(([x, y, z]) => new Vector3(x, y, z));
const CYAN = new Color(BRAND_COLORS.cyan);
const VIOLET = new Color(BRAND_COLORS.violet);

/** One polyline from t = 0 to 1, shared by every arc; the shader bends it between the cities. */
function createArcGeometry(): BufferGeometry {
  const vertexCount = DATA_ARCS.segments + 1;
  const t = new Float32Array(vertexCount);
  for (let index = 0; index < vertexCount; index++) {
    t[index] = index / DATA_ARCS.segments;
  }
  const geometry = new BufferGeometry();
  // Positions come from the shader; this buffer only gives the draw call its vertex count.
  geometry.setAttribute(
    "position",
    new BufferAttribute(new Float32Array(vertexCount * 3), 3),
  );
  geometry.setAttribute("aT", new BufferAttribute(t, 1));
  return geometry;
}

function applyRoute(uniforms: ArcUniforms, route: Route, color: Color): void {
  uniforms.uStart.value.copy(CITY_VECTORS[route.from]);
  uniforms.uEnd.value.copy(CITY_VECTORS[route.to]);
  uniforms.uAngle.value = route.angle;
  uniforms.uLift.value = DATA_ARCS.liftPerRadian * route.angle;
  uniforms.uColor.value.copy(color);
}

/**
 * Uniforms for one arc. Every arc starts on one of the fixed routes: frozen mid-flight when motion
 * is reduced, or hidden until its first live pick otherwise, so no arc ever starts without a path.
 */
function createArcUniforms(index: number, animated: boolean): ArcUniforms {
  const [fromId, toId] =
    DATA_ARCS.staticRoutes[index % DATA_ARCS.staticRoutes.length];
  const from = cityIndex(fromId);
  const to = cityIndex(toId);
  const uniforms: ArcUniforms = {
    uStart: { value: new Vector3() },
    uEnd: { value: new Vector3() },
    uAngle: { value: 0 },
    uLift: { value: 0 },
    uColor: { value: new Color() },
    uProgress: { value: animated ? 0 : DATA_ARCS.staticProgress },
    uOpacity: { value: animated ? 0 : 1 },
    uPlanetRadius: { value: PLANET.radius },
  };
  applyRoute(uniforms, { from, to, angle: cityAngle(from, to) }, CYAN);
  return uniforms;
}

function travelSeconds(angle: number): number {
  return (
    DATA_ARCS.travelSeconds.base + DATA_ARCS.travelSeconds.perRadian * angle
  );
}

function createWaitingSlot(): ArcSlot {
  return {
    phase: "waiting",
    elapsed: 0,
    // Stagger the first launches so the arcs never fire in step.
    duration: randomBetween(Math.random, 0, DATA_ARCS.gapSeconds.max * 2),
    from: 0,
    to: 0,
    angle: 0,
  };
}

/** Moves one arc through its cycle. Returns the city it just landed on, or -1. */
function advanceSlot(
  slot: ArcSlot,
  uniforms: ArcUniforms,
  delta: number,
): number {
  slot.elapsed += delta;
  if (slot.elapsed < slot.duration) {
    if (slot.phase === "travelling") {
      uniforms.uProgress.value = slot.elapsed / slot.duration;
    } else if (slot.phase === "fading") {
      uniforms.uOpacity.value = 1 - slot.elapsed / slot.duration;
    }
    return -1;
  }

  slot.elapsed = 0;
  switch (slot.phase) {
    case "waiting":
      pickRoute(
        slot,
        Math.random,
        DATA_ARCS.distance.min,
        DATA_ARCS.distance.max,
      );
      applyRoute(
        uniforms,
        slot,
        Math.random() < DATA_ARCS.violetShare ? VIOLET : CYAN,
      );
      uniforms.uProgress.value = 0;
      uniforms.uOpacity.value = 1;
      slot.phase = "travelling";
      slot.duration = travelSeconds(slot.angle);
      return -1;
    case "travelling":
      uniforms.uProgress.value = 1;
      slot.phase = "fading";
      slot.duration = DATA_ARCS.fadeSeconds;
      return slot.to;
    case "fading":
      uniforms.uOpacity.value = 0;
      slot.phase = "waiting";
      slot.duration = randomBetween(
        Math.random,
        DATA_ARCS.gapSeconds.min,
        DATA_ARCS.gapSeconds.max,
      );
      return -1;
  }
}

export function DataArcs({ count, animated }: DataArcsProps) {
  const markersRef = useRef<ShaderMaterial>(null);
  const arcMaterials = useRef<(ShaderMaterial | null)[]>([]);
  const slots = useRef<ArcSlot[]>([]);

  const geometry = useMemo(() => createArcGeometry(), []);
  useEffect(() => () => geometry.dispose(), [geometry]);

  const arcCount = animated
    ? count
    : Math.min(count, DATA_ARCS.staticRoutes.length);
  const arcUniforms = useMemo(
    () =>
      Array.from({ length: arcCount }, (_, index) =>
        createArcUniforms(index, animated),
      ),
    [arcCount, animated],
  );

  useEffect(() => {
    slots.current = animated ? arcUniforms.map(() => createWaitingSlot()) : [];
  }, [arcUniforms, animated]);

  useFrame((_, delta) => {
    for (let index = 0; index < slots.current.length; index++) {
      const material = arcMaterials.current[index];
      if (!material) continue;
      const landedOn = advanceSlot(
        slots.current[index],
        material.uniforms,
        delta,
      );
      if (landedOn >= 0 && markersRef.current) {
        markersRef.current.uniforms.uFlash.value[landedOn] = 1;
      }
    }
  });

  return (
    <>
      <CityMarkers materialRef={markersRef} animated={animated} />
      {arcUniforms.map((uniforms, index) => (
        // The shader bends the arc, so the flat geometry's bounds are no use for culling.
        <threeLine key={index} geometry={geometry} frustumCulled={false}>
          <shaderMaterial
            ref={(material) => {
              arcMaterials.current[index] = material;
            }}
            vertexShader={arcShader.vertex}
            fragmentShader={arcShader.fragment}
            uniforms={uniforms}
            transparent
            depthWrite={false}
            blending={AdditiveBlending}
          />
        </threeLine>
      ))}
    </>
  );
}
