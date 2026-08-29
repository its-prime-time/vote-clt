/**
 * candidateTypes.ts
 *
 * The shape of the generated candidate data (`src/data/generated/candidates.json`).
 *
 * These types are shared by two very different consumers:
 *   - the ingest script (`scripts/ingest/`), which PRODUCES the JSON, and
 *   - the site (`src/data/candidates.ts` and the pages), which READS it.
 *
 * Keeping them in a file with no imports and no runtime code means either side
 * can import it without dragging the other along. If you change a field here,
 * TypeScript will point out every producer and consumer that needs updating.
 */

/** The four buckets in the "All Candidates" dropdown. */
export type JurisdictionSlug =
  | 'united-states'
  | 'north-carolina'
  | 'mecklenburg-county'
  | 'city-of-charlotte';

/**
 * NCSBE party codes as they appear in the filing export. We keep the codes
 * themselves in the data and map them to labels/colours in the UI.
 */
export type PartyCode =
  | 'DEM' // Democratic
  | 'REP' // Republican
  | 'LIB' // Libertarian
  | 'GRE' // Green
  | 'CST' // Constitution
  | 'JFA' // Justice for All
  | 'WTP' // We The People
  | 'UNA' // Unaffiliated
  | 'NP'; // Nonpartisan contest (no party on the ballot)

/**
 * How a contest lines up with the districts the BOE address lookup returns
 * (see `functions/src/lookup/types.ts` → `BallotInformation.districts`).
 *
 *   - `statewide`  every voter in the county sees it (US Senate, NC Supreme Court…)
 *   - `county`     every Mecklenburg voter sees it (Sheriff, DA, at-large seats…)
 *   - anything else is a key into the BOE `districts` map; `district` must
 *     equal the number/letter part of the BOE value ("NC HOUSE DISTRICT 105" → "105").
 */
export interface BallotMatch {
  districtKey:
    | 'statewide'
    | 'county'
    | 'congress'
    | 'stateSenate'
    | 'stateHouse'
    | 'judicial'
    | 'superiorCourt'
    | 'countyCommission'
    | 'school'
    | 'municipality'
    | 'cityCouncil';
  district?: string;
}

/** One race on the ballot, e.g. "NC HOUSE OF REPRESENTATIVES DISTRICT 105". */
export interface Contest {
  /** Stable slug, e.g. "nc-house-of-representatives-105". */
  id: string;
  /** The contest name exactly as NCSBE wrote it. */
  name: string;
  /**
   * The office with district/seat tokens removed and slugified, e.g.
   * "nc-house-of-representatives". Display titles are looked up by this key
   * in `src/data/offices.ts`.
   */
  office: string;
  jurisdiction: JurisdictionSlug;
  /** District number/letter without zero padding ("8", "105", "26C"); null if none. */
  district: string | null;
  /** Seat number without zero padding ("1"); null if none. */
  seat: string | null;
  atLarge: boolean;
  /** How many candidates a voter may pick in this contest. */
  voteFor: number;
  partisan: boolean;
  /** True when the seat is being filled for the remainder of a term. */
  unexpiredTerm: boolean;
  ballotMatch: BallotMatch;
}

/** A candidate's normalized photo, plus what it was made from. */
export interface CandidatePhoto {
  /** Site path, e.g. "/candidates/raygan_jason_angel.jpg". */
  path: string;
  /** The Drive file the photo was made from — lets a re-run skip unchanged files. */
  sourceName: string;
  /** SHA-256 of the source bytes. */
  sourceHash: string;
  /** Pixel size of the source, so the ingest can keep warning about small originals. */
  sourceWidth: number;
  sourceHeight: number;
}

/** One candidacy: a person running in one contest. */
export interface Candidate {
  /** The sheet's ID column, e.g. "raygan_jason_angel". */
  id: string;
  contestId: string;
  /** Name as it appears on the ballot. */
  name: string;
  party: PartyCode;
  website: string | null;
  /**
   * Policy blurb, one bullet per array entry, per language. `es` is empty
   * until the editorial team fills in the Spanish column; the UI falls back
   * to `en`.
   */
  issues: { en: string[]; es: string[] };
  photo: CandidatePhoto | null;
  /** True when website, blurb and photo are all present. */
  profileComplete: boolean;
}

/** The whole generated file. */
export interface CandidateData {
  /** ISO timestamp of the ingest run. */
  generatedAt: string;
  source: {
    sheetId: string;
    /** From the Drive metadata when available, otherwise null. */
    sheetModified: string | null;
  };
  election: {
    /** e.g. "2026-11-03" — also used as the elections.ts id. */
    id: string;
    date: string;
    county: string;
  };
  contests: Contest[];
  candidates: Candidate[];
}
