import type { ComponentProps } from "react";

import { Heading } from "@/components/ui/Heading";
import { SplitLines } from "@/components/ui/SplitLines";
import { reveal } from "@/lib/reveal";
import { toPlainText } from "@/lib/splitText";
import type { RichText } from "@/lib/splitText";

interface RevealHeadingProps extends Omit<
  ComponentProps<typeof Heading>,
  "children"
> {
  text: RichText;
}

/** A heading whose lines rise out of masks as it scrolls into view. */
export function RevealHeading({ text, ...props }: RevealHeadingProps) {
  return (
    <Heading aria-label={toPlainText(text)} {...reveal("mask-line")} {...props}>
      <SplitLines text={text} />
    </Heading>
  );
}
