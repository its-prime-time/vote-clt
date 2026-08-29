/**
 * transform.ts
 *
 * The heart of the ingest: joins the two spreadsheet tabs into the contest and
 * candidate records the site consumes, validating as it goes. Every finding
 * about the CONTENT of the data is logged to the IssueLog; this function only
 * throws when the spreadsheet is structurally unusable (a missing column).
 *
 * Photos are handled separately (photos.ts) because they involve I/O; this
 * module is pure data-in, data-out so it is easy to reason about and test.
 */

import type { Candidate, Contest, PartyCode } from '../../../src/data/candidateTypes';
import { offices, officeRank } from '../../../src/data/offices';
import { BLURB, KNOWN_PARTIES, LISTING_TAB, PROFILES_TAB } from '../config';
import { parseContestName, slugify } from './contests';
import type { IssueLog } from './issues';
import { isBlankRow, requireColumns, type SheetRow, type SheetTab } from './sheets';

/** Columns we read from the NCSBE listing tab. */
const LISTING_COLUMNS = [
  'ID',
  'election_dt',
  'county_name',
  'contest_name',
  'name_on_ballot',
  'first_name',
  'last_name',
  'party_candidate',
  'is_unexpired',
  'is_partisan',
  'vote_for',
] as const;

/** Columns we read from the editorial profiles tab. */
const PROFILE_COLUMNS = [
  'ID',
  'Name on Ballot',
  'Party',
  'Image',
  'Website',
  'Policy Blurb (EN)',
  'Policy Blurb (ES)',
] as const;

/** A candidate as assembled from the sheets, before photos are resolved. */
export interface CandidateDraft extends Omit<Candidate, 'photo' | 'profileComplete'> {
  /** The editors ticked the Image box — a file named `<id>.*` should exist. */
  wantsPhoto: boolean;
  /** For sorting within a contest. */
  sortName: string;
}

export interface TransformResult {
  election: { id: string; date: string; county: string };
  contests: Contest[];
  candidates: CandidateDraft[];
  /** The number the editors track in the Profiles tab's "EN Completed" tally, if present. */
  tallyEnCompleted: number | null;
}

export function transform(listing: SheetTab, profiles: SheetTab, log: IssueLog): TransformResult {
  requireColumns(listing, [...LISTING_COLUMNS]);
  requireColumns(profiles, [...PROFILE_COLUMNS]);

  const listingRows = listing.rows.filter((row) => !isBlankRow(row));
  const profileRows = profiles.rows.filter((row) => row.cells.ID !== '');

  const profilesById = indexProfiles(profileRows, log);
  const election = readElection(listingRows, log);

  const contestsById = new Map<string, Contest>();
  const candidates: CandidateDraft[] = [];
  const seenIds = new Set<string>();

  for (const row of listingRows) {
    const c = row.cells;
    const subject = c.name_on_ballot || c.ID || `row ${row.rowNumber}`;

    // --- Rows that cannot be published at all ---------------------------
    if (!c.ID || !c.contest_name) {
      log.error(
        LISTING_TAB,
        subject,
        `has ${!c.ID ? 'no ID' : 'no contest_name'}${!c.ID && !c.contest_name ? ' and no contest_name' : ''}. ` +
          'Complete the row or delete it. The candidate is not on the site.',
        row.rowNumber,
      );
      continue;
    }
    if (seenIds.has(c.ID)) {
      log.error(LISTING_TAB, subject, `ID "${c.ID}" appears more than once. Only the first row is used.`, row.rowNumber);
      continue;
    }
    seenIds.add(c.ID);

    const parsed = parseContestName(c.contest_name);
    if (!parsed) {
      log.error(LISTING_TAB, subject, `contest_name "${c.contest_name}" could not be understood. The candidate is not on the site.`, row.rowNumber);
      continue;
    }

    // --- Contest (one per distinct contest_name) -------------------------
    const contestId = buildContestId(parsed.office, parsed.district, parsed.seat, parsed.atLarge);
    if (!contestsById.has(contestId)) {
      contestsById.set(contestId, {
        id: contestId,
        name: c.contest_name,
        office: parsed.office,
        jurisdiction: parsed.jurisdiction,
        district: parsed.district,
        seat: parsed.seat,
        atLarge: parsed.atLarge,
        voteFor: parsePositiveInt(c.vote_for) ?? 1,
        partisan: c.is_partisan.toUpperCase() !== 'FALSE',
        unexpiredTerm: parsed.unexpiredTerm || c.is_unexpired.toUpperCase() === 'TRUE',
        ballotMatch: parsed.ballotMatch,
      });
      if (!offices[parsed.office]) {
        // Not an editorial problem — a developer adds a title to offices.ts.
        console.warn(`note: office "${parsed.office}" (${parsed.officeName}) has no entry in src/data/offices.ts; using the NCSBE name.`);
      }
    }

    // --- Party -------------------------------------------------------------
    const partyRaw = c.party_candidate.toUpperCase();
    const party = (KNOWN_PARTIES as readonly string[]).includes(partyRaw) ? (partyRaw as PartyCode) : null;
    if (!party) {
      log.error(LISTING_TAB, subject, `party_candidate "${c.party_candidate}" is not a recognised party code (expected one of ${KNOWN_PARTIES.join(', ')}). Shown as nonpartisan.`, row.rowNumber);
    }

    // --- Profile join ------------------------------------------------------
    const profile = profilesById.get(c.ID);
    if (!profile) {
      const nearest = nearestId(c.ID, [...profilesById.keys()]);
      log.error(
        LISTING_TAB,
        subject,
        `ID "${c.ID}" has no matching row on the ${PROFILES_TAB} tab` +
          (nearest ? ` — the closest ID there is "${nearest}"; one of them is probably a typo` : '') +
          '. Shown without website, blurb, or photo.',
        row.rowNumber,
      );
    } else {
      profilesById.delete(c.ID); // whatever remains afterwards is orphaned
      checkProfileAgainstListing(row, profile, subject, log);
    }

    const isJudicial = /judge|justice/.test(parsed.office);
    const issuesEn = profile ? readBlurb(profile, 'Policy Blurb (EN)', subject, isJudicial, log) : [];
    const issuesEs = profile ? readBlurb(profile, 'Policy Blurb (ES)', subject, isJudicial, log, { silent: true }) : [];
    const website = profile ? readWebsite(profile, subject, log) : null;
    const wantsPhoto = profile?.cells.Image.toUpperCase() === 'TRUE';

    candidates.push({
      id: c.ID,
      contestId,
      name: c.name_on_ballot,
      party: party ?? 'NP',
      website,
      issues: { en: issuesEn, es: issuesEs },
      wantsPhoto,
      sortName: `${c.last_name} ${c.first_name} ${c.name_on_ballot}`.toLowerCase(),
    });
  }

  // Profiles whose ID matched nothing in the listing.
  for (const [id, row] of profilesById) {
    const nearest = nearestId(id, [...seenIds]);
    log.error(
      PROFILES_TAB,
      row.cells['Name on Ballot'] || id,
      `ID "${id}" does not match any ID on the ${LISTING_TAB} tab` +
        (nearest ? ` — the closest ID there is "${nearest}"; one of them is probably a typo` : '') +
        '. This profile is not on the site.',
      row.rowNumber,
    );
  }

  const contests = [...contestsById.values()].sort(compareContests);
  const contestOrder = new Map(contests.map((contest, index) => [contest.id, index]));
  candidates.sort(
    (a, b) => contestOrder.get(a.contestId)! - contestOrder.get(b.contestId)! || a.sortName.localeCompare(b.sortName),
  );

  return { election, contests, candidates, tallyEnCompleted: readTally(profiles, 'EN Completed') };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Index profile rows by ID, reporting duplicates. */
function indexProfiles(rows: SheetRow[], log: IssueLog): Map<string, SheetRow> {
  const byId = new Map<string, SheetRow>();
  for (const row of rows) {
    const id = row.cells.ID;
    if (byId.has(id)) {
      log.error(PROFILES_TAB, row.cells['Name on Ballot'] || id, `ID "${id}" appears more than once. Only the first row is used.`, row.rowNumber);
      continue;
    }
    byId.set(id, row);
  }
  return byId;
}

/** Election date and county from the listing (they are the same on every row). */
function readElection(rows: SheetRow[], log: IssueLog): TransformResult['election'] {
  const dates = new Set(rows.map((r) => r.cells.election_dt).filter(Boolean));
  const counties = new Set(rows.map((r) => r.cells.county_name).filter(Boolean));
  if (dates.size > 1) log.warning(LISTING_TAB, 'election_dt', `more than one election date in the tab: ${[...dates].join(', ')}. Using the first.`);
  if (counties.size > 1) log.warning(LISTING_TAB, 'county_name', `more than one county in the tab: ${[...counties].join(', ')}. Using the first.`);

  const mmddyyyy = [...dates][0] ?? '';
  const match = mmddyyyy.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  const iso = match ? `${match[3]}-${match[1]}-${match[2]}` : mmddyyyy;
  if (!match) log.warning(LISTING_TAB, 'election_dt', `"${mmddyyyy}" is not in MM/DD/YYYY form.`);

  return { id: iso, date: iso, county: [...counties][0] ?? '' };
}

/** Name and party should agree across the tabs; differences usually mean a copy/paste slip. */
function checkProfileAgainstListing(listingRow: SheetRow, profile: SheetRow, subject: string, log: IssueLog): void {
  const listingName = listingRow.cells.name_on_ballot;
  const profileName = profile.cells['Name on Ballot'];
  if (profileName && profileName !== listingName) {
    log.warning(PROFILES_TAB, subject, `Name on Ballot is "${profileName}" here but "${listingName}" on the ${LISTING_TAB} tab. The listing's version is used.`, profile.rowNumber);
  }
  const listingParty = listingRow.cells.party_candidate.toUpperCase();
  const profileParty = profile.cells.Party.toUpperCase();
  if (profileParty && profileParty !== listingParty) {
    log.warning(PROFILES_TAB, subject, `Party is "${profileParty}" here but "${listingParty}" on the ${LISTING_TAB} tab. The listing's version is used.`, profile.rowNumber);
  }
}

/**
 * Split a blurb cell into lines and check it against the editorial standard.
 * `silent` skips the checks (used for the Spanish column while it is still
 * being filled in — an empty cell there is expected, not an issue).
 */
function readBlurb(
  profile: SheetRow,
  column: string,
  subject: string,
  isJudicial: boolean,
  log: IssueLog,
  options: { silent?: boolean } = {},
): string[] {
  const raw = profile.cells[column] ?? '';
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (options.silent || lines.length === 0) return lines;

  const isStatement = lines.length === 1 && isJudicial;
  if (!isStatement && lines.length !== BLURB.expectedLines) {
    log.warning(PROFILES_TAB, subject, `${column} has ${lines.length} line${lines.length === 1 ? '' : 's'}; the standard is ${BLURB.expectedLines} (one priority per line)${isJudicial ? ', or a single personal statement for judicial candidates' : ''}.`, profile.rowNumber);
  }
  const limit = isStatement ? BLURB.maxStatementLength : BLURB.maxLineLength;
  const longest = Math.max(...lines.map((line) => line.length));
  if (longest > limit) {
    log.warning(PROFILES_TAB, subject, `${column} has a line of ${longest} characters; lines over ${limit} wrap awkwardly on the candidate card.`, profile.rowNumber);
  }
  return lines;
}

/** Website must be an absolute http(s) URL to be published. */
function readWebsite(profile: SheetRow, subject: string, log: IssueLog): string | null {
  const raw = profile.cells.Website;
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error('not http');
    return url.toString();
  } catch {
    log.warning(PROFILES_TAB, subject, `Website "${raw}" is not a full web address starting with http:// or https://. Not shown.`, profile.rowNumber);
    return null;
  }
}

/** The Profiles tab keeps a small tally in the notes area: a label cell followed by a number cell. */
function readTally(profiles: SheetTab, label: string): number | null {
  for (const row of profiles.rows) {
    const values = Object.values(row.cells);
    const index = values.indexOf(label);
    if (index !== -1) {
      const n = parsePositiveInt(values[index + 1] ?? '');
      if (n !== null) return n;
    }
  }
  return null;
}

/**
 * The ID from `candidates` that is within a few typos of `id`, if any. IDs are
 * long slugs, so a small edit distance almost always means the same person.
 */
function nearestId(id: string, candidates: string[]): string | null {
  let best: { id: string; distance: number } | null = null;
  for (const other of candidates) {
    if (Math.abs(other.length - id.length) > 3) continue;
    const distance = editDistance(id, other);
    if (distance <= 3 && (!best || distance < best.distance)) best = { id: other, distance };
  }
  return best?.id ?? null;
}

/** Classic Levenshtein distance — the number of single-character edits between two strings. */
function editDistance(a: string, b: string): number {
  let previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    for (let j = 1; j <= b.length; j++) {
      current[j] = Math.min(
        previous[j] + 1,
        current[j - 1] + 1,
        previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    previous = current;
  }
  return previous[b.length];
}

function parsePositiveInt(text: string): number | null {
  return /^\d+$/.test(text) ? Number(text) : null;
}

/** "nc-house-of-representatives" + "105" → "nc-house-of-representatives-105". */
function buildContestId(office: string, district: string | null, seat: string | null, atLarge: boolean): string {
  const parts = [office];
  if (atLarge) parts.push('at-large');
  if (district) parts.push(slugify(district));
  if (seat) parts.push(`seat-${slugify(seat)}`);
  return parts.join('-');
}

const JURISDICTION_ORDER = ['united-states', 'north-carolina', 'mecklenburg-county', 'city-of-charlotte'];

/** Ballot order: jurisdiction, then office (offices.ts), then at-large, then district, then seat. */
function compareContests(a: Contest, b: Contest): number {
  return (
    JURISDICTION_ORDER.indexOf(a.jurisdiction) - JURISDICTION_ORDER.indexOf(b.jurisdiction) ||
    officeRank(a.office) - officeRank(b.office) ||
    a.office.localeCompare(b.office) ||
    Number(b.atLarge) - Number(a.atLarge) ||
    compareNatural(a.district, b.district) ||
    compareNatural(a.seat, b.seat)
  );
}

/** Numeric-aware compare so "8" < "12" < "26C"; nulls first. */
function compareNatural(a: string | null, b: string | null): number {
  if (a === b) return 0;
  if (a === null) return -1;
  if (b === null) return 1;
  return a.localeCompare(b, 'en', { numeric: true });
}
