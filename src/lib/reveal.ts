/**
 * Scroll reveals are declared in markup and run by hooks/useReveal.ts. These helpers produce the
 * attributes, so a typo in a variant fails the type check instead of silently doing nothing:
 *
 * - `data-reveal="<variant>"`: the element reveals on its own as it scrolls into view.
 * - `data-reveal="stagger"`: each direct child reveals as it scrolls into view, in the variant
 *   named by `data-reveal-child`; children that arrive together follow one another.
 * - `data-reveal="sequence"`: once the element scrolls into view, the descendants marked with
 *   `data-reveal-step="<variant>"` play one after another.
 *
 * Nothing is hidden by these attributes alone: the script hides what is still below the fold only
 * once it runs, so without it every word stays visible.
 */

const REVEAL_VARIANTS = [
  "fade-up",
  "fade-in",
  "scale-in",
  "mask-line",
  "eyebrow",
] as const;

/**
 * How an element comes into view. mask-line needs its text split into words (SplitLines), and
 * eyebrow draws a hairline under a small label.
 */
export type RevealVariant = (typeof REVEAL_VARIANTS)[number];

export function isRevealVariant(value: unknown): value is RevealVariant {
  return REVEAL_VARIANTS.some((variant) => variant === value);
}

export function reveal(variant: RevealVariant) {
  return { "data-reveal": variant } as const;
}

export function revealStagger(child: RevealVariant = "fade-up") {
  return { "data-reveal": "stagger", "data-reveal-child": child } as const;
}

export function revealSequence() {
  return { "data-reveal": "sequence" } as const;
}

export function revealStep(variant: RevealVariant) {
  return { "data-reveal-step": variant } as const;
}
