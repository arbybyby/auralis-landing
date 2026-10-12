import { Fragment } from "react";

interface SplitWordsProps {
  text: string;
}

/**
 * Renders text as one span per word, so the intro can bring the words in one after another. The
 * spaces stay as plain text between them, so the paragraph wraps and reads exactly as before.
 */
export function SplitWords({ text }: SplitWordsProps) {
  return text.split(" ").map((word, index) => (
    <Fragment key={index}>
      {index > 0 && " "}
      <span data-intro="word" className="inline-block">
        {word}
      </span>
    </Fragment>
  ));
}
