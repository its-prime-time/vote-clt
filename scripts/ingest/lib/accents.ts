/**
 * accents.ts
 *
 * Pure text helpers for the "restore missing accents" step (see spanish.ts).
 *
 * The editors typed the Spanish blurbs on a keyboard without accent keys, so
 * "atención" arrived as "atencion". We ask Gemini to put the accents back, but
 * a language model may also "improve" the wording, and the wording is the
 * editor's call, not ours. So we accept Gemini's answer only if removing every
 * accent from it gives back exactly what the editor typed. Anything else —
 * a changed word, a fixed typo, reordered text — is rejected.
 */

/**
 * The text with every accent removed: "atención" → "atencion", "Niño" →
 * "Nino", "pingüino" → "pinguino". The Spanish opening marks ¿ and ¡ are
 * dropped too, since they can't be typed on the same keyboards.
 *
 * How it works: Unicode "NFD" normalization splits a letter like "ó" into a
 * plain "o" followed by a separate combining accent mark (U+0301). Removing
 * the combining marks (the \p{M} class) leaves the plain letters. This covers
 * ñ as well (n + combining tilde).
 */
export function stripAccents(text: string): string {
  return text.normalize('NFD').replace(/\p{M}/gu, '').replace(/[¿¡]/g, '');
}

/**
 * True when `fixed` is `original` with accents (and ¿ ¡) added, and nothing
 * else changed. Lines are compared one by one and the counts must match.
 */
export function onlyAccentsAdded(original: string[], fixed: string[]): boolean {
  if (original.length !== fixed.length) return false;
  return original.every((line, i) => stripAccents(line) === stripAccents(fixed[i]));
}
