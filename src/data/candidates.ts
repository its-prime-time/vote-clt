/**
 * candidates.ts
 *
 * The site's view of the generated candidate data. Pages import from here
 * rather than touching the JSON directly, so the file layout can change
 * without every page knowing.
 *
 * The JSON is produced by `make ingest` (scripts/ingest/) from the editorial
 * spreadsheet and committed to the repo; see specs/003-data-ingest.md.
 */

import type { Locale } from '../i18n/utils';
import type { Candidate, CandidateData, Contest, JurisdictionSlug, PartyCode } from './candidateTypes';
import raw from './generated/candidates.json';
import { offices } from './offices';

export type { Candidate, Contest, JurisdictionSlug, PartyCode } from './candidateTypes';

export const candidateData = raw as CandidateData;

/** Contests in ballot order (the ingest sorts them). */
export const contests: Contest[] = candidateData.contests;

/** Candidates in contest order, then by name. */
export const candidates: Candidate[] = candidateData.candidates;

export const contestById: ReadonlyMap<string, Contest> = new Map(contests.map((c) => [c.id, c]));

const candidatesByContest = new Map<string, Candidate[]>();
for (const candidate of candidates) {
  const list = candidatesByContest.get(candidate.contestId) ?? [];
  list.push(candidate);
  candidatesByContest.set(candidate.contestId, list);
}

/** Everyone running in one contest. */
export function candidatesFor(contestId: string): Candidate[] {
  return candidatesByContest.get(contestId) ?? [];
}

/** A candidate paired with the contest they're running in — what a card renders. */
export interface Candidacy {
  candidate: Candidate;
  contest: Contest;
}

/**
 * One section on a candidates page: an office (e.g. "NC Senate") with every
 * candidate in every contest for that office (districts 37–42), in order.
 */
export interface OfficeGroup {
  office: string;
  contests: Contest[];
  candidacies: Candidacy[];
}

/**
 * The sections for one jurisdiction's page — or, with no argument, for the
 * whole ballot — in ballot order.
 */
export function officeGroupsFor(jurisdiction?: JurisdictionSlug): OfficeGroup[] {
  const groups: OfficeGroup[] = [];
  for (const contest of contests) {
    if (jurisdiction && contest.jurisdiction !== jurisdiction) continue;
    let group = groups.at(-1);
    if (!group || group.office !== contest.office) {
      group = { office: contest.office, contests: [], candidacies: [] };
      groups.push(group);
    }
    group.contests.push(contest);
    for (const candidate of candidatesFor(contest.id)) {
      group.candidacies.push({ candidate, contest });
    }
  }
  return groups;
}

/**
 * Display title for an office. Falls back to a title-cased version of the
 * office key when offices.ts has no entry (the ingest prints a note when that
 * happens so someone adds one).
 */
export function officeTitle(office: string, locale: Locale): string {
  const info = offices[office];
  if (info) return info.title[locale] || info.title.en;
  return office
    .split('-')
    .map((word) => (word === 'us' || word === 'nc' ? word.toUpperCase() : word[0].toUpperCase() + word.slice(1)))
    .join(' ');
}

/**
 * The language a candidate's blurb is actually available in: the requested
 * one, or English until the Spanish column is filled in.
 */
export function issuesLocale(candidate: Candidate, locale: Locale): Locale {
  return candidate.issues[locale].length > 0 ? locale : 'en';
}

/** The blurb in the requested language, falling back to English until the Spanish is written. */
export function issuesFor(candidate: Candidate, locale: Locale): string[] {
  return candidate.issues[issuesLocale(candidate, locale)];
}

/**
 * The letter shown after a candidate's name, e.g. "Vickie Sawyer (R)". Empty
 * for nonpartisan contests, where the ballot shows no party.
 */
export const partyAbbreviation: Record<PartyCode, string> = {
  DEM: 'D',
  REP: 'R',
  LIB: 'L',
  GRE: 'G',
  CST: 'C',
  JFA: 'JFA',
  WTP: 'WTP',
  UNA: 'U',
  NP: '',
};
