/**
 * gemini.ts
 *
 * The two questions the ingest asks Gemini (Vertex AI) about Spanish blurbs:
 *
 *   - restoreAccents: "here is Spanish typed without accents; put them back"
 *   - translate:      "here is an English blurb; write it in Spanish"
 *
 * Both return one string per input line, using Gemini's structured output
 * (a JSON array of strings) so we never have to pick the answer out of prose.
 * This module only talks to Gemini; checking the answers and deciding what to
 * publish is spanish.ts's job.
 *
 * Credentials: the Vertex AI SDK uses Application Default Credentials, i.e.
 * the login from `gcloud auth application-default login`. Only needed when
 * there is something new to translate — cached answers need no login.
 */

import { GoogleGenAI, Type } from '@google/genai';
import { GEMINI } from '../config';
import type { Gender } from './transform';

/** An English blurb and its Spanish, given to Gemini as a style example. */
export interface TranslationExample {
  en: string[];
  es: string[];
}

/** What to tell Gemini about words that describe the candidate. Words about other people are unaffected. */
const GENDER_GUIDANCE: Record<Gender, string> = {
  M: 'The candidate is a man: words describing the candidate are masculine (e.g. "experimentado", "un juez").',
  F: 'The candidate is a woman: words describing the candidate are feminine (e.g. "experimentada", "una jueza").',
  O:
    'The candidate’s gender is not known. Where a line describes the candidate, prefer wording that does not mark gender ' +
    '(for example a verb or noun phrase rather than an adjective like "experimentado/experimentada").',
};

export class GeminiSpanish {
  private readonly ai = new GoogleGenAI({ vertexai: true, project: GEMINI.project, location: GEMINI.location });

  /** Put the accents back into Spanish typed without them. One output line per input line. */
  async restoreAccents(lines: string[]): Promise<string[]> {
    const prompt = [
      'The following lines of Spanish were typed on a keyboard that could not produce accents.',
      'Restore the missing accents and tildes (á é í ó ú ü ñ), and the opening ¿ or ¡ where a line is a question or exclamation.',
      'Change NOTHING else: keep every word, its spelling, capitalization, punctuation, and word order exactly as written, even if you think something is a mistake.',
      'The lines are given as a JSON array. Return a JSON array with exactly one string per input line, in the same order.',
      '',
      JSON.stringify(lines),
    ].join('\n');
    return this.askForLines(prompt);
  }

  /**
   * Translate an English blurb into Spanish. `examples` are the editors' own
   * translations, so the machine ones match their tone and phrasing. `gender`
   * decides how words describing the candidate agree (see GENDER_GUIDANCE).
   */
  async translate(lines: string[], examples: TranslationExample[], gender: Gender): Promise<string[]> {
    const prompt = [
      'You translate short candidate policy blurbs for a nonpartisan voter guide in Charlotte, North Carolina,',
      'read by Spanish-speaking voters (mostly Latin American Spanish).',
      'Each line is one priority, written as a short phrase, not a full sentence.',
      'Translate faithfully and neutrally: keep the candidate’s meaning and emphasis, add nothing, and do not soften or sharpen political language.',
      'Keep each line about as short as the English. Start each line with a capital letter and use correct accents.',
      'Keep names of people, places, and organizations as they are (e.g. "Washington & Lee University", "Uptown"),',
      'but translate generic institutions such as courts ("Superior Court" → "Corte Superior", "District Court" → "Corte de Distrito").',
      'Write natural Spanish rather than a word-for-word copy; avoid repeating a word the English only uses once.',
      GENDER_GUIDANCE[gender],
      'The English lines are given as a JSON array. Return a JSON array with exactly one Spanish string per English line, in the same order.',
      '',
      ...(examples.length > 0
        ? [
            'Examples of how our editors translate:',
            ...examples.map((ex) => `English:\n${ex.en.join('\n')}\nSpanish:\n${ex.es.join('\n')}\n`),
            '',
          ]
        : []),
      'Translate:',
      JSON.stringify(lines),
    ].join('\n');
    return this.askForLines(prompt);
  }

  /**
   * Send a prompt and return the JSON array of strings Gemini answers with.
   *
   * Very occasionally a model gets stuck repeating itself and returns a huge,
   * broken answer. Asking again at temperature 0 just repeats the same broken
   * answer, so if the first reply can't be read we ask once more with a
   * little randomness (temperature 0.3). Network and login errors are not
   * retried here; spanish.ts handles those.
   */
  private async askForLines(prompt: string): Promise<string[]> {
    try {
      return await this.generateLines(prompt, 0);
    } catch (err) {
      if (!(err instanceof UnreadableAnswerError)) throw err;
      return this.generateLines(prompt, 0.3);
    }
  }

  /** One Gemini request; throws UnreadableAnswerError if the reply isn't a JSON list of strings. */
  private async generateLines(prompt: string, temperature: number): Promise<string[]> {
    const response = await this.ai.models.generateContent({
      model: GEMINI.model,
      contents: prompt,
      config: {
        // Temperature 0 = always pick the most likely wording; we want
        // faithful, repeatable answers, not creative ones.
        temperature,
        // A blurb is a few short lines; this is ample, and it stops a
        // runaway answer early instead of after tens of thousands of characters.
        maxOutputTokens: GEMINI.maxOutputTokens,
        responseMimeType: 'application/json',
        responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
    });
    let parsed: unknown;
    try {
      parsed = JSON.parse(response.text ?? '');
    } catch {
      throw new UnreadableAnswerError(response.text);
    }
    if (!Array.isArray(parsed) || !parsed.every((item) => typeof item === 'string')) {
      throw new UnreadableAnswerError(response.text);
    }
    return parsed.map((line) => line.trim());
  }
}

/** Gemini answered, but not with a readable JSON list of strings. */
class UnreadableAnswerError extends Error {
  constructor(text: string | undefined) {
    super(`Gemini's answer was not a list of strings: ${(text ?? '(empty)').slice(0, 200)}`);
  }
}
