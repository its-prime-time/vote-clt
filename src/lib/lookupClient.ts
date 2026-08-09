/**
 * lookupClient.ts
 *
 * Browser client for the `lookupAddress` Firebase callable function.
 *
 * Callables speak a simple JSON convention over HTTPS — the client sends
 * `{ "data": { ...args } }` and receives `{ "result": ... }` or
 * `{ "error": ... }` — so we use plain `fetch` rather than pulling the Firebase
 * SDK into the static site.
 *
 * In production the request goes through the same-origin Firebase Hosting
 * rewrite at /api/lookupAddress (see firebase.json). `astro dev` has no such
 * rewrite, so set PUBLIC_LOOKUP_URL in a root `.env` to point directly at the
 * deployed function (see .env.example).
 */

/** One selectable address the BOE returns when a search is ambiguous. */
export interface AddressCandidate {
  label: string;
  url: string;
}

/**
 * The `details` payload our function attaches to errors so the front-end can
 * branch on `code` (see functions/src/index.ts and functions/src/lookup/types.ts).
 */
export interface LookupErrorDetails {
  code?: 'unrecognized_address' | 'address_not_found' | 'multiple_matches' | 'upstream_error';
  candidates?: AddressCandidate[];
}

/** A failed lookup: either a structured error from the function or a transport failure. */
export class LookupRequestError extends Error {
  constructor(
    /** Callable status such as "NOT_FOUND", or "network" when the request itself failed. */
    readonly status: string,
    message: string,
    readonly details?: LookupErrorDetails,
  ) {
    super(message);
    this.name = 'LookupRequestError';
  }
}

const ENDPOINT: string = import.meta.env.PUBLIC_LOOKUP_URL || '/api/lookupAddress';

// The function's own timeout is 120s; give the request the same headroom.
const TIMEOUT_MS = 120_000;

/**
 * Look up ballot information for a free-form address string. Resolves with the
 * function's JSON result; rejects with {@link LookupRequestError} on any failure.
 */
export async function lookupAddress(address: string): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: { address } }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    throw new LookupRequestError('network', 'Could not reach the lookup service.');
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    payload = undefined;
  }

  if (payload && typeof payload === 'object' && 'error' in payload) {
    const error = (
      payload as { error: { message?: string; status?: string; details?: LookupErrorDetails } }
    ).error;
    throw new LookupRequestError(
      error.status ?? 'INTERNAL',
      error.message ?? 'Lookup failed.',
      error.details,
    );
  }

  if (!response.ok || !payload || typeof payload !== 'object' || !('result' in payload)) {
    throw new LookupRequestError('INTERNAL', 'Unexpected response from the lookup service.');
  }

  return (payload as { result: unknown }).result;
}
