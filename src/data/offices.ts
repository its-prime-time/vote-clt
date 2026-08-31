/**
 * offices.ts
 *
 * The small amount of office information that CANNOT be derived from the
 * editorial spreadsheet. Everything structural about a contest (office key,
 * district, seat, jurisdiction, ballot matching) is computed by the ingest
 * script from the NCSBE contest name; this file only adds what a human has to
 * decide:
 *
 *   1. how each office is titled in Spanish (editors don't translate office
 *      names, and NCSBE's names are English-only),
 *   2. a shorter English title where the NCSBE name is unwieldy, and
 *   3. the order offices appear on the candidates pages.
 *
 * Keys are the `office` slugs the ingest derives — see the `office` field in
 * `src/data/generated/candidates.json`. An office missing from here still
 * renders: it gets its title-cased NCSBE name in both languages and sorts after
 * the ordered ones. `make ingest` prints a note when that happens so someone
 * can add a line.
 */

import type { BallotMatch, JurisdictionSlug } from './candidateTypes';

export interface OfficeInfo {
  /** Display title per language. */
  title: { en: string; es: string };
  /** Override the jurisdiction the ingest inferred from the contest name. */
  jurisdiction?: JurisdictionSlug;
  /** Override the ballot-match rule the ingest inferred. */
  ballotMatch?: BallotMatch;
}

export const offices: Record<string, OfficeInfo> = {
  // --- Federal ---
  // Titles follow the mockup ("US Senate", "US House of Representatives").
  'us-senate': { title: { en: 'US Senate', es: 'Senado de EE. UU.' } },
  'us-house-of-representatives': {
    title: { en: 'US House of Representatives', es: 'Cámara de Representantes de EE. UU.' },
  },

  // --- State ---
  'nc-state-senate': { title: { en: 'NC Senate', es: 'Senado de NC' } },
  'nc-house-of-representatives': { title: { en: 'NC House', es: 'Cámara de NC' } },
  'nc-supreme-court-associate-justice': {
    title: { en: 'NC Supreme Court Associate Justice', es: 'Juez Asociado de la Corte Suprema de NC' },
  },
  'nc-court-of-appeals-judge': {
    title: { en: 'NC Court of Appeals Judge', es: 'Juez de la Corte de Apelaciones de NC' },
  },

  // --- County ---
  'mecklenburg-county-board-of-commissioners': {
    title: { en: 'Board of County Commissioners', es: 'Junta de Comisionados del Condado' },
  },
  'mecklenburg-county-sheriff': { title: { en: 'Sheriff', es: 'Alguacil' } },
  'district-attorney': { title: { en: 'District Attorney', es: 'Fiscal de Distrito' } },
  'mecklenburg-county-clerk-of-superior-court': {
    title: { en: 'Clerk of Superior Court', es: 'Secretario del Tribunal Superior' },
  },
  // Superior and District Court judges are elected by judicial district (26 =
  // Mecklenburg), so they belong with the county races even though NCSBE
  // prefixes the contest name with "NC".
  'nc-superior-court-judge': {
    title: { en: 'Superior Court Judge', es: 'Juez del Tribunal Superior' },
    jurisdiction: 'mecklenburg-county',
  },
  'nc-district-court-judge': {
    title: { en: 'District Court Judge', es: 'Juez del Tribunal de Distrito' },
    jurisdiction: 'mecklenburg-county',
  },
  'soil-water-conservation-district-supervisor': {
    title: {
      en: 'Soil & Water Conservation District Supervisor',
      es: 'Supervisor del Distrito de Conservación de Suelos y Aguas',
    },
  },

  // --- City (no contests in 2026; kept so odd-year data flows through) ---
  'charlotte-mayor': { title: { en: 'Mayor', es: 'Alcalde' } },
  'charlotte-city-council': { title: { en: 'City Council', es: 'Concejo Municipal' } },
};

/**
 * Display order, following the NC ballot: federal, state legislative, state
 * judicial, county partisan, county judicial, nonpartisan. Offices not listed
 * here sort after these, alphabetically. Reorder freely — nothing else
 * depends on the positions.
 */
export const officeOrder: string[] = [
  'us-senate',
  'us-house-of-representatives',
  'nc-state-senate',
  'nc-house-of-representatives',
  'nc-supreme-court-associate-justice',
  'nc-court-of-appeals-judge',
  // Commissioners first, then Soil & Water — the two most contested county
  // races sit above the long run of unopposed seats.
  'mecklenburg-county-board-of-commissioners',
  'soil-water-conservation-district-supervisor',
  'mecklenburg-county-sheriff',
  'district-attorney',
  'mecklenburg-county-clerk-of-superior-court',
  'nc-superior-court-judge',
  'nc-district-court-judge',
  'charlotte-mayor',
  'charlotte-city-council',
];

/** Sort key for an office: its position in `officeOrder`, or "after everything". */
export function officeRank(office: string): number {
  const index = officeOrder.indexOf(office);
  return index === -1 ? officeOrder.length : index;
}
