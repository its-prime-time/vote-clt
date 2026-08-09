/**
 * types.ts
 *
 * The shared domain vocabulary for address lookup: the shape of a parsed
 * address, the structured result we return to callers, and the typed errors
 * that describe the ways a lookup can fail.
 *
 * Keeping these in one place means the AI parser, the BOE client, the callable
 * function, and the CLI all speak the same language.
 */

/**
 * A street address broken into the three pieces the BOE search form
 * understands. Note the BOE form only actually *submits* the house number and
 * street name (its "street type" box has no form field), so `streetType` is
 * optional and used mainly for display / disambiguation.
 */
export interface ParsedAddress {
  /** The numeric house number, e.g. "3227". */
  houseNumber: string;
  /** The street name without the type, e.g. "Planters Ridge". */
  streetName: string;
  /** The street type/suffix if present, e.g. "Rd", "Ave", "Ln". */
  streetType?: string;
}

/** One selectable address returned by the BOE when a search is ambiguous. */
export interface AddressCandidate {
  /** The human-readable label, e.g. "3227  PLANTERS RIDGE RD 28270". */
  label: string;
  /** The absolute BOE URL that resolves this specific address. */
  url: string;
}

/** A link to a party-specific sample ballot PDF. */
export interface SampleBallot {
  /** Party name as shown on the BOE page, e.g. "Democratic". */
  party: string;
  /** Absolute URL to the ballot PDF. */
  url: string;
  /**
   * True when the BOE has no ballot for this party (the link points at a
   * "NO BALLOT" placeholder PDF). Lets the UI grey these out.
   */
  hasBallot: boolean;
}

/** The voter's assigned polling place. */
export interface PollingPlace {
  name: string;
  /** The polling-place street address, already assembled into one line. */
  streetAddress: string;
  city: string;
  state: string;
  zip: string;
  /** Optional map / directions links the BOE provides. */
  mapUrl?: string;
  directionsUrl?: string;
}

/**
 * The full structured payload scraped from the BOE result page. We capture
 * everything on the page even if the front-end does not display all of it yet.
 */
export interface BallotInformation {
  /** The address the BOE actually matched, echoed back for confirmation. */
  matchedAddress: string;
  /** Election title from the page, e.g. "2026 Primary Election". */
  electionTitle?: string;
  /** Party -> sample ballot PDF links. */
  sampleBallots: SampleBallot[];
  /**
   * The voter's districts, keyed by the BOE's label. Examples of keys:
   * "congress", "stateSenate", "stateHouse", "judicial", "superiorCourt",
   * "countyCommission", "school", "municipality", "cityCouncil".
   */
  districts: Record<string, string>;
  pollingPlace?: PollingPlace;
  /** The precinct name/number, e.g. "PCT 091". */
  precinct?: string;
  /** Link to the voter's elected officials page, if present. */
  electedOfficialsUrl?: string;
  /** Link to the candidates-by-address page, if present. */
  candidatesUrl?: string;
}

/** The successful result of a full address lookup. */
export interface LookupSuccess {
  status: 'ok';
  /** How the AI parsed the input, for transparency/debugging. */
  parsedAddress: ParsedAddress;
  ballot: BallotInformation;
}

/**
 * The set of well-known failure reasons. Using a string union (rather than
 * free-form messages) lets the front-end show a tailored message and, for
 * `multiple_matches`, render the candidate links for the user to choose from.
 */
export type LookupErrorCode =
  // The AI could not confidently split the input into a house number + street.
  | 'unrecognized_address'
  // The BOE search returned zero matching addresses.
  | 'address_not_found'
  // The BOE search returned more than one address; user must disambiguate.
  | 'multiple_matches'
  // Something went wrong talking to the BOE / ScrapingBee / Vertex AI.
  | 'upstream_error';

/**
 * A typed error carrying a machine-readable `code`, a user-facing `message`,
 * and — for the multiple-matches case — the candidate addresses to choose from.
 */
export class LookupError extends Error {
  constructor(
    readonly code: LookupErrorCode,
    message: string,
    readonly candidates?: AddressCandidate[],
  ) {
    super(message);
    this.name = 'LookupError';
  }
}
