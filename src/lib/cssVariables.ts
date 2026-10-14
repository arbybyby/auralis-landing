import type { CSSProperties } from "react";

/** Inline styles that also set CSS custom properties, which React's style type leaves out. */
export type CssVariables = CSSProperties & Record<`--${string}`, string>;
