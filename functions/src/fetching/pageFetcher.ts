/**
 * pageFetcher.ts
 *
 * The provider-agnostic contract for "go fetch the HTML of a web page,
 * optionally interacting with it first."
 *
 * Why this abstraction exists
 * ---------------------------
 * The Mecklenburg Board of Elections site sits behind Cloudflare bot
 * protection that blocks ordinary server-side HTTP requests (a plain
 * `fetch()` gets an HTTP 403). Only a *real browser* gets through. Rather
 * than bake one specific work-around into our business logic, we hide the
 * "how" behind this interface. Today the production implementation is
 * ScrapingBee (a cloud browser). Tomorrow we could swap in a local headless
 * browser, a different scraping API, or a plain fetch — without touching any
 * of the BOE-specific code.
 *
 * This is the classic "adapter" (a.k.a. "strategy") pattern: `BoeClient`
 * depends only on the `PageFetcher` interface, and we choose a concrete
 * adapter at startup via `fetcherFactory.ts`.
 */

/**
 * A single declarative interaction to perform in the page *before* we capture
 * its final HTML. These are intentionally high-level and provider-neutral so
 * that each adapter can translate them into its own vocabulary (ScrapingBee's
 * `js_scenario`, Puppeteer's `page.type()/click()`, etc.).
 */
export type PageAction =
  // Type `value` into the form field matched by `selector` (a CSS selector).
  | { type: 'fill'; selector: string; value: string }
  // Click the element matched by `selector`.
  | { type: 'click'; selector: string }
  // Pause until an element matching `selector` appears in the DOM.
  | { type: 'waitForSelector'; selector: string }
  // Pause for a fixed number of milliseconds (useful after a form submit that
  // navigates to a new page whose "success" element we cannot predict).
  | { type: 'wait'; milliseconds: number };

/**
 * Everything an adapter needs to know to fetch one page.
 */
export interface FetchRequest {
  /** The absolute URL to load. */
  url: string;
  /**
   * Optional interactions to run in order before the HTML is captured. When
   * present, the page must be rendered by a real browser. Adapters that cannot
   * run a browser (e.g. a plain-fetch adapter) should reject the request.
   */
  actions?: PageAction[];
  /**
   * Optional CSS selector to wait for before capturing HTML. Handy when the
   * meaningful content is populated after the initial load.
   */
  waitForSelector?: string;
}

/**
 * The result of a fetch: the raw HTML plus a little metadata.
 */
export interface FetchResult {
  /** The page's HTML source after any actions/waits completed. */
  html: string;
  /** The HTTP status code reported for the target page. */
  statusCode: number;
  /** The final URL after any redirects (falls back to the requested URL). */
  finalUrl: string;
}

/**
 * The contract every page-fetching provider implements.
 */
export interface PageFetcher {
  /** Human-readable provider name, used in logs and error messages. */
  readonly name: string;
  /** Fetch a single page. Throws {@link PageFetchError} on failure. */
  fetch(request: FetchRequest): Promise<FetchResult>;
}

/**
 * Raised when a provider cannot deliver the page (network failure, blocked
 * request, non-2xx status, unsupported capability, etc.). Keeping a dedicated
 * error type lets upper layers distinguish "the fetch itself failed" from
 * "the fetch succeeded but the page content was unexpected."
 */
export class PageFetchError extends Error {
  constructor(
    message: string,
    /** The provider that produced the error, for easier debugging. */
    readonly provider: string,
    /** The HTTP status code, when one is available. */
    readonly statusCode?: number,
  ) {
    super(message);
    this.name = 'PageFetchError';
  }
}
