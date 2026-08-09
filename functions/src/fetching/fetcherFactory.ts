/**
 * fetcherFactory.ts
 *
 * Builds the concrete {@link PageFetcher} chosen by configuration. This is the
 * single seam where we decide *which* provider the rest of the app uses; every
 * other module depends only on the `PageFetcher` interface.
 */

import type { AppConfig } from '../config.js';
import { PageFetcher } from './pageFetcher.js';
import { ScrapingBeeFetcher } from './scrapingBeeFetcher.js';
import { DirectFetcher } from './directFetcher.js';

/** Construct the page fetcher described by `config.fetcher`. */
export function createPageFetcher(config: AppConfig): PageFetcher {
  switch (config.fetcher.provider) {
    case 'scrapingbee': {
      const apiKey = config.fetcher.scrapingBeeApiKey;
      if (!apiKey) {
        throw new Error(
          'PAGE_FETCHER=scrapingbee but SCRAPINGBEE_API_KEY is not set.',
        );
      }
      return new ScrapingBeeFetcher({
        apiKey,
        proxyMode: config.fetcher.scrapingBeeProxyMode,
      });
    }
    case 'direct':
      return new DirectFetcher();
    default: {
      const exhaustive: never = config.fetcher.provider;
      throw new Error(`Unknown page fetcher provider: ${exhaustive}`);
    }
  }
}
