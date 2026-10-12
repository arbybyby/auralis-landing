import { glslFloat as float } from "@/components/three/glsl";
import { simplexNoise } from "@/components/three/simplexNoise";
import { PLANET } from "@/lib/constants";
import { INTRO } from "@/lib/intro";

const { swarm, phases } = INTRO;
const { condense, lock } = swarm;

/** Seconds the condense clock has run by the end of the phase, slow stretch included. */
const condenseLength =
  condense.duration *
  (1 - (1 - condense.slowRate) * (1 - condense.slowFrom) * 0.5);

/** The swirl's speed as the condense begins, as a share of its peak: it has wound down since. */
const calmFrom = Math.exp(
  -swarm.decay * (phases.condense - phases.swarm - swarm.peak),
);

/**
 * Soft round particles on a sphere. Points shrink with distance like PointsMaterial, run from cyan
 * at the equator to violet at the poles, brighten towards the silhouette, and lift a little on the
 * side facing the pointer.
 *
 * During the intro every point lives a whole life first: born on the leader's trail, it rides the
 * trail into a spinning, spiral-armed disk, spirals inwards as the swirl calms, and locks onto its
 * place on the globe, land first and ocean last, the last of them in slow motion. All of it is a
 * function of time, so the CPU never touches a point.
 */
export const planetShader = {
  vertex: /* glsl */ `
    uniform float uPointScale;
    uniform float uLandSize;
    uniform float uOceanSize;
    // View-space direction towards the pointer, and how strongly that side lights up.
    uniform vec3 uGlowDirection;
    uniform float uGlowStrength;
    uniform vec3 uColorEquator;
    uniform vec3 uColorPole;

    attribute float aLand;
    // Stable per-point random in [0, 1), so neighbouring points differ in size, hue and timing.
    attribute float aSeed;
    // Four more: birth time, place on the trail, orbit radius, and arm.
    attribute vec4 aRandom;

    varying float vLand;
    varying float vFacing;
    varying float vGradient;
    varying float vGlow;
    varying float vAssembled;
    varying float vVisible;
    varying vec3 vSwarmColor;

    // Narrows the lit side to a soft patch rather than a whole hemisphere.
    const float GLOW_FOCUS = 3.0;

    // The intro's swarm, by far the heaviest part of the shader. Devices that never play the full
    // intro compile without INTRO_SWARM and leave all of it out.
    #ifdef INTRO_SWARM
    // uIntro is 1 while the swarm is in flight and 0 once the planet is whole, which skips all of
    // the maths below. Swarm positions are in the globe's frame, in scene units.
    uniform float uIntro;
    uniform float uTime;
    uniform vec3 uPath[PATH_POINTS];
    uniform vec3 uDiskU;
    uniform vec3 uDiskV;
    uniform vec3 uDiskNormal;
    // Inner, outer and entry radius of the disk.
    uniform vec3 uSwarmRadii;
    uniform float uEntrySpeed;
    uniform float uSwarmShare;
    uniform float uEnergy;
    // Undoes the planet's tilt and spin, taking the globe's frame into this point cloud's own.
    uniform mat3 uToPlanet;
    uniform vec3 uColorHot;

    const float TAU = 6.2831853;

    const float LAUNCH_START = ${float(phases.launch)};
    const float LAUNCH_SECONDS = ${float(phases.swarm - phases.launch)};
    const float LAUNCH_POWER = ${float(INTRO.launchPower)};
    const float SWIRL_START = ${float(phases.swarm)};
    const float SWIRL_SECONDS = ${float(phases.condense - phases.swarm)};
    const float SWIRL_ACCELERATION = ${float(swarm.acceleration)};
    const float SWIRL_PEAK = ${float(swarm.peak)};
    const float SWIRL_DECAY = ${float(swarm.decay)};
    const float CALM_FROM = ${float(calmFrom)};
    const float CALM_POWER = ${float(swarm.calm)};

    const float CONDENSE_START = ${float(phases.condense)};
    const float CONDENSE_SECONDS = ${float(condense.duration)};
    const float CONDENSE_LENGTH = ${float(condenseLength)};
    const float SLOW_FROM = ${float(condense.slowFrom * condense.duration)};
    const float SLOW_RATE = ${float(condense.slowRate)};

    const float BIRTH_START = ${float(swarm.birthStart)};
    const float BIRTH_SPAN = ${float(swarm.birthSpan)};
    const float BIRTH_FADE = ${float(swarm.birthFade)};
    const float FLOW_SECONDS = ${float(swarm.flowSeconds)};
    const float TRAIL_FROM = ${float(swarm.trailFrom)};
    const float PEEL_OFF = ${float(swarm.peelOff)};

    const float ARMS = ${float(swarm.arms)};
    const float SPIRAL_TWIST = ${float(swarm.twist)};
    const float ARM_WIDTH = ${float(swarm.armWidth)};
    const float RADIUS_BIAS = ${float(swarm.radiusBias)};
    const float THICKNESS = ${float(swarm.thickness * PLANET.radius)};
    const float SPIN_FALLOFF = ${float(swarm.spinFalloff)};

    const float INWARD_SECONDS = ${float(swarm.inward)};
    const float LOCK_RADIUS = ${float(swarm.lockRadius * PLANET.radius)};
    const float LAND_FROM = ${float(lock.land.from)};
    const float LAND_SPAN = ${float(lock.land.to - lock.land.from)};
    const float OCEAN_FROM = ${float(lock.ocean.from)};
    const float OCEAN_SPAN = ${float(lock.ocean.to - lock.ocean.from)};
    const float SETTLE_SECONDS = ${float(lock.settle)};
    // Points set off to settle over this much of the condense clock, so the last lands as it ends.
    const float STREAM_SECONDS = CONDENSE_LENGTH - SETTLE_SECONDS;
    const float GATHER_SCALE = ${float(swarm.gatherScale)};

    const float NOISE_SCALE = ${float(swarm.noise.scale)};
    const float NOISE_SPEED = ${float(swarm.noise.speed)};
    const float NOISE_AMOUNT = ${float(swarm.noise.amount * PLANET.radius)};
    // Shifts the second noise sample well away from the first, so the two are unrelated.
    const vec3 NOISE_OFFSET = vec3(19.1, 33.4, 47.2);

    const float SWARM_SIZE = ${float(swarm.size)};
    const float NEWBORN_SIZE = ${float(swarm.newbornSize)};
    const float ENERGY_SIZE = ${float(swarm.energySize)};
    const float ENERGY_GLOW = ${float(swarm.energyGlow)};
    const float HEAT_SECONDS = ${float(swarm.heatSeconds)};
    const float VIOLET_FROM = ${float(swarm.violet.from)};
    const float VIOLET_TO = ${float(swarm.violet.to)};

    // Multipliers that spread one random value into another, unrelated one.
    const float MEMBER_SPREAD = 97.0;
    const float LIFT_SPREAD = 13.0;

    ${simplexNoise}

    // Divergence-free drift: the cross product of two noise gradients.
    vec3 curlNoise(vec3 p) {
      vec3 first;
      vec3 second;
      simplexNoise(p, first);
      simplexNoise(p + NOISE_OFFSET, second);
      return cross(first, second);
    }

    // Reaches exactly 1, so the assembled planet matches the static one.
    float easeOutCubic(float t) {
      float left = 1.0 - t;
      return 1.0 - left * left * left;
    }

    // Where smoothstep (an ease-in-out) reaches a share: when a point's turn in the stream comes.
    float inverseSmoothstep(float share) {
      return 0.5 - sin(asin(1.0 - 2.0 * share) / 3.0);
    }

    // Seconds on the condense phase's own clock. It keeps real time, then over its last stretch
    // slows smoothly (along a smoothstep) to SLOW_RATE; this is the integral of that speed.
    float condenseClock(float time) {
      float elapsed = clamp(time - CONDENSE_START, 0.0, CONDENSE_SECONDS);
      float stretch = CONDENSE_SECONDS - SLOW_FROM;
      float slowing = max(elapsed - SLOW_FROM, 0.0) / stretch;
      return elapsed - (1.0 - SLOW_RATE) * stretch * slowing * slowing * slowing * (1.0 - 0.5 * slowing);
    }

    // The leader's path: Catmull-Rom with tension 0.5 and extrapolated ends, exactly the curve
    // three.js draws for the same control points.
    vec3 pathPoint(float t) {
      float scaled = t * float(PATH_POINTS - 1);
      int segment = min(int(scaled), PATH_POINTS - 2);
      float w = scaled - float(segment);
      vec3 p1 = uPath[segment];
      vec3 p2 = uPath[segment + 1];
      vec3 p0 = segment == 0 ? 2.0 * p1 - p2 : uPath[max(segment - 1, 0)];
      vec3 p3 = segment == PATH_POINTS - 2 ? 2.0 * p2 - p1 : uPath[min(segment + 2, PATH_POINTS - 1)];
      vec3 t0 = 0.5 * (p2 - p0);
      vec3 t1 = 0.5 * (p3 - p1);
      vec3 c2 = -3.0 * p1 + 3.0 * p2 - 2.0 * t0 - t1;
      vec3 c3 = 2.0 * p1 - 2.0 * p2 + t0 + t1;
      return p1 + w * (t0 + w * (c2 + w * c3));
    }

    // Mirrors launchProgress() in introMotion.ts.
    float launchProgress(float time) {
      return pow(clamp((time - LAUNCH_START) / LAUNCH_SECONDS, 0.0, 1.0), LAUNCH_POWER);
    }

    // Mirrors swirlAngle() in introMotion.ts: the swirl up to the condense phase.
    float swirlAngle(float time) {
      float elapsed = clamp(time - SWIRL_START, 0.0, SWIRL_SECONDS);
      float rising = min(elapsed, SWIRL_PEAK);
      float falling = max(elapsed - SWIRL_PEAK, 0.0);
      float peakSpeed = uEntrySpeed + SWIRL_ACCELERATION * SWIRL_PEAK;
      return uEntrySpeed * rising + 0.5 * SWIRL_ACCELERATION * rising * rising
        + peakSpeed / SWIRL_DECAY * (1.0 - exp(-SWIRL_DECAY * falling));
    }

    // The angle the swirl adds through the condense phase, as its speed eases down to nothing.
    float calmAngle(float clock) {
      float speed = (uEntrySpeed + SWIRL_ACCELERATION * SWIRL_PEAK) * CALM_FROM;
      float left = 1.0 - clock / CONDENSE_LENGTH;
      return speed * CONDENSE_LENGTH / (CALM_POWER + 1.0) * (1.0 - pow(left, CALM_POWER + 1.0));
    }
    #endif

    void main() {
      vec3 local = position;
      float assembled = 1.0;
      float visible = 1.0;
      float sizeBoost = 1.0;
      // Only seen in flight: a finished point takes on the planet's colour in full.
      vec3 swarmColor = vec3(0.0);

      #ifdef INTRO_SWARM
      if (uIntro > 0.5) {
        // Its turn to settle comes at its place in the stream, land first and ocean last. The
        // stream eases in and out; the point eases out as it lands.
        float clock = condenseClock(uTime);
        float slot = mix(OCEAN_FROM + aSeed * OCEAN_SPAN, LAND_FROM + aSeed * LAND_SPAN, aLand);
        float settle = (clock - STREAM_SECONDS * inverseSmoothstep(slot)) / SETTLE_SECONDS;
        assembled = easeOutCubic(clamp(settle, 0.0, 1.0));

        // Born somewhere on the trail behind the leader, more and more of them as time goes on,
        // then carried along it towards the orbit, gaining speed like the leader did.
        float birth = BIRTH_START + BIRTH_SPAN * sqrt(aRandom.x);
        float age = uTime - birth;
        float flow = clamp(age / FLOW_SECONDS, 0.0, 1.0);
        float bornAt = mix(TRAIL_FROM, launchProgress(birth), aRandom.y);
        vec3 onTrail = pathPoint(mix(bornAt, 1.0, flow * flow));

        // Its place in the disk: on one of the spiral arms, at a radius that shrinks as the swarm
        // condenses, swept round by a swirl that turns the inner disk faster. The swirl builds at
        // the point's starting radius, then calms at whatever radius it has drawn in to.
        float inward = smoothstep(0.0, INWARD_SECONDS, clock);
        float startRadius = mix(uSwarmRadii.x, uSwarmRadii.y, pow(aRandom.z, RADIUS_BIAS));
        float radius = mix(startRadius, LOCK_RADIUS, inward);
        float armSlot = aRandom.w * ARMS;
        float angle = floor(armSlot) * TAU / ARMS
          + SPIRAL_TWIST * log(startRadius / uSwarmRadii.x)
          + (fract(armSlot) - 0.5) * ARM_WIDTH
          + swirlAngle(uTime) * pow(uSwarmRadii.z / startRadius, SPIN_FALLOFF)
          + calmAngle(clock) * pow(uSwarmRadii.z / radius, SPIN_FALLOFF);
        float lift = (fract(aRandom.z * LIFT_SPREAD) - 0.5) * THICKNESS * (1.0 - inward);
        vec3 inDisk = (uDiskU * cos(angle) + uDiskV * sin(angle)) * radius + uDiskNormal * lift;
        float turbulence = NOISE_AMOUNT * uEnergy * (1.0 - inward);
        inDisk += curlNoise(inDisk * NOISE_SCALE + vec3(0.0, 0.0, uTime * NOISE_SPEED)) * turbulence;

        vec3 inFlight = uToPlanet * mix(onTrail, inDisk, smoothstep(PEEL_OFF, 1.0, flow));
        // The rest of the points never fly: they gather in from just outside as the planet forms.
        bool flies = fract(aSeed * MEMBER_SPREAD) < uSwarmShare;
        local = flies ? mix(inFlight, position, assembled) : position * mix(GATHER_SCALE, 1.0, assembled);
        visible = flies ? smoothstep(0.0, BIRTH_FADE, age) : assembled;

        // White-hot when born, cooling to cyan, and violet for older points far out in the disk.
        float heat = 1.0 - smoothstep(0.0, HEAT_SECONDS, age);
        float cool = smoothstep(VIOLET_FROM, VIOLET_TO, age) * aRandom.z;
        swarmColor = mix(mix(uColorEquator, uColorPole, cool), uColorHot, heat) * (1.0 + ENERGY_GLOW * uEnergy);
        sizeBoost = mix(SWARM_SIZE * (1.0 + NEWBORN_SIZE * heat) * (1.0 + ENERGY_SIZE * uEnergy), 1.0, assembled);
      }
      #endif

      vec4 viewPosition = modelViewMatrix * vec4(local, 1.0);
      gl_Position = projectionMatrix * viewPosition;

      // Follow the planet's scale so the smaller mobile globe gets proportionally finer points.
      float modelScale = length(modelMatrix[0].xyz);
      float size = mix(uOceanSize, uLandSize, aLand) * mix(0.7, 1.3, aSeed) * sizeBoost;
      // Points not yet born take no space at all, so they cost no fill.
      gl_PointSize = visible > 0.0 ? size * modelScale * uPointScale / -viewPosition.z : 0.0;

      // 1 facing the camera, 0 on the silhouette, negative on the far hemisphere. Measured on the
      // finished sphere, so the shading is already in place as the points arrive.
      vec3 viewNormal = normalize(normalMatrix * position);
      vFacing = dot(viewNormal, normalize(-viewPosition.xyz));
      vGlow = pow(max(dot(viewNormal, uGlowDirection), 0.0), GLOW_FOCUS) * uGlowStrength;

      float latitude = abs(normalize(position).y);
      vGradient = clamp(latitude + (aSeed - 0.5) * 0.3, 0.0, 1.0);
      vLand = aLand;
      vAssembled = assembled;
      vVisible = visible;
      vSwarmColor = swarmColor;
    }
  `,

  fragment: /* glsl */ `
    // Scroll-driven multiplier on this layer's opacity; 1 is the hero look.
    uniform float uSceneOpacity;
    uniform vec3 uColorEquator;
    uniform vec3 uColorPole;
    uniform float uLandOpacity;
    uniform float uOceanOpacity;

    varying float vLand;
    varying float vFacing;
    varying float vGradient;
    varying float vGlow;
    varying float vAssembled;
    varying float vVisible;
    varying vec3 vSwarmColor;

    // The far hemisphere shows faintly through the near one, so the globe keeps its depth.
    const float BACK_OPACITY = 0.12;
    const float RIM_BOOST = 1.5;
    const float RIM_SHARPNESS = 3.0;
    const float SWARM_OPACITY = ${float(swarm.opacity)};

    void main() {
      float alpha = 1.0 - smoothstep(0.0, 0.5, length(gl_PointCoord - 0.5));
      if (alpha <= 0.0) discard;

      float rim = pow(1.0 - abs(vFacing), RIM_SHARPNESS);
      float hemisphere = mix(BACK_OPACITY, 1.0, smoothstep(-0.3, 0.1, vFacing));
      float planetOpacity = mix(uOceanOpacity, uLandOpacity, vLand) * hemisphere;
      vec3 planetColor = mix(uColorEquator, uColorPole, vGradient) * (1.0 + rim * RIM_BOOST + vGlow);

      // In flight a point has its own colour and opacity; it takes on the planet's as it locks.
      vec3 color = mix(vSwarmColor, planetColor, vAssembled);
      float opacity = mix(SWARM_OPACITY, planetOpacity, vAssembled) * vVisible;
      gl_FragColor = vec4(color, alpha * opacity * uSceneOpacity);
      #include <colorspace_fragment>
    }
  `,
};
