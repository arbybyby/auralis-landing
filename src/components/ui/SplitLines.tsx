import { Fragment } from "react";

import { Accent } from "@/components/ui/Heading";
import { splitWords } from "@/lib/splitText";
import type { RichText } from "@/lib/splitText";

interface SplitLinesProps {
  text: RichText;
}

/**
 * Renders text one word per mask, so the words can rise from below their own clips and the words
 * that share a line rise together: the mask-line reveal, and the hero headline in the intro. Words
 * stay whole and wrap only at spaces, so the text lays out exactly as plain text would, accent
 * included. Hidden from assistive technology: the element around it carries the full text, as a
 * heading's aria-label or as a visually hidden copy.
 */
export function SplitLines({ text }: SplitLinesProps) {
  return (
    <span aria-hidden>
      {splitWords(text).map((word, wordIndex) => (
        <Fragment key={wordIndex}>
          {wordIndex > 0 && " "}
          <span className="reveal-mask inline-block">
            <span data-reveal-word className="inline-block">
              {word.map((run, runIndex) =>
                run.accent ? (
                  <Accent key={runIndex} data-reveal-accent>
                    {run.text}
                  </Accent>
                ) : (
                  <Fragment key={runIndex}>{run.text}</Fragment>
                ),
              )}
            </span>
          </span>
        </Fragment>
      ))}
    </span>
  );
}
