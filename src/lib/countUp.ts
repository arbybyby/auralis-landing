/** A number as it is displayed, such as "12K", "0.4s", "98%" or "$1,284", taken apart for counting. */
export interface CountFormat {
  prefix: string;
  value: number;
  /** Digits after the decimal point, kept while counting so "0.4s" passes through "0.2s". */
  decimals: number;
  /** Whether the number groups its thousands with commas. */
  grouped: boolean;
  suffix: string;
}

// The site's copy is English, so numbers are written the English way.
const NUMBER_LOCALE = "en-US";
const DISPLAYED_NUMBER = /^(\D*?)(\d[\d,]*(?:\.\d+)?)(\D*)$/;

/** Reads a displayed number, or returns null for text that is not a single number. */
export function parseCount(display: string): CountFormat | null {
  const match = DISPLAYED_NUMBER.exec(display);
  if (!match) return null;
  const [, prefix, digits, suffix] = match;
  const [whole, fraction = ""] = digits.split(".");
  return {
    prefix,
    value: Number(digits.replaceAll(",", "")),
    decimals: fraction.length,
    grouped: whole.includes(","),
    suffix,
  };
}

/**
 * Returns a function that writes values in the same form as the number the format was read from.
 * The number formatter is built once, since a count calls it on every frame.
 */
export function createCountFormatter(
  format: CountFormat,
): (value: number) => string {
  const number = new Intl.NumberFormat(NUMBER_LOCALE, {
    minimumFractionDigits: format.decimals,
    maximumFractionDigits: format.decimals,
    useGrouping: format.grouped,
  });
  return (value) => `${format.prefix}${number.format(value)}${format.suffix}`;
}
