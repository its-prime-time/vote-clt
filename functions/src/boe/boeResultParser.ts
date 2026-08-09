/**
 * boeResultParser.ts
 *
 * Pure HTML-parsing logic for the two BOE pages we care about:
 *
 *   1. The *search results* page — a list of matching address links.
 *   2. The *address information* page — the districts, sample ballots, polling
 *      place, and precinct for a single resolved address.
 *
 * "Pure" means: HTML in, structured data out. No network, no ScrapingBee, no
 * Genkit. That makes this the easiest part of the system to test — we can feed
 * it the saved sample files in specs/sample and assert on the output.
 *
 * We use cheerio, a lightweight server-side implementation of jQuery-style DOM
 * querying, to pull values out by their element ids (which the BOE's ASP.NET
 * pages helpfully assign, e.g. `#lblCongress`).
 */

import * as cheerio from 'cheerio';
import { SEARCH_FORM, toAbsoluteBoeUrl } from './boeUrls.js';
import type {
  AddressCandidate,
  BallotInformation,
  PollingPlace,
  SampleBallot,
} from '../lookup/types.js';

/**
 * Collapse the BOE's generous whitespace (trailing spaces, non-breaking
 * spaces, newlines) into a single clean string.
 */
function clean(text: string | undefined | null): string {
  return (text ?? '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Extract the list of candidate addresses from a search results page.
 *
 * The results live as `<a>` links inside the `#dgAddress` table. Zero links
 * means "not found"; one means we can proceed; more than one means the user
 * must disambiguate.
 */
export function parseSearchResults(html: string): AddressCandidate[] {
  const $ = cheerio.load(html);
  const candidates: AddressCandidate[] = [];

  $(`${SEARCH_FORM.resultsTable} a`).each((_, el) => {
    const link = $(el);
    const href = link.attr('href');
    if (!href) return;
    candidates.push({
      label: clean(link.text()),
      url: toAbsoluteBoeUrl(href),
    });
  });

  return candidates;
}

/** The party links on the address-info page, keyed by their element id. */
const SAMPLE_BALLOT_IDS: ReadonlyArray<{ id: string; party: string }> = [
  { id: '#hyperlinkDem', party: 'Democratic' },
  { id: '#hyperlinkRep', party: 'Republican' },
  { id: '#hyperlinkLib', party: 'Libertarian' },
  { id: '#hyperlinkUna', party: 'Unaffiliated' },
  { id: '#hyperlinkCst', party: 'Constitution' },
  { id: '#hyperlinkGre', party: 'Green' },
];

/** District rows, keyed by element id and mapped to a stable output key. */
const DISTRICT_IDS: ReadonlyArray<{ id: string; key: string }> = [
  { id: '#lblCongress', key: 'congress' },
  { id: '#lblSenate', key: 'stateSenate' },
  { id: '#lblHouse', key: 'stateHouse' },
  { id: '#lblJudicial', key: 'judicial' },
  { id: '#lblSuperior', key: 'superiorCourt' },
  { id: '#lblCountyCommissioners', key: 'countyCommission' },
  { id: '#lblSchool', key: 'school' },
  { id: '#lblMuni', key: 'municipality' },
  { id: '#lblCityCouncil', key: 'cityCouncil' },
];

/**
 * Parse the full address-information page into structured ballot data.
 *
 * `matchedAddress` is the label the BOE showed for the selected address on the
 * search page (the info page itself does not restate the voter's own address),
 * so we thread it through from the caller.
 */
export function parseBallotInformation(
  html: string,
  matchedAddress: string,
): BallotInformation {
  const $ = cheerio.load(html);
  const textById = (id: string) => clean($(id).text());
  const hrefById = (id: string) => {
    const href = $(id).attr('href');
    return href ? toAbsoluteBoeUrl(href) : undefined;
  };

  // --- Election title, derived from the "…Sample Ballots:" heading ---
  const ballotsHeading = textById('#lblSampleBallots'); // "2026 Primary Election Sample Ballots:"
  const electionTitle =
    clean(ballotsHeading.replace(/sample ballots:?/i, '')) || undefined;

  // --- Sample ballots ---
  const sampleBallots: SampleBallot[] = [];
  for (const { id, party } of SAMPLE_BALLOT_IDS) {
    const href = $(id).attr('href');
    if (!href) continue;
    const url = href; // These are already absolute (http://apps.meckboe.org/...).
    // The BOE points parties with no ballot at a "NO BALLOT" placeholder PDF.
    // Decode first so the URL-encoded space in "NO%20BALLOT" becomes a space.
    const hasBallot = !/no\s*ballot/i.test(safeDecode(url));
    sampleBallots.push({ party, url, hasBallot });
  }

  // --- Districts ---
  const districts: Record<string, string> = {};
  for (const { id, key } of DISTRICT_IDS) {
    const value = textById(id);
    if (value) districts[key] = value;
  }

  // --- Polling place ---
  const pollingPlace = parsePollingPlace($);

  // --- Precinct ---
  const precinct = textById('#lblPrecinct') || undefined;

  return {
    matchedAddress: clean(matchedAddress),
    electionTitle,
    sampleBallots,
    districts,
    pollingPlace,
    precinct,
    electedOfficialsUrl: hrefById('#hyperlinkElectedOfficial'),
    // The candidates page isn't always rendered as a visible link; find it by
    // its target page name if present.
    candidatesUrl: findHrefContaining($, 'CandidatesByAddress.aspx'),
  };
}

/** Assemble the polling-place block, or undefined if the name is missing. */
function parsePollingPlace($: cheerio.CheerioAPI): PollingPlace | undefined {
  const clean_ = (id: string) =>
    ($(id).text() ?? '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();

  const name = clean_('#lblPPName');
  if (!name) return undefined;

  // The street address is spread across several spans (number, direction,
  // name, type, suffix); join whichever are present.
  const streetAddress = [
    clean_('#lblHouseNumber'),
    clean_('#lblStreetDir'),
    clean_('#lblStreetName'),
    clean_('#lblStreetType'),
    clean_('#lblStreetSufx'),
  ]
    .filter(Boolean)
    .join(' ');

  const mapHref = $('#hyperlinkMap').attr('href');
  const directionsHref = $('#hyperlinkDirection').attr('href');

  return {
    name,
    streetAddress,
    city: clean_('#lblCity'),
    state: clean_('#lblState'),
    zip: clean_('#lblZipCode'),
    mapUrl: mapHref || undefined,
    directionsUrl: directionsHref || undefined,
  };
}

/** Decode percent-encoding without throwing on malformed input. */
function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/** Find the first anchor whose href contains `needle`, returned absolute. */
function findHrefContaining(
  $: cheerio.CheerioAPI,
  needle: string,
): string | undefined {
  let found: string | undefined;
  $('a[href]').each((_, el) => {
    if (found) return;
    const href = $(el).attr('href');
    if (href && href.includes(needle)) {
      found = toAbsoluteBoeUrl(href);
    }
  });
  return found;
}
