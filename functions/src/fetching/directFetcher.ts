/**
 * directFetcher.ts
 *
 * A {@link PageFetcher} that just uses Node's built-in `fetch()` with no proxy
 * or browser. Against the live BOE site this WILL be blocked by Cloudflare
 * (HTTP 403) — that is exactly the problem ScrapingBee solves. So why keep it?
 *
 *  1. Offline testing. Point it at a `file://` URL (one of the saved sample
 *     pages in specs/sample) to exercise the HTML parsing logic without any
 *     network or API credits. The CLI's `--fixture` mode does this.
 *  2. Future-proofing. If the BOE ever drops its bot protection, this becomes
 *     a zero-cost production option — swappable via config, no code changes.
 *
 * Because it has no browser, it cannot run interactions; a request with
 * `actions` is rejected.
 */

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import {
  PageFetcher,
  FetchRequest,
  FetchResult,
  PageFetchError,
} from './pageFetcher.js';

export class DirectFetcher implements PageFetcher {
  readonly name = 'direct';

  async fetch(request: FetchRequest): Promise<FetchResult> {
    if (request.actions && request.actions.length > 0) {
      throw new PageFetchError(
        'DirectFetcher cannot perform page interactions (fill/click). ' +
          'Use the ScrapingBee provider for the BOE search step.',
        this.name,
      );
    }

    // Support reading a local file so tests can run against saved HTML samples.
    if (request.url.startsWith('file://')) {
      const path = fileURLToPath(request.url);
      const html = await readFile(path, 'utf8');
      return { html, statusCode: 200, finalUrl: request.url };
    }

    let response: Response;
    try {
      response = await globalThis.fetch(request.url, {
        headers: {
          // A browser-ish User-Agent. Note: this is NOT enough to fool
          // Cloudflare's fingerprinting — it will still 403 the live site.
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ' +
            'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml',
        },
      });
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      throw new PageFetchError(`Direct fetch failed: ${reason}`, this.name);
    }

    const html = await response.text();
    if (!response.ok) {
      throw new PageFetchError(
        `Direct fetch returned ${response.status} for ${request.url}`,
        this.name,
        response.status,
      );
    }

    return { html, statusCode: response.status, finalUrl: response.url };
  }
}
