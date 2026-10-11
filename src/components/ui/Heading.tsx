import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils";

type HeadingLevel = 1 | 2 | 3;

interface HeadingProps extends ComponentPropsWithoutRef<"h2"> {
  level: HeadingLevel;
}

// Visual size follows the level so every section heading looks consistent.
const levelStyles: Record<HeadingLevel, string> = {
  1: "text-display font-medium text-balance",
  2: "text-h2 font-medium text-balance",
  3: "text-h3 font-medium",
};

export function Heading({ level, className, ...props }: HeadingProps) {
  const Tag = `h${level}` as const;
  return <Tag className={cn(levelStyles[level], className)} {...props} />;
}

/** Italic serif highlight for a single word inside a heading. */
export function Accent({ children }: { children: string }) {
  return <span className="font-serif text-accent italic">{children}</span>;
}
