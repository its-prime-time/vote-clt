import type { I18nText } from '../i18n/utils';
import type { JurisdictionSlug } from './candidateTypes';

/**
 * The four entries in the "All Candidates" dropdown, in the order they appear.
 *
 * Only the page chrome lives here. The contests and candidates for each
 * jurisdiction come from the editorial spreadsheet via `make ingest` — see
 * `src/data/candidates.ts` and `src/data/generated/candidates.json`.
 */

export interface Jurisdiction {
  slug: JurisdictionSlug;
  /** Label in the "All Candidates" dropdown. */
  navLabel: I18nText;
  title: I18nText;
  subtitle: I18nText;
  /** Shown instead of the candidate grid when the ballot has no contests here. */
  emptyNote?: I18nText;
}

export const jurisdictions: Jurisdiction[] = [
  {
    slug: 'united-states',
    navLabel: { en: 'United States', es: 'Estados Unidos' },
    title: { en: 'United States', es: 'Estados Unidos' },
    subtitle: {
      en: 'View all of your candidates for federal office in the 2026 elections.',
      es: 'Consulta todos tus candidatos a cargos federales en las elecciones de 2026.',
    },
  },
  {
    slug: 'north-carolina',
    navLabel: { en: 'North Carolina', es: 'Carolina del Norte' },
    title: { en: 'North Carolina', es: 'Carolina del Norte' },
    subtitle: {
      en: 'View all of your candidates for the NC legislature and judiciary in the 2026 elections.',
      es: 'Consulta todos tus candidatos a la legislatura y al poder judicial de Carolina del Norte en las elecciones de 2026.',
    },
  },
  {
    slug: 'mecklenburg-county',
    navLabel: { en: 'Mecklenburg County', es: 'Condado de Mecklenburg' },
    title: { en: 'Mecklenburg County', es: 'Condado de Mecklenburg' },
    subtitle: {
      en: 'View all of your candidates for county office in the 2026 elections.',
      es: 'Consulta todos tus candidatos a cargos del condado en las elecciones de 2026.',
    },
  },
  {
    slug: 'city-of-charlotte',
    navLabel: { en: 'City of Charlotte', es: 'Ciudad de Charlotte' },
    title: { en: 'City of Charlotte', es: 'Ciudad de Charlotte' },
    subtitle: {
      en: 'View all of your candidates for city office in the 2026 elections.',
      es: 'Consulta todos tus candidatos a cargos municipales en las elecciones de 2026.',
    },
    // Charlotte holds its municipal elections in odd-numbered years.
    emptyNote: {
      en: 'There are no City of Charlotte contests on the November 3, 2026 ballot. The next city election is in 2027.',
      es: 'No hay contiendas de la Ciudad de Charlotte en la boleta del 3 de noviembre de 2026. La próxima elección municipal es en 2027.',
    },
  },
];

export function getJurisdiction(slug: string): Jurisdiction | undefined {
  return jurisdictions.find((j) => j.slug === slug);
}
