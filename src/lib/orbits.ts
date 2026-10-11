export interface OrbitRing {
  /** Ring radius relative to the planet's. */
  radiusScale: number;
  /** Tilt of the orbital plane away from edge-on, in radians. */
  inclination: number;
  /** Rotation of the tilted ring within the view, in radians. */
  node: number;
  /** Spin of the ring's highlight around the orbit, in radians per second. */
  spinSpeed: number;
  color: "cyan" | "violet";
}

/**
 * Euler rotation that turns a circle drawn in the XZ plane into this orbit. The ZXY order tilts
 * the plane first and then turns it, so `inclination` and `node` stay independent. Rings and the
 * satellites that ride them both use it, which keeps them on the same path.
 */
export function orbitRotation(
  ring: OrbitRing,
): [x: number, y: number, z: number, order: "ZXY"] {
  return [ring.inclination, 0, ring.node, "ZXY"];
}
