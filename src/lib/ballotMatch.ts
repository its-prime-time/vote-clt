/**
 * ballotMatch.ts
 *
 * Decides which contests are on a voter's ballot, given the districts the
 * Board of Elections lookup returned for their address.
 *
 * This is deliberately a pure function with no DOM or network access: it runs
 * in the browser on the results page, and it has unit tests
 * (ballotMatch.test.ts) because a mistake here shows a voter the wrong
 * candidates.
 *
 * Inputs
 * ------
 * `districts` is the `ballot.districts` object from the lookup function, e.g.
 *
 *   { congress: "CONGRESSIONAL DISTRICT 8", stateHouse: "NC HOUSE DISTRICT 105",
 *     superiorCourt: "SUPERIOR COURT DISTRICT 26A", municipality: "CHARLOTTE", … }
 *
 * Each contest carries a `ballotMatch` written by the ingest for exactly this
 * purpose (see src/data/candidateTypes.ts).
 */

import type { BallotMatch } from '../data/candidateTypes';

/** The minimum a contest needs to be matched — the full Contest type satisfies it. */
export interface Matchable {
  id: string;
  ballotMatch: BallotMatch;
}

/** The only municipality whose contests we carry. Compared case-insensitively. */
const CITY = 'CHARLOTTE';

/**
 * Return the contests that belong on this voter's ballot, in the order given.
 */
export function matchContests<T extends Matchable>(
  districts: Record<string, string | undefined> | undefined,
  contests: readonly T[],
): T[] {
  const boe = districts ?? {};
  const inCity = normalizeName(boe.municipality) === CITY;

  return contests.filter((contest) => {
    const { districtKey, district } = contest.ballotMatch;

    switch (districtKey) {
      // Every voter in the county sees these.
      case 'statewide':
      case 'county':
        return true;

      // City-wide contests (mayor, at-large council) need the voter to live in the city.
      case 'municipality':
        return inCity;

      // Council districts only exist inside the city.
      case 'cityCouncil':
        return inCity && sameDistrict(boe[districtKey], district);

      // Everything else compares the district number/letter.
      default:
        return sameDistrict(boe[districtKey], district);
    }
  });
}

/**
 * Pull the district token off the end of a BOE label:
 *   "NC HOUSE DISTRICT 105"        → "105"
 *   "SUPERIOR COURT DISTRICT 26A"  → "26A"
 *   "SCHOOL BOARD DIST 6"          → "6"
 * Returns null when there is no trailing number.
 */
export function districtToken(label: string | undefined): string | null {
  if (!label) return null;
  const match = label.trim().match(/(\d+)\s*([A-Z])?$/i);
  if (!match) return null;
  const number = match[1].replace(/^0+(?=\d)/, '');
  const letter = (match[2] ?? '').toUpperCase();
  return `${number}${letter}`;
}

/** True when both sides name the same district (zero padding and case ignored). */
function sameDistrict(boeLabel: string | undefined, contestDistrict: string | undefined): boolean {
  if (!contestDistrict) return false;
  const wanted = districtToken(contestDistrict);
  const actual = districtToken(boeLabel);
  return wanted !== null && actual !== null && wanted === actual;
}

function normalizeName(value: string | undefined): string {
  return (value ?? '').trim().toUpperCase();
}
