/**
 * config.ts
 *
 * Central place to read runtime configuration from the environment. Reading it
 * all in one file (rather than scattering `process.env.X` around the codebase)
 * makes it obvious what knobs exist and keeps the rest of the code testable.
 *
 * In production (a deployed Cloud Function) these values come from Firebase
 * secrets and the built-in runtime environment. Locally (the CLI harness) they
 * come from a `.env` file or the shell.
 */

import type { ScrapingBeeProxyMode } from './fetching/scrapingBeeFetcher.js';

/** Which page-fetching adapter to use. */
export type FetcherProvider = 'scrapingbee' | 'direct';

export interface AppConfig {
  fetcher: {
    provider: FetcherProvider;
    scrapingBeeApiKey: string | undefined;
    scrapingBeeProxyMode: ScrapingBeeProxyMode;
  };
  vertex: {
    /** Google Cloud project id for Vertex AI. */
    project: string | undefined;
    /** Vertex AI region, e.g. "us-central1". */
    location: string;
    /** Gemini model id used for address parsing. */
    model: string;
  };
}

/**
 * The Gemini model used to parse free-form addresses. Kept as a named constant
 * (not buried in code) so it is trivial to bump when a newer/cheaper model
 * ships. Flash-Lite is the smallest, cheapest tier — more than enough to split
 * an address into three parts.
 */
export const ADDRESS_PARSER_MODEL = 'gemini-3.5-flash-lite';

/** Read and validate configuration from the current environment. */
export function loadConfig(): AppConfig {
  const provider = (process.env.PAGE_FETCHER ?? 'scrapingbee') as FetcherProvider;
  const proxyMode = (process.env.SCRAPINGBEE_PROXY_MODE ??
    'premium') as ScrapingBeeProxyMode;

  return {
    fetcher: {
      provider,
      scrapingBeeApiKey: process.env.SCRAPINGBEE_API_KEY,
      scrapingBeeProxyMode: proxyMode,
    },
    vertex: {
      // Cloud Functions expose the project id via several standard vars.
      project:
        process.env.GCLOUD_PROJECT ??
        process.env.GOOGLE_CLOUD_PROJECT ??
        process.env.FIREBASE_PROJECT,
      location: process.env.VERTEX_LOCATION ?? 'us-central1',
      model: ADDRESS_PARSER_MODEL,
    },
  };
}
