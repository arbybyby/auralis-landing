"use client";

import { useRef } from "react";

import { useMarqueeBoost } from "@/hooks/useMarqueeBoost";
import type { CssVariables } from "@/lib/cssVariables";
import { MARQUEE } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface MarqueeProps {
  items: readonly string[];
  className?: string;
}

const TRACK_STYLE: CssVariables = {
  "--marquee-duration": `${MARQUEE.loopSeconds}s`,
};

interface MarqueeListProps {
  items: readonly string[];
  /** The second copy that closes the loop: hidden from assistive technology, gone without motion. */
  isCopy?: boolean;
}

function MarqueeList({ items, isCopy = false }: MarqueeListProps) {
  return (
    <ul
      aria-hidden={isCopy || undefined}
      className={cn(
        // The trailing padding matches the gap, so the seam between the copies is spaced like the rest.
        "flex shrink-0 gap-x-12 pr-12 motion-reduce:shrink motion-reduce:flex-wrap motion-reduce:gap-y-3 motion-reduce:pr-0",
        isCopy && "motion-reduce:hidden",
      )}
    >
      {items.map((item) => (
        <li
          key={item}
          className="text-lg font-medium tracking-tight whitespace-nowrap text-muted"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

/**
 * A row that slides past forever: the track holds the list twice and moves by one copy's width, so
 * the loop has no seam. Pure CSS, so it runs without JavaScript; the edges fade, hover pauses it,
 * and fast scrolling briefly speeds it up. With reduced motion it is one still row that wraps.
 */
export function Marquee({ items, className }: MarqueeProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  useMarqueeBoost(trackRef);

  return (
    <div
      className={cn(
        "overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)] motion-reduce:[mask-image:none]",
        className,
      )}
    >
      <div
        ref={trackRef}
        style={TRACK_STYLE}
        className="flex w-max animate-marquee hover:[animation-play-state:paused] motion-reduce:w-auto"
      >
        <MarqueeList items={items} />
        <MarqueeList items={items} isCopy />
      </div>
    </div>
  );
}
