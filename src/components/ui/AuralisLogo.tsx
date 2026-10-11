import type { ComponentPropsWithoutRef } from "react";

import { site } from "@/content/site";
import { cn } from "@/lib/utils";

export function AuralisLogo({
  className,
  ...props
}: ComponentPropsWithoutRef<"span">) {
  return (
    <span
      className={cn("inline-flex items-center gap-2.5", className)}
      {...props}
    >
      <svg
        aria-hidden
        viewBox="0 0 32 32"
        className="size-7 text-text"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      >
        <circle cx="16" cy="16" r="6" />
        <path d="M4.5 21.5C8 8.5 24 5 28 12" className="stroke-accent" />
        <circle cx="28" cy="12" r="1.75" className="fill-accent stroke-none" />
      </svg>
      <span className="text-lg font-medium tracking-tight">{site.name}</span>
    </span>
  );
}
