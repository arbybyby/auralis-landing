/** Formats a number as a GLSL float literal: GLSL rejects `1` where it expects a float. */
export function glslFloat(value: number): string {
  return Number.isInteger(value) ? value.toFixed(1) : String(value);
}

/** Formats an `#rrggbb` colour as a GLSL vec3 literal, with channels from 0 to 1. */
export function glslColor(hex: string): string {
  const channels = [1, 3, 5].map(
    (start) => parseInt(hex.slice(start, start + 2), 16) / 255,
  );
  return `vec3(${channels.map(glslFloat).join(", ")})`;
}
