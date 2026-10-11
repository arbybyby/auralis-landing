import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils";

export function Eyebrow({
  className,
  children,
  ...props
}: ComponentPropsWithoutRef<"p">) {
  return (
    <p
      className={cn(
        "inline-flex items-center gap-2.5 font-mono text-eyebrow text-muted uppercase",
        className,
      )}
      {...props}
    >
      <span aria-hidden className="size-1.5 rounded-full bg-accent" />
      {children}
    </p>
  );
}
