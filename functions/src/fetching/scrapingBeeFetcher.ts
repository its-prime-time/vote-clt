/**
 * scrapingBeeFetcher.ts
 *
 * A {@link PageFetcher} backed by the ScrapingBee API (https://scrapingbee.com).
 *
 * ScrapingBee runs a real cloud browser and routes it through residential
 * proxies, which is what lets us get past the Cloudflare bot protection on the
 * BOE site. We hand it a URL (and, for the search step, a small script of
 * "fill these fields, click this button" instructions) and it returns the
 * fully rendered HTML.
 *
 * API reference: https://www.scrapingbee.com/documentation/
 */

import {
  PageFetcher,
  FetchRequest,
  FetchResult,
  PageAction,
  PageFetchError,
} from './pageFetcher.js';

/** The proxy tiers ScrapingBee offers, in increasing order of power and cost. */
export type ScrapingBeeProxyMode = 'none' | 'premium' | 'stealth';

export interface ScrapingBeeOptions {
  /** ScrapingBee API key. */
  apiKey: string;
  /**
   * Which proxy pool to use. The BOE site's Cloudflare protection generally
   * requires at least 'premium' (residential). Escalate to 'stealth' if
   * requests still come back blocked. Defaults to 'premium'.
   */
  proxyMode?: ScrapingBeeProxyMode;
  /**
   * How long (ms) to let ScrapingBee spend on a single request before giving
   * up. ScrapingBee's own max is 140s; we default to 60s.
   */
  timeoutMs?: number;
}

/** ScrapingBee's single API endpoint. */
const SCRAPINGBEE_ENDPOINT = 'https://app.scrapingbee.com/api/v1/';

export class ScrapingBeeFetcher implements PageFetcher {
  readonly name = 'scrapingbee';

  private readonly apiKey: string;
  private readonly proxyMode: ScrapingBeeProxyMode;
  private readonly timeoutMs: number;

  constructor(options: ScrapingBeeOptions) {
    if (!options.apiKey) {
      throw new Error('ScrapingBeeFetcher requires an apiKey.');
    }
    this.apiKey = options.apiKey;
    this.proxyMode = options.proxyMode ?? 'premium';
    this.timeoutMs = options.timeoutMs ?? 60_000;
  }

  async fetch(request: FetchRequest): Promise<FetchResult> {
    // Build the ScrapingBee query string. Every option we need is expressed as
    // a URL parameter on ScrapingBee's endpoint.
    const params = this.buildParams(request);
    const requestUrl = `${SCRAPINGBEE_ENDPOINT}?${params.toString()}`;

    // We use an AbortController so a hung request cannot block a Cloud Function
    // indefinitely (Firebase would otherwise bill us until the function times
    // out).
    const abort = new AbortController();
    const timer = setTimeout(() => abort.abort(), this.timeoutMs);

    let response: Response;
    try {
      response = await globalThis.fetch(requestUrl, {
        method: 'GET',
        // The API key travels in the Authorization header (the modern method);
        // ScrapingBee also accepts it as a query param for backward compat.
        headers: { Authorization: `Bearer ${this.apiKey}` },
        signal: abort.signal,
      });
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      throw new PageFetchError(
        `ScrapingBee request failed: ${reason}`,
        this.name,
      );
    } finally {
      clearTimeout(timer);
    }

    const body = await response.text();

    // ScrapingBee returns its *own* status code for problems on its side
    // (e.g. 401 bad key, 402 out of credits, 500 could not fetch). Because we
    // do NOT set `transparent_status_code`, a 200 here means ScrapingBee
    // successfully retrieved the page; anything else is a ScrapingBee-level
    // failure and the body usually explains why.
    if (!response.ok) {
      throw new PageFetchError(
        `ScrapingBee returned ${response.status}: ${truncate(body, 300)}`,
        this.name,
        response.status,
      );
    }

    // ScrapingBee echoes the target page's real status via a response header.
    const upstreamStatus = Number(
      response.headers.get('Spb-original-status') ?? response.status,
    );
    const finalUrl = response.headers.get('Spb-resolved-url') ?? request.url;

    return {
      html: body,
      statusCode: Number.isFinite(upstreamStatus)
        ? upstreamStatus
        : response.status,
      finalUrl,
    };
  }

  /**
   * Translate a provider-neutral {@link FetchRequest} into ScrapingBee's URL
   * parameters. Kept separate from `fetch` so it is easy to unit-test and to
   * read.
   */
  private buildParams(request: FetchRequest): URLSearchParams {
    const params = new URLSearchParams();
    params.set('url', request.url);

    // We always render JavaScript: the BOE pages are ASP.NET WebForms whose
    // search button triggers a JS postback, and rendering is also what makes
    // the request look like a real browser to Cloudflare.
    params.set('render_js', 'true');

    // Choose the proxy pool that defeats Cloudflare.
    if (this.proxyMode === 'premium') {
      params.set('premium_proxy', 'true');
    } else if (this.proxyMode === 'stealth') {
      params.set('stealth_proxy', 'true');
    }
    // 'none' adds nothing — ScrapingBee uses its default datacenter proxy.

    // Target audience is North Carolina; a US exit node avoids any
    // geo-based differences in the results.
    params.set('country_code', 'us');

    // The BOE search results are server-rendered HTML in a <table>; we do not
    // need images or stylesheets. Blocking them is faster and cheaper.
    params.set('block_resources', 'true');

    // If the caller wants us to wait for a specific element, pass that through.
    if (request.waitForSelector) {
      params.set('wait_for', request.waitForSelector);
    }

    // Translate any interactions into a ScrapingBee js_scenario.
    if (request.actions && request.actions.length > 0) {
      const scenario = { instructions: request.actions.map(toScenarioStep) };
      params.set('js_scenario', JSON.stringify(scenario));
    }

    return params;
  }
}

/**
 * Convert one of our {@link PageAction}s into the JSON step shape ScrapingBee's
 * `js_scenario` expects. Keeping this mapping in one small function is what
 * makes the abstraction leak-proof: the rest of the codebase never sees a
 * ScrapingBee-specific detail.
 */
function toScenarioStep(action: PageAction): Record<string, unknown> {
  switch (action.type) {
    case 'fill':
      return { fill: [action.selector, action.value] };
    case 'click':
      return { click: action.selector };
    case 'waitForSelector':
      return { wait_for: action.selector };
    case 'wait':
      return { wait: action.milliseconds };
    default: {
      // This `never` check makes the compiler fail if someone adds a new
      // PageAction variant but forgets to handle it here.
      const exhaustive: never = action;
      throw new Error(`Unsupported page action: ${JSON.stringify(exhaustive)}`);
    }
  }
}

/** Trim long strings for readable error messages. */
function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}
