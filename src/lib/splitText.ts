/**
 * Text that may carry an accent: a plain string, or runs such as
 * `["Built to see ", { accent: "further" }, "."]`, where accented runs set in the italic serif.
 */
export type RichText = string | readonly (string | { accent: string })[];

/** A run of one word's text, accented or not. */
export interface WordRun {
  text: string;
  accent: boolean;
}

/** One word, never broken across lines: "further." is the accent run "further" plus a plain ".". */
export type SplitWord = readonly WordRun[];

// Ordinary spaces and line breaks only: a no-break space keeps the words on either side together.
const WORD_GAP = /([ \t\r\n]+)/;

function runsOf(text: RichText): WordRun[] {
  if (typeof text === "string") return [{ text, accent: false }];
  return text.map((part) =>
    typeof part === "string"
      ? { text: part, accent: false }
      : { text: part.accent, accent: true },
  );
}

export function toPlainText(text: RichText): string {
  return runsOf(text)
    .map((run) => run.text)
    .join("");
}

/** Splits text into words at its spaces, keeping each run's accent within the word it falls in. */
export function splitWords(text: RichText): SplitWord[] {
  const words: WordRun[][] = [[]];
  for (const { text: runText, accent } of runsOf(text)) {
    for (const piece of runText.split(WORD_GAP)) {
      if (piece === "") continue;
      const word = words[words.length - 1];
      if (WORD_GAP.test(piece)) {
        if (word.length > 0) words.push([]);
        continue;
      }
      const last = word[word.length - 1];
      if (last?.accent === accent) last.text += piece;
      else word.push({ text: piece, accent });
    }
  }
  return words.filter((word) => word.length > 0);
}
