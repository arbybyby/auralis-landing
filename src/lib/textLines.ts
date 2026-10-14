/**
 * The line each word sits on, counted from 0, for words in reading order: a word that starts left
 * of the one before it has wrapped onto the next line. Measured from layout, so call it once the
 * text has its final fonts and width.
 */
export function lineIndexes(words: readonly HTMLElement[]): number[] {
  let line = 0;
  let previousLeft = -Infinity;
  return words.map((word) => {
    const { left } = word.getBoundingClientRect();
    if (left < previousLeft) line += 1;
    previousLeft = left;
    return line;
  });
}
