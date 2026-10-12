import { CatmullRomCurve3, Euler, MathUtils, Vector3 } from "three";

import { PLANET } from "@/lib/constants";
import { INTRO } from "@/lib/intro";
import type { IntroLayout } from "@/lib/intro";

export type IntroLayoutName = keyof typeof INTRO.layouts;

/**
 * The leader's route and the swarm's disk for one layout, in the globe's frame and in scene units.
 * The planet shader evaluates the same curve and the same swirl, so CPU and GPU always agree.
 */
export interface IntroPath {
  layout: IntroLayout;
  curve: CatmullRomCurve3;
  /** The curve's control points: the layout's own, then two that line it up with the orbit. */
  points: Vector3[];
  /** The disk's in-plane axes and its normal. */
  diskU: Vector3;
  diskV: Vector3;
  diskNormal: Vector3;
  /** Inner, outer and entry radius of the disk. */
  radii: Vector3;
  entryAngle: number;
  /** Angular speed, in radians per second, at which the leader joins the orbit. */
  entrySpeed: number;
}

/** Control points every path gains at its end: one on the orbit, one just before it. */
const ENTRY_POINTS = 2;

/** Control points per path; every layout needs the same number, since the shader is compiled for it. */
export const PATH_POINTS = INTRO.layouts.desktop.path.length + ENTRY_POINTS;

/** The shader's spline assumes this tension (Catmull-Rom's own). */
const CURVE_TENSION = 0.5;

/** Step for the numerical derivative of the curve at its end, as a share of the path. */
const END_STEP = 1e-3;

const LAUNCH_SECONDS = INTRO.phases.swarm - INTRO.phases.launch;

/** The last point to lock onto the globe settles at this time; the swarm maths can stop then. */
export const SWARM_END =
  INTRO.swarm.lock.start +
  INTRO.swarm.lock.oceanDelay +
  INTRO.swarm.lock.oceanSpread +
  INTRO.swarm.lock.window;

/** How far along its path the leader is: it sets off at the launch and speeds up all the way. */
export function launchProgress(time: number): number {
  const progress = MathUtils.clamp(
    (time - INTRO.phases.launch) / LAUNCH_SECONDS,
    0,
    1,
  );
  return progress ** INTRO.launchPower;
}

/**
 * Angle the swarm has turned through by `time`. It starts at the leader's own speed, speeds up
 * until its peak, then winds down. The planet shader mirrors this.
 */
export function swirlAngle(time: number, entrySpeed: number): number {
  const { acceleration, peak, decay } = INTRO.swarm;
  const elapsed = Math.max(time - INTRO.phases.swarm, 0);
  const rising = Math.min(elapsed, peak);
  const falling = Math.max(elapsed - peak, 0);
  const peakSpeed = entrySpeed + acceleration * peak;
  return (
    entrySpeed * rising +
    0.5 * acceleration * rising * rising +
    (peakSpeed / decay) * (1 - Math.exp(-decay * falling))
  );
}

/** The point at `angle` and `radius` on the circle spanned by `u` and `v`, written into `target`. */
function pointOnCircle(
  u: Vector3,
  v: Vector3,
  angle: number,
  radius: number,
  target: Vector3,
): Vector3 {
  return target
    .copy(u)
    .multiplyScalar(Math.cos(angle) * radius)
    .addScaledVector(v, Math.sin(angle) * radius);
}

/** The point on the disk at `angle` and `radius`, written into `target`. */
export function diskPoint(
  path: IntroPath,
  angle: number,
  radius: number,
  target: Vector3,
): Vector3 {
  return pointOnCircle(path.diskU, path.diskV, angle, radius, target);
}

/** Where the leader is at `time`: on its path during the launch, then circling in the disk. */
export function leaderPosition(
  path: IntroPath,
  time: number,
  target: Vector3,
): Vector3 {
  if (time < INTRO.phases.swarm) {
    return path.curve.getPoint(launchProgress(time), target);
  }
  return diskPoint(
    path,
    path.entryAngle + swirlAngle(time, path.entrySpeed),
    path.radii.z,
    target,
  );
}

function createIntroPath(layout: IntroLayout): IntroPath {
  const orientation = new Euler(-INTRO.disk.tilt, 0, INTRO.disk.roll, "ZXY");
  const diskU = new Vector3(1, 0, 0).applyEuler(orientation);
  const diskV = new Vector3(0, 1, 0).applyEuler(orientation);
  const diskNormal = new Vector3(0, 0, 1).applyEuler(orientation);
  const { inner, outer, entry, entryAngle } = layout.swarm;
  const radii = new Vector3(inner, outer, entry).multiplyScalar(PLANET.radius);

  // The path ends on the orbit, already heading along it, so the leader joins it without a kink.
  const onOrbit = pointOnCircle(
    diskU,
    diskV,
    entryAngle,
    radii.z,
    new Vector3(),
  );
  const heading = new Vector3()
    .copy(diskU)
    .multiplyScalar(-Math.sin(entryAngle))
    .addScaledVector(diskV, Math.cos(entryAngle));
  const leadIn = onOrbit
    .clone()
    .addScaledVector(heading, -INTRO.entryLeadIn * PLANET.radius);

  const points = [
    ...layout.path.map(([x, y, z]) =>
      new Vector3(x, y, z).multiplyScalar(PLANET.radius),
    ),
    leadIn,
    onOrbit,
  ];
  if (points.length !== PATH_POINTS) {
    throw new Error("Every intro layout needs the same number of path points.");
  }
  const curve = new CatmullRomCurve3(
    points,
    false,
    "catmullrom",
    CURVE_TENSION,
  );

  // Match the leader's speed as it reaches the orbit, so the swirl takes over without a jolt.
  const endDistance = curve
    .getPoint(1)
    .distanceTo(curve.getPoint(1 - END_STEP));
  const endRate = INTRO.launchPower / LAUNCH_SECONDS;
  const entrySpeed = ((endDistance / END_STEP) * endRate) / radii.z;

  return {
    layout,
    curve,
    points,
    diskU,
    diskV,
    diskNormal,
    radii,
    entryAngle,
    entrySpeed,
  };
}

const paths = new Map<IntroLayoutName, IntroPath>();

/** The intro path for a layout, built once and shared by everything that draws the intro. */
export function getIntroPath(name: IntroLayoutName): IntroPath {
  let path = paths.get(name);
  if (!path) {
    path = createIntroPath(INTRO.layouts[name]);
    paths.set(name, path);
  }
  return path;
}
