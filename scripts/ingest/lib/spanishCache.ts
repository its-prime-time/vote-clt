/**
 * spanishCache.ts
 *
 * The committed record of every answer Gemini has given the ingest
 * (scripts/ingest/spanish-cache.json). It exists for three reasons:
 *
 *   1. Cost and speed — a blurb is sent to Gemini once, not on every ingest.
 *   2. Stability — a language model can word things differently each time it
 *      is asked; reusing the saved answer means an ingest that finds nothing
 *      new changes nothing.
 *   3. Review — the cache is committed, so every machine translation and
 *      accent fix appears in the pull request diff for a human to read.
 *
 * Entries are keyed by the exact source text, so when an editor changes a
 * blurb in the sheet the old entry stops matching, a new answer is fetched,
 * and the old one is pruned at the end of the run.
 *
 * Want to hand-correct a machine translation? Better to type it into the
 * sheet's "Policy Blurb (ES)" column — editor Spanish always wins. Editing
 * this file works too, but is overwritten if the English blurb changes.
 */

import { readFile, writeFile } from 'node:fs/promises';

/** One blurb is several lines; the cache key joins them with newlines. */
type Lines = string[];

interface CacheFile {
  /** Editor Spanish as typed → the same text with accents restored. */
  accentFixes: Record<string, Lines>;
  /**
   * Editor Spanish whose accent fix was REJECTED because Gemini also changed
   * the wording (usually by correcting a typo) → what Gemini proposed. Kept so
   * the report can keep flagging the row without asking Gemini again, and so
   * a reviewer can see the suggested correction.
   */
  accentRejected: Record<string, Lines>;
  /**
   * "[gender]" line + English blurb → machine Spanish translation. The first
   * line of each key is the candidate's Gender (M, F, or O) in brackets.
   */
  translations: Record<string, Lines>;
}

type Section = keyof CacheFile;

export class SpanishCache {
  private constructor(
    private readonly filePath: string,
    private readonly stored: CacheFile,
    /** Text of the file as read, to tell whether `save` would change it. */
    private readonly originalText: string | null,
  ) {}

  /** Entries looked up or added during this run; everything else is pruned on save. */
  private readonly used: CacheFile = { accentFixes: {}, accentRejected: {}, translations: {} };

  /** Load the cache, or start an empty one if the file doesn't exist yet. */
  static async load(filePath: string): Promise<SpanishCache> {
    let text: string | null = null;
    try {
      text = await readFile(filePath, 'utf8');
    } catch {
      // First run: no cache yet.
    }
    const parsed = text ? (JSON.parse(text) as Partial<CacheFile>) : {};
    return new SpanishCache(
      filePath,
      {
        accentFixes: parsed.accentFixes ?? {},
        accentRejected: parsed.accentRejected ?? {},
        translations: parsed.translations ?? {},
      },
      text,
    );
  }

  /** The saved answer for `source`, or undefined if Gemini hasn't been asked yet. */
  get(section: Section, source: Lines): Lines | undefined {
    const key = keyOf(source);
    const hit = this.stored[section][key];
    if (hit) this.used[section][key] = hit;
    return hit;
  }

  /** Remember a new answer. */
  set(section: Section, source: Lines, result: Lines): void {
    const key = keyOf(source);
    this.stored[section][key] = result;
    this.used[section][key] = result;
  }

  /**
   * The file contents this run would write: only the entries used this run,
   * keys sorted so the diff only shows real changes.
   */
  render(): string {
    const sorted = (section: Record<string, Lines>) =>
      Object.fromEntries(Object.entries(section).sort(([a], [b]) => a.localeCompare(b)));
    const file: CacheFile = {
      accentFixes: sorted(this.used.accentFixes),
      accentRejected: sorted(this.used.accentRejected),
      translations: sorted(this.used.translations),
    };
    return JSON.stringify(file, null, 2) + '\n';
  }

  /** Would `save` change the file on disk? */
  get changed(): boolean {
    return this.render() !== this.originalText;
  }

  async save(): Promise<void> {
    await writeFile(this.filePath, this.render());
  }
}

function keyOf(lines: Lines): string {
  return lines.join('\n');
}
