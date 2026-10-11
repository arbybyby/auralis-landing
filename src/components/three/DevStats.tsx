import { Stats } from "@react-three/drei";

// stats.js pins its panel to the top-left with inline styles. Overriding them moves it to the
// bottom-right, above the hero's scroll hint and clear of the navbar and the Next.js dev indicator.
const PANEL_POSITION = "top-auto! left-auto! right-0 bottom-20";

/** Frame-rate panel for local development only. */
export function DevStats() {
  return <Stats className={PANEL_POSITION} />;
}
