/**
 * cli/lookup.ts
 *
 * A command-line harness for the address lookup function. It has three modes:
 *
 *   1. In-process (default):
 *        npm run lookup -- "3227 Planters Ridge Rd 28270"
 *      Runs the full AddressLookupService locally — AI parse + BOE scrape — and
 *      prints the JSON result. Requires SCRAPINGBEE_API_KEY and Vertex AI
 *      credentials (see functions/.env.example).
 *
 *   2. Remote (calls the deployed function, no emulator needed):
 *        npm run lookup -- --url https://us-central1-vote-clt.cloudfunctions.net/lookupAddress "741 Kenilworth Ave"
 *      POSTs to the deployed callable and prints its JSON response.
 *
 *   3. Fixture (offline; tests the HTML parsing only — no API keys):
 *        npm run lookup -- --fixture-info  ../specs/sample/meckboe-address-information.aspx.html
 *        npm run lookup -- --fixture-search ../specs/sample/meckboe-address-search-result.aspx.html
 *      Parses a saved BOE HTML file with the same parser the service uses.
 *
 * Run with no arguments to see this usage.
 */

import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { loadConfig } from '../src/config.js';
import { AddressLookupService } from '../src/lookup/addressLookupService.js';
import { LookupError } from '../src/lookup/types.js';
import {
  parseBallotInformation,
  parseSearchResults,
} from '../src/boe/boeResultParser.js';

// Load a local .env if present so `npm run lookup` picks up SCRAPINGBEE_API_KEY
// etc. without the caller exporting them by hand. Node 20.12+ provides this.
try {
  process.loadEnvFile();
} catch {
  // No .env file — that's fine; we'll rely on the ambient environment.
}

const USAGE = `
Vote CLT — address lookup CLI

Usage:
  npm run lookup -- "<free-form address>"                 Run the full pipeline locally
  npm run lookup -- --url <functionUrl> "<address>"       Call the deployed function
  npm run lookup -- --fixture-info <file.html>            Parse a saved info page
  npm run lookup -- --fixture-search <file.html>          Parse a saved search page

Examples:
  npm run lookup -- "3227 Planters Ridge Rd 28270"
  npm run lookup -- --fixture-info ../specs/sample/meckboe-address-information.aspx.html
`.trim();

async function main(): Promise<void> {
  const argv = process.argv.slice(2);

  if (argv.length === 0 || argv[0] === '--help' || argv[0] === '-h') {
    console.log(USAGE);
    process.exit(argv.length === 0 ? 1 : 0);
  }

  // --- Fixture modes: pure offline HTML parsing, no credentials needed. ---
  if (argv[0] === '--fixture-info') {
    const file = requireArg(argv[1], '--fixture-info needs a file path');
    const html = await readFile(file, 'utf8');
    // The info page doesn't restate the voter's address, so pass a placeholder.
    printResult(parseBallotInformation(html, '(fixture)'));
    return;
  }

  if (argv[0] === '--fixture-search') {
    const file = requireArg(argv[1], '--fixture-search needs a file path');
    const html = await readFile(file, 'utf8');
    printResult(parseSearchResults(html));
    return;
  }

  // --- Remote mode: call the deployed callable function over HTTPS. ---
  if (argv[0] === '--url') {
    const url = requireArg(argv[1], '--url needs a function URL');
    const address = requireArg(argv[2], '--url needs an address argument');
    await callDeployed(url, address);
    return;
  }

  // --- Default: run the full pipeline in-process. ---
  const address = argv.join(' ');
  const service = new AddressLookupService(loadConfig());
  try {
    const result = await service.lookup(address);
    printResult(result);
  } catch (err) {
    handleLookupError(err);
  }
}

/** POST to a deployed callable function and print its response. */
async function callDeployed(url: string, address: string): Promise<void> {
  const response = await globalThis.fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: { address } }),
  });

  const payload = (await response.json()) as
    | { result: unknown }
    | { error: { message: string; status?: string; details?: unknown } };

  if ('error' in payload) {
    console.error('Lookup failed:');
    printResult(payload.error, process.stderr);
    process.exit(1);
  }
  printResult(payload.result);
}

/** Render our LookupError (or any error) as readable JSON, then exit non-zero. */
function handleLookupError(err: unknown): never {
  if (err instanceof LookupError) {
    printResult(
      { status: 'error', code: err.code, message: err.message, candidates: err.candidates },
      process.stderr,
    );
    process.exit(1);
  }
  console.error(err instanceof Error ? err.stack ?? err.message : String(err));
  process.exit(1);
}

/** Print a value as pretty JSON to stdout (or a chosen stream). */
function printResult(value: unknown, stream: NodeJS.WriteStream = process.stdout): void {
  stream.write(JSON.stringify(value, null, 2) + '\n');
}

/** Ensure a required positional argument is present. */
function requireArg(value: string | undefined, message: string): string {
  if (!value) {
    console.error(message);
    process.exit(1);
  }
  return value;
}

// Allow passing a relative path to fixtures via a file URL if needed elsewhere.
export const _forTesting = { pathToFileURL };

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
