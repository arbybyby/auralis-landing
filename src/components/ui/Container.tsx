import type { ComponentPropsWithoutRef, Ref } from "react";

import { cn } from "@/lib/utils";

interface ContainerProps extends ComponentPropsWithoutRef<"div"> {
  ref?: Ref<HTMLDivElement>;
}

export function Container({ className, ref, ...props }: ContainerProps) {
  return (
    <div
      ref={ref}
      className={cn("mx-auto w-full max-w-site px-gutter", className)}
      {...props}
    />
  );
}
