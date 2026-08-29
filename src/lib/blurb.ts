/**
 * blurb.ts
 *
 * Turns a candidate's policy blurb — three short lines in the spreadsheet —
 * into the one-sentence form the sample-ballot page uses:
 *
 *   ["Lowering the cost of groceries", "Making healthcare affordable", "Lowering energy costs"]
 *   → "This candidate prioritizes lowering the cost of groceries, making healthcare
 *      affordable, and lowering energy costs."
 *
 * A single line (the judicial candidates' personal statements) is returned as
 * written, since it is already a sentence.
 */

import type { Locale } from '../i18n/ui';

/**
 * Join the lines into one sentence using `template`, which must contain
 * `{issues}` where the list goes. Returns null when there are no lines.
 */
export function blurbSentence(lines: readonly string[], template: string, locale: Locale): string | null {
  const clean = lines.map((line) => line.trim()).filter(Boolean);
  if (clean.length === 0) return null;
  if (clean.length === 1) return ensurePeriod(clean[0]);

  const items = clean.map(lowercaseFirst);
  return ensurePeriod(template.replace('{issues}', joinList(items, locale)));
}

/**
 * Lower-case the first letter so the line reads naturally mid-sentence —
 * unless the first word is an all-caps abbreviation like "NC", which must
 * stay as it is. (A line starting with a proper name will be lower-cased too;
 * the editorial standard is to start lines with a plain noun or "-ing" verb.)
 */
export function lowercaseFirst(text: string): string {
  const firstWord = text.split(/\s+/, 1)[0];
  if (/^[A-Z][A-Z0-9.&-]+$/.test(firstWord)) return text; // "NC", "U.S.", "I-77"
  return text.charAt(0).toLowerCase() + text.slice(1);
}

/** "a, b, and c" in English (Oxford comma); "a, b y c" in Spanish. */
export function joinList(items: readonly string[], locale: Locale): string {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  const conjunction = locale === 'es' ? 'y' : 'and';
  if (items.length === 2) return `${items[0]} ${conjunction} ${items[1]}`;
  const head = items.slice(0, -1).join(', ');
  const last = items[items.length - 1];
  return locale === 'es' ? `${head} ${conjunction} ${last}` : `${head}, ${conjunction} ${last}`;
}

/** Add a full stop unless the text already ends with punctuation. */
function ensurePeriod(text: string): string {
  return /[.!?…]$/.test(text) ? text : `${text}.`;
}
