/**
 * contests.ts
 *
 * Turns an NCSBE contest name into structure. NCSBE writes contest names in a
 * consistent pattern — the office, then optional qualifiers:
 *
 *   US HOUSE OF REPRESENTATIVES DISTRICT 08
 *   NC COURT OF APPEALS JUDGE SEAT 02
 *   NC SUPERIOR COURT JUDGE DISTRICT 26C SEAT 01
 *   NC DISTRICT COURT JUDGE DISTRICT 26 SEAT 06 (UNEXPIRED)
 *   MECKLENBURG COUNTY BOARD OF COMMISSIONERS AT-LARGE
 *   SOIL & WATER CONSERVATION DISTRICT SUPERVISOR      (no qualifiers — "DISTRICT" here
 *                                                       is part of the office name)
 *
 * We peel the qualifiers off the END of the string one at a time; whatever is
 * left is the office. That is deliberately generic — a new office appearing in
 * the sheet needs no code change here, only (optionally) a title in
 * src/data/offices.ts.
 */

import type { BallotMatch, JurisdictionSlug } from '../../../src/data/candidateTypes';
import { offices } from '../../../src/data/offices';

export interface ParsedContest {
  office: string;
  /** Human-readable office name derived from the NCSBE text, e.g. "Nc House Of Representatives". */
  officeName: string;
  jurisdiction: JurisdictionSlug;
  district: string | null;
  seat: string | null;
  atLarge: boolean;
  unexpiredTerm: boolean;
  ballotMatch: BallotMatch;
}

/** Parse a contest name. Returns null if nothing recognisable is left after stripping. */
export function parseContestName(contestName: string): ParsedContest | null {
  let rest = contestName.trim().toUpperCase().replace(/\s+/g, ' ');
  let district: string | null = null;
  let seat: string | null = null;
  let atLarge = false;
  let unexpiredTerm = false;

  // Strip qualifiers from the end until none match. Order doesn't matter
  // because each pattern is anchored to the end of the remaining string.
  let stripped = true;
  while (stripped) {
    stripped = false;

    const unexpired = rest.match(/\s*\(UNEXPIRED(?: TERM)?\)$/);
    if (unexpired) {
      unexpiredTerm = true;
      rest = rest.slice(0, unexpired.index);
      stripped = true;
    }

    const seatMatch = rest.match(/\s+SEAT\s+(\d+[A-Z]?)$/);
    if (seatMatch) {
      seat = stripZeros(seatMatch[1]);
      rest = rest.slice(0, seatMatch.index);
      stripped = true;
    }

    // Only a DISTRICT followed by a number counts; "…CONSERVATION DISTRICT
    // SUPERVISOR" keeps its DISTRICT because "SUPERVISOR" isn't numeric.
    const districtMatch = rest.match(/\s+DISTRICT\s+(\d+[A-Z]?)$/);
    if (districtMatch) {
      district = stripZeros(districtMatch[1]);
      rest = rest.slice(0, districtMatch.index);
      stripped = true;
    }

    const atLargeMatch = rest.match(/\s+AT[- ]LARGE$/);
    if (atLargeMatch) {
      atLarge = true;
      rest = rest.slice(0, atLargeMatch.index);
      stripped = true;
    }
  }

  const officeName = rest.trim();
  if (!officeName) return null;

  const office = slugify(officeName);
  const info = offices[office];
  const jurisdiction = info?.jurisdiction ?? inferJurisdiction(officeName);
  const ballotMatch =
    info?.ballotMatch ?? inferBallotMatch(office, jurisdiction, { district, atLarge });

  return {
    office,
    officeName: titleCase(officeName),
    jurisdiction,
    district,
    seat,
    atLarge,
    unexpiredTerm,
    ballotMatch,
  };
}

/** "088" → "88", "08" → "8", "26C" → "26C", "0" → "0". */
export function stripZeros(value: string): string {
  return value.replace(/^0+(?=\d)/, '');
}

/** "NC HOUSE OF REPRESENTATIVES" → "nc-house-of-representatives"; "SOIL & WATER" → "soil-water". */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Fallback display name when offices.ts has no title: "NC HOUSE" → "NC House". */
function titleCase(text: string): string {
  return text
    .toLowerCase()
    .replace(/\b[a-z]/g, (c) => c.toUpperCase())
    // Keep the two abbreviations NCSBE uses upper-case.
    .replace(/\bUs\b/g, 'US')
    .replace(/\bNc\b/g, 'NC');
}

/**
 * Which nav bucket a contest belongs to, from its prefix. Everything that
 * isn't clearly federal, state, or city is a county office.
 */
function inferJurisdiction(officeName: string): JurisdictionSlug {
  if (/^US\b/.test(officeName)) return 'united-states';
  if (/^NC\b/.test(officeName)) return 'north-carolina';
  if (/^(CITY OF )?CHARLOTTE\b/.test(officeName)) return 'city-of-charlotte';
  return 'mecklenburg-county';
}

/**
 * How the contest lines up with the BOE address lookup's `districts` map.
 * These rules cover every office on the 2026 ballot; offices.ts can override
 * any of them per office.
 */
function inferBallotMatch(
  office: string,
  jurisdiction: JurisdictionSlug,
  parts: { district: string | null; atLarge: boolean },
): BallotMatch {
  const { district, atLarge } = parts;
  const withDistrict = (districtKey: BallotMatch['districtKey']): BallotMatch =>
    district ? { districtKey, district } : { districtKey: 'county' };

  if (office.startsWith('us-house')) return withDistrict('congress');
  if (office.includes('state-senate')) return withDistrict('stateSenate');
  if (office.includes('house-of-representatives')) return withDistrict('stateHouse');
  if (office.includes('superior-court-judge')) return withDistrict('superiorCourt');
  if (office.includes('district-court-judge') || office === 'district-attorney') {
    return withDistrict('judicial');
  }
  if (office.includes('board-of-commissioners')) {
    return atLarge ? { districtKey: 'county' } : withDistrict('countyCommission');
  }
  if (office.includes('board-of-education') || office.includes('school-board')) {
    return atLarge ? { districtKey: 'county' } : withDistrict('school');
  }
  if (office.includes('city-council')) {
    return atLarge || !district ? { districtKey: 'municipality' } : withDistrict('cityCouncil');
  }
  if (jurisdiction === 'city-of-charlotte') return { districtKey: 'municipality' };

  // US Senate, NC Supreme Court, NC Court of Appeals: every voter sees them.
  if (jurisdiction === 'united-states' || jurisdiction === 'north-carolina') {
    return { districtKey: 'statewide' };
  }
  // Sheriff, Clerk of Superior Court, Soil & Water: countywide.
  return { districtKey: 'county' };
}
