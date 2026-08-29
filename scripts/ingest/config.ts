/**
 * config.ts
 *
 * Every external identifier and output path the ingest depends on, in one
 * place. If the editorial team moves the spreadsheet or renames a tab, this is
 * the only file that should need to change.
 */

import { fileURLToPath } from 'node:url';
import path from 'node:path';

/** Absolute path of the repository root (this file lives in scripts/ingest/). */
export const REPO_ROOT = path.resolve(fileURLToPath(import.meta.url), '../../..');

/** The editorial spreadsheet `Candidate_Listing_2026`. */
export const SHEET_ID = '10-ZfK0aqOk7VS9HlCoDO2LP1tnxn1y8rYQmHLTeNy0I';

/** Tab names inside that spreadsheet. */
export const LISTING_TAB = 'Mecklenburg 11/03/26';
export const PROFILES_TAB = 'Candidate Profiles';

/** The Drive folder holding candidate headshots named `<ID>.<ext>`. */
export const IMAGES_FOLDER_ID = '1X2o9tLDjNxqBQAMDlxc7nVjMHqJyMAfI';

/** Where the generated data lands (relative to the repo root). */
export const OUTPUT_JSON = path.join(REPO_ROOT, 'src/data/generated/candidates.json');
export const OUTPUT_PHOTOS_DIR = path.join(REPO_ROOT, 'public/candidates');
export const OUTPUT_REPORT = path.join(REPO_ROOT, 'data_quality_issues.md');

/** URL prefix the site uses for the photos (mirrors OUTPUT_PHOTOS_DIR under public/). */
export const PHOTO_URL_PREFIX = '/candidates';

/**
 * Photo normalization. The candidate card renders its photo at a 4:5 aspect
 * ratio (see CandidateCard.astro), so every source image is cropped to fit and
 * resized to this box.
 */
export const PHOTO = {
  width: 480,
  height: 600,
  jpegQuality: 80,
} as const;

/**
 * Blurb conventions from the editorial team's notes: three lines, one
 * priority per line; judicial candidates may instead have a single personal
 * statement. Lines much longer than this wrap awkwardly on the card.
 */
export const BLURB = {
  expectedLines: 3,
  maxLineLength: 40,
  maxStatementLength: 160,
} as const;

/** Party codes we know how to display. Anything else is reported. */
export const KNOWN_PARTIES = ['DEM', 'REP', 'LIB', 'GRE', 'CST', 'JFA', 'WTP', 'UNA', 'NP'] as const;
