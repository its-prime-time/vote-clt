/**
 * index.ts
 *
 * The Cloud Functions entry point. Exposes a single HTTPS *callable* function,
 * `lookupAddress`, which the Vote CLT front-end will invoke.
 *
 * A "callable" is just an HTTPS endpoint that speaks a simple JSON convention:
 * the client sends `{ "data": { ...args } }` and receives `{ "result": ... }`
 * or `{ "error": ... }`. That means the CLI harness (and any other client) can
 * call the deployed function directly over HTTPS — no emulator required.
 *
 * All the real work lives in {@link AddressLookupService}; this file only
 * handles the Cloud-Functions-specific concerns: input validation, secrets,
 * resource limits, and translating our typed {@link LookupError}s into the
 * callable error shape.
 */

import { onCall, HttpsError, type CallableRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { setGlobalOptions } from 'firebase-functions/v2';
import { loadConfig } from './config.js';
import { AddressLookupService } from './lookup/addressLookupService.js';
import { LookupError, type LookupErrorCode } from './lookup/types.js';

// The ScrapingBee API key is stored as a Firebase secret (set once with
// `firebase functions:secrets:set SCRAPINGBEE_API_KEY`). Declaring it here both
// grants this function access at runtime and injects it into process.env, where
// loadConfig() reads it.
const scrapingBeeApiKey = defineSecret('SCRAPINGBEE_API_KEY');

// All functions run in us-central1 (co-located with Vertex AI usage).
setGlobalOptions({ region: 'us-central1' });

/** The shape of the data the client sends. */
interface LookupRequestData {
  address?: unknown;
}

export const lookupAddress = onCall(
  {
    secrets: [scrapingBeeApiKey],
    // A headless-browser round-trip via ScrapingBee plus a Gemini call can take
    // a while; give it generous headroom.
    timeoutSeconds: 120,
    memory: '512MiB',
    // The front-end is a static site on our own domain, but callable functions
    // are public by design; keep unauthenticated access (this is public voter
    // info) and rely on rate limits / App Check if abuse appears.
  },
  async (request: CallableRequest<LookupRequestData>) => {
    const address = request.data?.address;
    if (typeof address !== 'string' || address.trim() === '') {
      throw new HttpsError(
        'invalid-argument',
        'Please provide an "address" string.',
      );
    }

    const service = new AddressLookupService(loadConfig());

    try {
      return await service.lookup(address);
    } catch (err) {
      if (err instanceof LookupError) {
        throw toHttpsError(err);
      }
      // Unexpected: log it server-side and return a generic message.
      console.error('Unexpected error during address lookup:', err);
      throw new HttpsError('internal', 'Something went wrong. Please try again.');
    }
  },
);

/**
 * Translate our domain error into the callable-function error format. The
 * `details` object is delivered to the client alongside the message, so the
 * front-end can branch on `details.code` and render `details.candidates` for
 * the multiple-matches case.
 */
function toHttpsError(err: LookupError): HttpsError {
  const httpsCode = HTTPS_CODE_BY_LOOKUP_CODE[err.code];
  return new HttpsError(httpsCode, err.message, {
    code: err.code,
    candidates: err.candidates,
  });
}

/** Map each domain error code to the closest callable-function error code. */
const HTTPS_CODE_BY_LOOKUP_CODE: Record<
  LookupErrorCode,
  ConstructorParameters<typeof HttpsError>[0]
> = {
  unrecognized_address: 'invalid-argument',
  address_not_found: 'not-found',
  multiple_matches: 'failed-precondition',
  upstream_error: 'unavailable',
};
