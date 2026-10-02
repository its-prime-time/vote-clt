/**
 * lookupLog.ts
 *
 * Writes ONE structured log line per address lookup, so the outcome of every
 * lookup can be searched, charted, and alerted on in Google Cloud Logging.
 *
 * Each line looks like (in Logs Explorer, under jsonPayload):
 *
 *   { message: "lookup outcome", outcome: "ok", durationMs: 11234 }
 *   { message: "lookup outcome", outcome: "upstream_error", durationMs: 9876,
 *     detail: "We had trouble reaching ... (Unexpected page: ...)" }
 *
 * Severity follows "does a developer need to look at this?":
 *   - INFO  for everything a voter can cause (ok, not found, typo, several
 *           matches) — normal traffic.
 *   - ERROR for upstream_error (the BOE or ScrapingBee failed) and internal
 *           (our bug). The Cloud Monitoring alert emails on ERROR lines.
 *
 * Privacy: the voter's address is deliberately NOT logged.
 */

import { logger } from 'firebase-functions';
import type { LookupErrorCode } from './types.js';

/** Every way a lookup can end: success, one of the known error codes, or an unexpected crash. */
export type LookupOutcome = 'ok' | LookupErrorCode | 'internal';

/** Outcomes that mean something is broken on our side or upstream, not the voter's input. */
const ERROR_OUTCOMES: ReadonlySet<LookupOutcome> = new Set(['upstream_error', 'internal']);

export function logLookupOutcome(outcome: LookupOutcome, durationMs: number, detail?: string): void {
  const entry = { outcome, durationMs, ...(detail ? { detail } : {}) };
  if (ERROR_OUTCOMES.has(outcome)) {
    logger.error('lookup outcome', entry);
  } else {
    logger.info('lookup outcome', entry);
  }
}
