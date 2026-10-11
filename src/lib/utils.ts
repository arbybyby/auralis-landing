import { clsx } from "clsx";
import type { ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Mirrors the custom tokens in globals.css. Without them tailwind-merge reads `text-h2` or
// `text-eyebrow` as a text colour and drops it whenever a real colour class follows.
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: ["display", "h2", "h3", "body", "small", "eyebrow"],
      spacing: ["gutter", "section"],
      container: ["site"],
      ease: ["out-expo"],
    },
  },
});

export function cn(...classes: ClassValue[]): string {
  return twMerge(clsx(classes));
}
