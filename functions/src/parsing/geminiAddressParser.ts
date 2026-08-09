/**
 * geminiAddressParser.ts
 *
 * Turns a free-form street address that a user typed into a single text box
 * ("3227 Planters Ridge Rd Apt 4, 28270") into the three structured pieces the
 * BOE search form needs (house number, street name, street type).
 *
 * We use Genkit — Firebase's recommended GenAI framework — with Google's Vertex
 * AI (Gemini). Genkit's "structured output" feature is the key trick: we hand
 * the model a Zod schema and it returns validated JSON matching that schema, so
 * we never have to parse the model's prose.
 *
 * Auth note: Vertex AI uses the Cloud project's own credentials (Application
 * Default Credentials), so there is no API key to manage. Inside a deployed
 * function this "just works"; locally, run `gcloud auth application-default
 * login` once.
 */

import { genkit, z, type Genkit } from 'genkit';
import { vertexAI } from '@genkit-ai/google-genai';
import type { AppConfig } from '../config.js';
import { LookupError, type ParsedAddress } from '../lookup/types.js';

/**
 * The schema the model must fill in. `describe()` text is sent to the model as
 * part of the instructions, so it doubles as documentation and prompt.
 */
const addressSchema = z.object({
  houseNumber: z
    .string()
    .describe('The numeric street/house number only, e.g. "3227". Empty string if none is present.'),
  streetName: z
    .string()
    .describe('The street name WITHOUT the type/suffix, e.g. "Planters Ridge".'),
  streetType: z
    .string()
    .describe('The street type/suffix if present, e.g. "Rd", "Ave", "Ln", "Blvd". Empty string if none.'),
  recognized: z
    .boolean()
    .describe(
      'True only if the input clearly contains a street address with at least a house number and a street name. False for gibberish, a bare city/zip, or an empty input.',
    ),
});

/**
 * A few worked examples steer the model toward the exact splitting behavior we
 * want (drop apartment numbers and zip codes; keep multi-word street names
 * intact). Kept as data so they are easy to extend.
 */
const FEW_SHOT_EXAMPLES = `
Examples:

Input: "3227 Planters Ridge Rd Apt 2, Charlotte NC 28270"
Output: { "houseNumber": "3227", "streetName": "Planters Ridge", "streetType": "Rd", "recognized": true }

Input: "741 kenilworth ave"
Output: { "houseNumber": "741", "streetName": "Kenilworth", "streetType": "Ave", "recognized": true }

Input: "10140 Providence Church Lane 28277"
Output: { "houseNumber": "10140", "streetName": "Providence Church", "streetType": "Ln", "recognized": true }

Input: "600 E 4th St, Unit 300"
Output: { "houseNumber": "600", "streetName": "E 4th", "streetType": "St", "recognized": true }

Input: "Charlotte, NC"
Output: { "houseNumber": "", "streetName": "", "streetType": "", "recognized": false }

Input: "asdf qwerty"
Output: { "houseNumber": "", "streetName": "", "streetType": "", "recognized": false }
`.trim();

/**
 * Parses free-form addresses using a Gemini model via Vertex AI.
 *
 * Single responsibility: input string -> {@link ParsedAddress}. It knows
 * nothing about the BOE site or HTTP; that separation keeps it easy to test
 * and reason about.
 */
export class GeminiAddressParser {
  private readonly ai: Genkit;
  private readonly model: string;

  constructor(config: AppConfig) {
    // Initialize Genkit with the Vertex AI plugin, pointed at our project and
    // region. Credentials come from Application Default Credentials.
    this.ai = genkit({
      plugins: [
        vertexAI({
          projectId: config.vertex.project,
          location: config.vertex.location,
        }),
      ],
    });
    this.model = config.vertex.model;
  }

  /**
   * Split `rawAddress` into its parts.
   *
   * @throws {LookupError} with code 'unrecognized_address' if the model cannot
   *         confidently identify a house number + street, or 'upstream_error'
   *         if the model call itself fails.
   */
  async parse(rawAddress: string): Promise<ParsedAddress> {
    const trimmed = rawAddress.trim();
    if (!trimmed) {
      throw new LookupError(
        'unrecognized_address',
        'Please enter a street address.',
      );
    }

    let output: z.infer<typeof addressSchema> | null;
    try {
      const response = await this.ai.generate({
        model: vertexAI.model(this.model),
        // Deterministic output: we want the same split every time, not variety.
        config: { temperature: 0 },
        output: { schema: addressSchema },
        prompt: [
          'You extract the components of a US street address.',
          'Ignore apartment/unit numbers and zip codes.',
          'Keep multi-word street names together and do not abbreviate them.',
          '',
          FEW_SHOT_EXAMPLES,
          '',
          `Now extract from this input:\n"${trimmed}"`,
        ].join('\n'),
      });
      output = response.output;
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      throw new LookupError(
        'upstream_error',
        `The address parser is temporarily unavailable: ${reason}`,
      );
    }

    // Guard against a missing/low-confidence parse.
    if (!output || !output.recognized || !output.houseNumber || !output.streetName) {
      throw new LookupError(
        'unrecognized_address',
        "We couldn't read that as a street address. Please enter it like " +
          '"3227 Planters Ridge Rd".',
      );
    }

    return {
      houseNumber: output.houseNumber.trim(),
      streetName: output.streetName.trim(),
      streetType: output.streetType?.trim() || undefined,
    };
  }
}
