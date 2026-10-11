import type { GeometryCollection, Topology } from "topojson-specification";
import { feature } from "topojson-client";

export interface LandMask {
  /** Share of the sphere's surface covered by land, from 0 to 1. */
  landFraction: number;
  /** Whether a point on the globe is land. Latitude and longitude are in radians. */
  isLand(latitude: number, longitude: number): boolean;
}

type LandTopology = Topology<{ land: GeometryCollection }>;
/** A polygon ring as [longitude, latitude] pairs in degrees. */
type Ring = number[][];

// Equirectangular raster: one pixel spans about 0.35° of longitude and latitude.
const MASK_WIDTH = 1024;
const MASK_HEIGHT = 512;
// Canvas antialiasing softens the coastline; a pixel at least half covered counts as land.
const LAND_ALPHA_THRESHOLD = 128;

let landMask: Promise<LandMask> | undefined;

/**
 * Rasterises Natural Earth's 1:110m land polygons once per page load. The topology is imported
 * lazily so it ships in its own chunk, and the promise is cached so components can suspend on it
 * with React's `use` without repeating the work.
 */
export function loadLandMask(): Promise<LandMask> {
  landMask ??= import("world-atlas/land-110m.json").then(
    ({ default: topology }) => rasterize(topology),
  );
  return landMask;
}

function rasterize(topology: LandTopology): LandMask {
  const canvas = document.createElement("canvas");
  canvas.width = MASK_WIDTH;
  canvas.height = MASK_HEIGHT;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas 2D is unavailable");

  context.fillStyle = "#fff";
  for (const polygon of landPolygons(topology)) {
    const rings = polygon.map(unwrapRing);
    // Unwrapped rings can reach past ±180°; shifted copies paint that overflow on the far side.
    for (const offset of [-360, 0, 360]) {
      context.beginPath();
      for (const ring of rings) traceRing(context, ring, offset);
      // Even-odd keeps inner rings (lakes, inland seas) empty whatever their winding.
      context.fill("evenodd");
    }
  }

  const { data } = context.getImageData(0, 0, MASK_WIDTH, MASK_HEIGHT);
  const pixels = new Uint8Array(MASK_WIDTH * MASK_HEIGHT);
  let landArea = 0;
  let totalArea = 0;

  for (let y = 0; y < MASK_HEIGHT; y++) {
    // Rows shrink towards the poles on the sphere, so weight each one by cos(latitude).
    const rowWeight = Math.cos(((y + 0.5) / MASK_HEIGHT - 0.5) * Math.PI);
    for (let x = 0; x < MASK_WIDTH; x++) {
      const index = y * MASK_WIDTH + x;
      if (data[index * 4 + 3] >= LAND_ALPHA_THRESHOLD) {
        pixels[index] = 1;
        landArea += rowWeight;
      }
    }
    totalArea += rowWeight * MASK_WIDTH;
  }

  return {
    landFraction: landArea / totalArea,
    isLand(latitude, longitude) {
      const x = Math.floor(
        ((longitude + Math.PI) / (2 * Math.PI)) * MASK_WIDTH,
      );
      const y = Math.floor(((Math.PI / 2 - latitude) / Math.PI) * MASK_HEIGHT);
      // Clamp so longitude π and latitude -π/2 land on the last column and row.
      const index =
        Math.min(y, MASK_HEIGHT - 1) * MASK_WIDTH + Math.min(x, MASK_WIDTH - 1);
      return pixels[index] === 1;
    },
  };
}

function landPolygons(topology: LandTopology): Ring[][] {
  return feature(topology, topology.objects.land).features.flatMap(
    ({ geometry }) => {
      if (geometry.type === "Polygon") return [geometry.coordinates];
      if (geometry.type === "MultiPolygon") return geometry.coordinates;
      return [];
    },
  );
}

/**
 * world-atlas keeps rings whole on the sphere, so a ring crossing the antimeridian jumps between
 * +180° and -180°. Undoing each jump keeps the ring continuous on the flat map.
 */
function unwrapRing(ring: Ring): Ring {
  let shift = 0;
  return ring.map(([longitude, latitude], index) => {
    if (index > 0) {
      const step = longitude - ring[index - 1][0];
      if (step > 180) shift -= 360;
      else if (step < -180) shift += 360;
    }
    return [longitude + shift, latitude];
  });
}

function traceRing(
  context: CanvasRenderingContext2D,
  ring: Ring,
  offset: number,
): void {
  const toX = (longitude: number) =>
    ((longitude + offset + 180) / 360) * MASK_WIDTH;
  const toY = (latitude: number) => ((90 - latitude) / 180) * MASK_HEIGHT;

  ring.forEach(([longitude, latitude], index) => {
    if (index === 0) context.moveTo(toX(longitude), toY(latitude));
    else context.lineTo(toX(longitude), toY(latitude));
  });

  // After unwrapping, a ring that circles a pole (Antarctica) ends a full turn from where it
  // started. Close it along that pole's edge of the map instead of straight back across.
  const [firstLongitude] = ring[0];
  const [lastLongitude, lastLatitude] = ring[ring.length - 1];
  if (Math.abs(lastLongitude - firstLongitude) > 180) {
    const poleY = lastLatitude < 0 ? MASK_HEIGHT : 0;
    context.lineTo(toX(lastLongitude), poleY);
    context.lineTo(toX(firstLongitude), poleY);
  }
  context.closePath();
}
