import type { ComponentPropsWithoutRef, Ref } from "react";

import { Container } from "@/components/ui/Container";
import { cn } from "@/lib/utils";

type SectionElementProps = ComponentPropsWithoutRef<"section"> & {
  ref?: Ref<HTMLElement>;
};

interface SectionProps extends SectionElementProps {
  as?: "section" | "div";
  /** Id of the heading that names this section. */
  labelledBy?: string;
  /** Classes for the inner container. */
  containerClassName?: string;
}

export function Section({
  as: tag = "section",
  ref,
  labelledBy,
  className,
  containerClassName,
  children,
  ...props
}: SectionProps) {
  // "section" and "div" take identical props here; the cast keeps the ref typed as HTMLElement.
  const Tag = tag as "section";
  return (
    <Tag
      ref={ref}
      aria-labelledby={labelledBy}
      // Offsets in-page anchors so the fixed navbar does not cover the heading.
      className={cn("relative scroll-mt-20 py-section", className)}
      {...props}
    >
      <Container className={containerClassName}>{children}</Container>
    </Tag>
  );
}
