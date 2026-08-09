/**
 * boeClient.ts
 *
 * Orchestrates the two-step conversation with the Mecklenburg BOE site,
 * speaking only through a {@link PageFetcher} so it is agnostic about *how* the
 * pages are actually retrieved (ScrapingBee in production, a local fixture in
 * tests).
 *
 * Step 1 — search:  fill the house number + street name into the search form,
 *                   submit it, and read back the list of matching addresses.
 * Step 2 — retrieve: open the single matching address and scrape its full
 *                    ballot/district information.
 */

import type { PageFetcher } from '../fetching/pageFetcher.js';
import { PageFetchError } from '../fetching/pageFetcher.js';
import { BOE_SEARCH_URL, SEARCH_FORM } from './boeUrls.js';
import { parseSearchResults, parseBallotInformation } from './boeResultParser.js';
import {
  LookupError,
  type AddressCandidate,
  type BallotInformation,
  type ParsedAddress,
} from '../lookup/types.js';

/**
 * How long to pause after clicking "Go" before capturing the results HTML. The
 * click triggers an ASP.NET postback that reloads the page; we cannot wait for
 * a specific "results" element because the no-results page has none. A few
 * seconds comfortably covers the round-trip.
 */
const POST_SUBMIT_WAIT_MS = 4000;

export class BoeClient {
  constructor(private readonly fetcher: PageFetcher) {}

  /**
   * Run the address search and return the resolved URL for the *single*
   * matching address.
   *
   * @throws {LookupError}
   *   - 'address_not_found' when the BOE returns no matches
   *   - 'multiple_matches' when it returns more than one (with the candidate
   *      links attached for the UI to display)
   *   - 'upstream_error' when the search request itself fails
   */
  async search(address: ParsedAddress): Promise<AddressCandidate> {
    let html: string;
    try {
      const result = await this.fetcher.fetch({
        url: BOE_SEARCH_URL,
        // Drive the form exactly as a person would: type the two fields, click
        // Go, then wait for the postback to render the results.
        actions: [
          {
            type: 'fill',
            selector: SEARCH_FORM.houseNumberInput,
            value: address.houseNumber,
          },
          {
            type: 'fill',
            selector: SEARCH_FORM.streetNameInput,
            value: address.streetName,
          },
          { type: 'click', selector: SEARCH_FORM.submitButton },
          { type: 'wait', milliseconds: POST_SUBMIT_WAIT_MS },
        ],
      });
      html = result.html;
    } catch (err) {
      throw wrapUpstream(err, 'the address search');
    }

    const candidates = parseSearchResults(html);

    if (candidates.length === 0) {
      throw new LookupError(
        'address_not_found',
        "We couldn't find that address in the Mecklenburg County voter rolls. " +
          'Double-check the house number and street, or look it up directly on ' +
          'the Board of Elections site.',
      );
    }

    if (candidates.length > 1) {
      throw new LookupError(
        'multiple_matches',
        'That address matched more than one record. Please choose the exact ' +
          'address you meant.',
        candidates,
      );
    }

    return candidates[0];
  }

  /**
   * Open a resolved address URL and scrape its full ballot information.
   *
   * @throws {LookupError} 'upstream_error' if the page cannot be retrieved.
   */
  async retrieve(candidate: AddressCandidate): Promise<BallotInformation> {
    let html: string;
    try {
      const result = await this.fetcher.fetch({ url: candidate.url });
      html = result.html;
    } catch (err) {
      throw wrapUpstream(err, 'the ballot information page');
    }

    return parseBallotInformation(html, candidate.label);
  }

  /**
   * Convenience: run search then retrieve in one call.
   */
  async lookup(address: ParsedAddress): Promise<BallotInformation> {
    const candidate = await this.search(address);
    return this.retrieve(candidate);
  }
}

/** Wrap a low-level fetch failure as a user-facing LookupError. */
function wrapUpstream(err: unknown, whatFailed: string): LookupError {
  if (err instanceof LookupError) return err;
  const detail =
    err instanceof PageFetchError
      ? `${err.message}`
      : err instanceof Error
        ? err.message
        : String(err);
  return new LookupError(
    'upstream_error',
    `We had trouble reaching the Board of Elections while loading ${whatFailed}. ` +
      `Please try again in a moment. (${detail})`,
  );
}
