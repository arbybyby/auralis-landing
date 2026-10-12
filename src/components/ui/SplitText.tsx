import { Fragment } from "react";

interface SplitTextProps {
  text: string;
}

/**
 * Renders text as one span per letter, so the intro can animate letters on their own. Words stay
 * together and wrap only at spaces, exactly like the plain text, and each word masks its letters
 * as they rise into place. The letters are hidden from assistive technology: the heading around
 * them carries the full text as its label.
 */
export function SplitText({ text }: SplitTextProps) {
  return (
    <span aria-hidden>
      {text.split(" ").map((word, wordIndex) => (
        <Fragment key={wordIndex}>
          {wordIndex > 0 && " "}
          <span className="intro-mask inline-block whitespace-nowrap">
            {Array.from(word, (letter, letterIndex) => (
              <span
                key={letterIndex}
                data-intro="char"
                className="inline-block"
              >
                {letter}
              </span>
            ))}
          </span>
        </Fragment>
      ))}
    </span>
  );
}
