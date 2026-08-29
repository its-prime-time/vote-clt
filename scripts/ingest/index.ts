/**
 * index.ts — `make ingest`
 *
 * Pulls the editorial team's candidate spreadsheet and photo folder into the
 * files the site is built from:
 *
 *   src/data/generated/candidates.json   contests + candidates (see candidateTypes.ts)
 *   public/candidates/<id>.jpg           normalized headshots
 *   data_quality_issues.md               feedback for the editorial team
 *
 * All three are committed to git, so the review of an ingest is an ordinary
 * pull request diff.
 *
 * Usage:
 *   npm run ingest                 fetch, validate, write everything
 *   npm run ingest -- --check      fetch and validate, write nothing; exit 1 if
 *                                  the committed files are out of date
 *   npm run ingest -- --no-photos  skip the photo folder (faster; keeps the
 *                                  photos recorded in the existing JSON)
 *
 * The run only aborts for problems that make the output meaningless (the sheet
 * can't be fetched, a column is missing). Problems with individual rows are
 * written to the report and the run continues.
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { Candidate, CandidateData, CandidatePhoto } from '../../src/data/candidateTypes';
import {
  IMAGES_FOLDER_ID,
  LISTING_TAB,
  OUTPUT_JSON,
  OUTPUT_PHOTOS_DIR,
  OUTPUT_REPORT,
  PROFILES_TAB,
  REPO_ROOT,
  SHEET_ID,
} from './config';
import { IssueLog } from './lib/issues';
import { syncPhotos } from './lib/photos';
import { renderReport } from './lib/report';
import { fetchSheetTab } from './lib/sheets';
import { transform } from './lib/transform';

interface CliOptions {
  check: boolean;
  photos: boolean;
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const startedAt = new Date();
  const log = new IssueLog();

  // 1. Fetch -----------------------------------------------------------------
  console.log(`Fetching "${LISTING_TAB}" and "${PROFILES_TAB}"…`);
  const [listing, profiles] = await Promise.all([
    fetchSheetTab(SHEET_ID, LISTING_TAB),
    fetchSheetTab(SHEET_ID, PROFILES_TAB),
  ]);

  // 2. Transform -------------------------------------------------------------
  const result = transform(listing, profiles, log);
  const previous = await readPreviousOutput();

  // 3. Photos ----------------------------------------------------------------
  const previousPhotos = new Map<string, CandidatePhoto>(
    (previous?.candidates ?? []).flatMap((c) => (c.photo ? [[c.id, c.photo]] : [])),
  );
  let photos = previousPhotos;
  let photosChanged = false;
  if (options.photos) {
    console.log('Syncing photos…');
    const sync = await syncPhotos(IMAGES_FOLDER_ID, result.candidates, log, {
      previous: previousPhotos,
      dryRun: options.check,
    });
    photos = sync.photos;
    photosChanged = sync.changed;
    console.log(
      `  ${sync.fetched} processed, ${sync.skipped} unchanged, ${sync.removed.length} removed` +
        ` (folder listed via ${sync.listingMethod})`,
    );
  } else {
    console.log('Skipping photos (--no-photos); keeping the ones recorded in the existing JSON.');
  }

  // 4. Assemble --------------------------------------------------------------
  const candidates: Candidate[] = result.candidates.map(({ wantsPhoto: _w, sortName: _s, ...draft }) => {
    const photo = photos.get(draft.id) ?? null;
    return {
      ...draft,
      photo,
      profileComplete: Boolean(draft.website && draft.issues.en.length > 0 && photo),
    };
  });

  const data: CandidateData = {
    generatedAt: startedAt.toISOString(),
    source: { sheetId: SHEET_ID, sheetModified: null },
    election: result.election,
    contests: result.contests,
    candidates,
  };

  const report = renderReport(
    {
      sheetTitle: 'Candidate_Listing_2026',
      sheetUrl: `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit`,
      generatedAt: startedAt,
      candidates: candidates.length,
      contests: result.contests.length,
      completeProfiles: candidates.filter((c) => c.profileComplete).length,
      spanishBlurbs: candidates.filter((c) => c.issues.es.length > 0).length,
      englishBlurbs: candidates.filter((c) => c.issues.en.length > 0).length,
      tallyEnCompleted: result.tallyEnCompleted,
    },
    log,
  );

  // 5. Write (or compare) ----------------------------------------------------
  // Both outputs carry a run timestamp. We ignore it when deciding whether
  // anything changed, and we don't rewrite a file whose only difference is
  // the timestamp — so an ingest that finds nothing new leaves git clean.
  const dataChanged = !previous || !sameIgnoringTimestamp(previous, data);
  const previousReport = await readTextIfExists(OUTPUT_REPORT);
  const reportChanged = previousReport === null || stripGeneratedLine(previousReport) !== stripGeneratedLine(report);

  const changes = [
    dataChanged && path.relative(REPO_ROOT, OUTPUT_JSON),
    photosChanged && `${path.relative(REPO_ROOT, OUTPUT_PHOTOS_DIR)}/`,
    reportChanged && path.relative(REPO_ROOT, OUTPUT_REPORT),
  ].filter((c): c is string => Boolean(c));

  printSummary(data, log);

  if (options.check) {
    if (changes.length > 0) {
      console.log(`\nOut of date: ${changes.join(', ')}. Run \`make ingest\` and commit the result.`);
      process.exit(1);
    }
    console.log('\nCommitted data matches the spreadsheet.');
    return;
  }

  if (dataChanged) {
    await mkdir(path.dirname(OUTPUT_JSON), { recursive: true });
    await writeFile(OUTPUT_JSON, JSON.stringify(data, null, 2) + '\n');
  }
  if (reportChanged) await writeFile(OUTPUT_REPORT, report);

  console.log(changes.length > 0 ? `\nUpdated: ${changes.join(', ')}.` : '\nNothing changed since the last ingest.');
  if (log.errors.length > 0) {
    console.log(`See ${path.relative(REPO_ROOT, OUTPUT_REPORT)} — some rows need attention from the editorial team.`);
  }
}

/** The report's "Generated …" line changes every run; drop it before comparing. */
function stripGeneratedLine(report: string): string {
  return report.replace(/^Generated .*$/m, '');
}

// ---------------------------------------------------------------------------

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = { check: false, photos: true };
  for (const arg of argv) {
    if (arg === '--check') options.check = true;
    else if (arg === '--no-photos') options.photos = false;
    else if (arg === '--help' || arg === '-h') {
      console.log('Usage: npm run ingest [-- --check] [-- --no-photos]');
      process.exit(0);
    } else {
      console.error(`Unknown option: ${arg}`);
      process.exit(2);
    }
  }
  return options;
}

async function readPreviousOutput(): Promise<CandidateData | null> {
  const text = await readTextIfExists(OUTPUT_JSON);
  if (text === null) return null;
  try {
    return JSON.parse(text) as CandidateData;
  } catch {
    console.warn(`Existing ${OUTPUT_JSON} is not valid JSON; treating this as a first run.`);
    return null;
  }
}

async function readTextIfExists(filePath: string): Promise<string | null> {
  try {
    return await readFile(filePath, 'utf8');
  } catch {
    return null;
  }
}

/** Two outputs are "the same" if everything but the run timestamp matches. */
function sameIgnoringTimestamp(a: CandidateData, b: CandidateData): boolean {
  const strip = ({ generatedAt: _g, ...rest }: CandidateData) => JSON.stringify(rest);
  return strip(a) === strip(b);
}

function printSummary(data: CandidateData, log: IssueLog): void {
  const complete = data.candidates.filter((c) => c.profileComplete).length;
  console.log(
    `\n${data.candidates.length} candidates in ${data.contests.length} contests for ${data.election.date}; ` +
      `${complete} complete profiles; ${log.errors.length} error(s), ${log.warnings.length} warning(s).`,
  );
}

main().catch((err) => {
  console.error(`\nIngest failed: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
