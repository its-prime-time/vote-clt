/**
 * addressLookupService.ts
 *
 * The top-level use case: "given a free-form address string, return the voter's
 * ballot information." It wires the three collaborators together —
 *
 *   free-form text --[GeminiAddressParser]--> {houseNumber, streetName, ...}
 *                  --[BoeClient.search]------> single matching address
 *                  --[BoeClient.retrieve]----> structured ballot information
 *
 * and knows nothing about HTTP, Cloud Functions, or the CLI. Both the callable
 * function and the command-line harness use this same class, so they behave
 * identically.
 */

import type { AppConfig } from '../config.js';
import { createPageFetcher } from '../fetching/fetcherFactory.js';
import { GeminiAddressParser } from '../parsing/geminiAddressParser.js';
import { BoeClient } from '../boe/boeClient.js';
import { LookupError, type LookupSuccess } from './types.js';

export class AddressLookupService {
  private readonly parser: GeminiAddressParser;
  private readonly boe: BoeClient;

  /**
   * Build a service from configuration. Callers can also inject their own
   * parser/client (handy for tests), but the common path is `new
   * AddressLookupService(loadConfig())`.
   */
  constructor(
    config: AppConfig,
    parser?: GeminiAddressParser,
    boe?: BoeClient,
  ) {
    this.parser = parser ?? new GeminiAddressParser(config);
    this.boe = boe ?? new BoeClient(createPageFetcher(config));
  }

  /**
   * Look up ballot information for a free-form address.
   *
   * @throws {LookupError} for every anticipated failure (unrecognized address,
   *   not found, multiple matches, upstream error). Callers should catch this
   *   and translate `error.code` into an appropriate response.
   */
  async lookup(rawAddress: string): Promise<LookupSuccess> {
    // 1. Parse the free-form text into structured parts.
    const parsedAddress = await this.parser.parse(rawAddress);

    // 2. Search the BOE for the single matching address.
    const candidate = await this.boe.search(parsedAddress);

    // 3. Retrieve and scrape the full ballot information.
    const ballot = await this.boe.retrieve(candidate);

    return { status: 'ok', parsedAddress, ballot };
  }
}

// Re-export the error type so consumers can `import { LookupError } from
// '.../addressLookupService'` without reaching into types.ts.
export { LookupError };
