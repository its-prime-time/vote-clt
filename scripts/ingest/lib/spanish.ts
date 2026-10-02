/**
 * spanish.ts
 *
 * Decides the Spanish blurb every candidate is published with. The rule:
 *
 *   1. If the editors wrote one ("Policy Blurb (ES)" column), use it — with
 *      the accents their keyboard couldn't type put back by Gemini. The
 *      wording itself is never changed (see accents.ts).
 *   2. Otherwise, if there is an English blurb, use Gemini's translation of it.
 *   3. Otherwise there is nothing to translate; the Spanish stays empty.
 *
 * So only the blurbs the editors haven't translated are machine-translated,
 * and as soon as an editor fills in a Spanish cell it replaces the machine
 * version on the next ingest.
 *
 * Every Gemini answer is saved in the SpanishCache, so Gemini is only called
 * for text it hasn't seen. When `gemini` is null (`--check`, or
 * `--no-translate`) nothing new is fetched: uncached editor text is published
 * as typed and uncached English blurbs get no Spanish, and both are counted
 * as `pending` so the caller can say so.
 */

import { GEMINI, PROFILES_TAB } from '../config';
import { onlyAccentsAdded } from './accents';
import type { GeminiSpanish, TranslationExample } from './gemini';
import type { IssueLog } from './issues';
import type { SpanishCache } from './spanishCache';
import type { CandidateDraft } from './transform';

/** Where a candidate's published Spanish came from. */
export type SpanishSource = 'editor' | 'machine' | 'none';

export interface SpanishResult {
  /** Candidate id → source of its Spanish blurb. */
  sources: Map<string, SpanishSource>;
  /** How many times Gemini was asked something new this run. */
  geminiCalls: number;
  /** Blurbs that needed Gemini but didn't get it (no `gemini` client this run). */
  pending: number;
}

/**
 * Fill in `issues.es` on every draft (the drafts are updated in place) and
 * report where each one came from.
 */
export async function resolveSpanish(
  drafts: CandidateDraft[],
  cache: SpanishCache,
  gemini: GeminiSpanish | null,
  log: IssueLog,
): Promise<SpanishResult> {
  const result: RunState = { sources: new Map(), geminiCalls: 0, pending: 0, inFlight: new Map() };

  // Step 1 — editor Spanish, accents restored. Done first so the restored
  // versions can serve as style examples for the translations in step 2.
  const edited = drafts.filter((d) => d.issues.es.length > 0);
  await forEachLimited(edited, GEMINI.concurrency, async (draft) => {
    draft.issues.es = await restoreAccents(draft, cache, gemini, log, result);
    result.sources.set(draft.id, 'editor');
  });

  // Step 2 — machine translations for English blurbs with no editor Spanish.
  const examples = pickExamples(edited);
  const untranslated = drafts.filter((d) => d.issues.es.length === 0 && d.issues.en.length > 0);
  await forEachLimited(untranslated, GEMINI.concurrency, async (draft) => {
    draft.issues.es = await translate(draft, examples, cache, gemini, log, result);
    result.sources.set(draft.id, draft.issues.es.length > 0 ? 'machine' : 'none');
  });

  for (const draft of drafts) {
    if (!result.sources.has(draft.id)) result.sources.set(draft.id, 'none');
  }
  return result;
}

// ---------------------------------------------------------------------------
// The two steps, one blurb at a time
// ---------------------------------------------------------------------------

/** The editor's Spanish with accents restored, or as typed if that isn't possible. */
async function restoreAccents(
  draft: CandidateDraft,
  cache: SpanishCache,
  gemini: GeminiSpanish | null,
  log: IssueLog,
  result: RunState,
): Promise<string[]> {
  const typed = draft.issues.es;
  const cached = cache.get('accentFixes', typed);
  if (cached) return cached;
  const rejected = cache.get('accentRejected', typed);
  if (rejected) return keepAsTyped(draft, typed, rejected, log);
  if (!gemini) {
    result.pending++;
    return typed;
  }

  const fixed = await askOnce(result, 'accents', typed, () => gemini.restoreAccents(typed));
  if (!onlyAccentsAdded(typed, fixed)) {
    // Gemini changed more than accents — almost always because the editor's
    // text has a typo it "helpfully" corrected. The wording is the editor's
    // call, so publish as typed and remember the rejection (see spanishCache).
    cache.set('accentRejected', typed, fixed);
    return keepAsTyped(draft, typed, fixed, log);
  }
  cache.set('accentFixes', typed, fixed);
  return fixed;
}

/** Report a rejected accent fix, showing the lines Gemini wanted to change, and publish the text as typed. */
function keepAsTyped(draft: CandidateDraft, typed: string[], proposed: string[], log: IssueLog): string[] {
  const changed = typed
    .map((line, i) => ({ line, proposal: proposed[i] ?? '' }))
    .filter(({ line, proposal }) => !onlyAccentsAdded([line], [proposal]))
    .map(({ line, proposal }) => `"${line}" (suggested: "${proposal}")`);
  log.warning(
    PROFILES_TAB,
    draft.name,
    'Policy Blurb (ES) looks like it has a typo, so accents were not added automatically and it is published exactly as typed: ' +
      `${changed.join('; ')}. Fix the typo in the sheet and the accents are added on the next ingest.`,
  );
  return typed;
}

/** Gemini's Spanish for the English blurb, or [] if there isn't one (yet). */
async function translate(
  draft: CandidateDraft,
  examples: TranslationExample[],
  cache: SpanishCache,
  gemini: GeminiSpanish | null,
  log: IssueLog,
  result: RunState,
): Promise<string[]> {
  const english = draft.issues.en;
  // The gender is part of the cache key: the same English can translate
  // differently for a man, a woman, or an unknown gender, so changing the
  // Gender cell fetches a fresh translation.
  const key = [`[${draft.gender}]`, ...english];
  const cached = cache.get('translations', key);
  if (cached) return cached;
  if (!gemini) {
    result.pending++;
    return [];
  }

  const spanish = await askOnce(result, 'translate', key, () => gemini.translate(english, examples, draft.gender));
  if (spanish.length !== english.length || spanish.some((line) => line === '')) {
    log.warning(
      PROFILES_TAB,
      draft.name,
      `the machine translation of the English blurb came back with ${spanish.length} line(s) for ${english.length}, ` +
        'so it was not used and the English blurb is shown on the Spanish site. A Spanish blurb in the sheet fixes this.',
    );
    return [];
  }
  cache.set('translations', key, spanish);
  return spanish;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** SpanishResult plus bookkeeping that only matters while the run is going. */
interface RunState extends SpanishResult {
  /** Gemini requests started this run, by question + source text. */
  inFlight: Map<string, Promise<string[]>>;
}

/**
 * Ask Gemini a question once per run. Several candidates can share the exact
 * same text (e.g. "No platform information available"), and since blurbs are
 * processed in parallel they can all miss the cache at the same moment.
 * Without this, each would get its own — possibly differently worded —
 * answer; with it, they share one request and one answer.
 */
function askOnce(run: RunState, question: string, source: string[], call: () => Promise<string[]>): Promise<string[]> {
  const key = `${question}\n${source.join('\n')}`;
  let request = run.inFlight.get(key);
  if (!request) {
    run.geminiCalls++;
    request = withOneRetry(call);
    run.inFlight.set(key, request);
  }
  return request;
}

/**
 * A handful of the editors' (accent-restored) translations to show Gemini as
 * examples. Three-line blurbs only — the usual shape — taken in sheet order,
 * so the same examples are chosen every run.
 */
function pickExamples(edited: CandidateDraft[]): TranslationExample[] {
  return edited
    .filter((d) => d.issues.en.length === 3 && d.issues.es.length === 3)
    .slice(0, GEMINI.examples)
    .map((d) => ({ en: d.issues.en, es: d.issues.es }));
}

/**
 * Network hiccups happen; try a Gemini call twice before giving up. A second
 * failure (most often missing credentials) stops the ingest with a hint,
 * rather than quietly publishing without Spanish.
 */
async function withOneRetry<T>(call: () => Promise<T>): Promise<T> {
  try {
    return await call();
  } catch {
    try {
      return await call();
    } catch (err) {
      throw new Error(
        `Gemini request failed: ${err instanceof Error ? err.message : String(err)}\n` +
          'If this is a credentials error, run `gcloud auth application-default login`. ' +
          'To ingest without new translations, run `npm run ingest -- --no-translate`.',
      );
    }
  }
}

/** Run `task` over `items`, at most `limit` at a time. */
async function forEachLimited<T>(items: T[], limit: number, task: (item: T) => Promise<void>): Promise<void> {
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const item = items[next++];
      await task(item);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
}
