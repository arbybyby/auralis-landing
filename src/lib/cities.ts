import { latLonToVector, toRadians } from "@/lib/geo";
import type { Vector3Tuple } from "@/lib/geo";

interface City {
  id: string;
  /** Degrees north. */
  latitude: number;
  /** Degrees east. */
  longitude: number;
}

/** Cities the data arcs fly between. */
export const CITIES = [
  { id: "astana", latitude: 51.17, longitude: 71.45 },
  { id: "london", latitude: 51.51, longitude: -0.13 },
  { id: "newYork", latitude: 40.71, longitude: -74.01 },
  { id: "saoPaulo", latitude: -23.55, longitude: -46.63 },
  { id: "lagos", latitude: 6.52, longitude: 3.38 },
  { id: "capeTown", latitude: -33.92, longitude: 18.42 },
  { id: "dubai", latitude: 25.2, longitude: 55.27 },
  { id: "mumbai", latitude: 19.08, longitude: 72.88 },
  { id: "singapore", latitude: 1.35, longitude: 103.82 },
  { id: "tokyo", latitude: 35.68, longitude: 139.65 },
  { id: "sydney", latitude: -33.87, longitude: 151.21 },
  { id: "reykjavik", latitude: 64.15, longitude: -21.94 },
  { id: "nairobi", latitude: -1.29, longitude: 36.82 },
  { id: "losAngeles", latitude: 34.05, longitude: -118.24 },
] as const satisfies readonly City[];

export type CityId = (typeof CITIES)[number]["id"];

/** Unit vectors from the planet's centre to each city, in the order of `CITIES`. */
export const CITY_DIRECTIONS: readonly Vector3Tuple[] = CITIES.map((city) =>
  latLonToVector({
    latitude: toRadians(city.latitude),
    longitude: toRadians(city.longitude),
  }),
);

export function cityIndex(id: CityId): number {
  return CITIES.findIndex((city) => city.id === id);
}

/** Great-circle angle between two cities, in radians. */
export function cityAngle(from: number, to: number): number {
  const [ax, ay, az] = CITY_DIRECTIONS[from];
  const [bx, by, bz] = CITY_DIRECTIONS[to];
  const dot = ax * bx + ay * by + az * bz;
  return Math.acos(Math.min(1, Math.max(-1, dot)));
}

export interface Route {
  from: number;
  to: number;
  /** Great-circle angle between the two cities, in radians. */
  angle: number;
}

// Plenty for 14 cities, where most pairs qualify; the cap only guards against a bad range.
const MAX_ROUTE_ATTEMPTS = 50;

/**
 * Picks two different cities whose distance falls inside the range and writes them into `route`,
 * so a running animation can reuse one object instead of allocating per pick.
 */
export function pickRoute(
  route: Route,
  random: () => number,
  minAngle: number,
  maxAngle: number,
): void {
  for (let attempt = 0; attempt < MAX_ROUTE_ATTEMPTS; attempt++) {
    route.from = Math.floor(random() * CITIES.length);
    route.to = Math.floor(random() * CITIES.length);
    route.angle = cityAngle(route.from, route.to);
    if (
      route.from !== route.to &&
      route.angle >= minAngle &&
      route.angle <= maxAngle
    ) {
      return;
    }
  }
}
