import type { I18nText } from '../i18n/utils';

/**
 * Candidate content, grouped by the jurisdiction shown in the "All Candidates"
 * dropdown. Editing this file is all it takes to add a race or a candidate —
 * the pages are generated from it.
 */

export type Party = 'D' | 'R' | 'L' | 'G' | 'U' | 'NP';

export interface Candidate {
  name: string;
  party: Party;
  /** Shown in the colored badge over the photo. Omit for at-large / citywide seats. */
  district?: string;
  /** Short issue bullets under the name. */
  issues: I18nText[];
  /** Path under `public/`. Leave unset to render the placeholder tile. */
  photo?: string;
}

export interface Race {
  slug: string;
  title: I18nText;
  candidates: Candidate[];
}

export interface Jurisdiction {
  slug: string;
  /** Label in the "All Candidates" dropdown. */
  navLabel: I18nText;
  title: I18nText;
  subtitle: I18nText;
  races: Race[];
}

/** A card with no candidate yet — renders as a "to be announced" placeholder. */
const tbd = (district?: string): Candidate => ({
  name: '',
  party: 'NP',
  district,
  issues: [],
});

export const jurisdictions: Jurisdiction[] = [
  {
    slug: 'united-states',
    navLabel: { en: 'United States', es: 'Estados Unidos' },
    title: { en: 'United States', es: 'Estados Unidos' },
    subtitle: {
      en: 'View all of your candidates for federal office in the 2026 elections.',
      es: 'Consulta todos tus candidatos a cargos federales en las elecciones de 2026.',
    },
    races: [
      {
        slug: 'us-senate',
        title: { en: 'U.S. Senate', es: 'Senado de EE. UU.' },
        candidates: [tbd(), tbd()],
      },
      {
        slug: 'us-house',
        title: { en: 'U.S. House', es: 'Cámara de Representantes de EE. UU.' },
        candidates: [tbd('District 12'), tbd('District 12'), tbd('District 14')],
      },
    ],
  },
  {
    slug: 'north-carolina',
    navLabel: { en: 'North Carolina', es: 'Carolina del Norte' },
    title: { en: 'North Carolina', es: 'Carolina del Norte' },
    subtitle: {
      en: 'View all of your candidates for the NC legislature and judiciary in the 2026 elections.',
      es: 'Consulta todos tus candidatos a la legislatura y al poder judicial de Carolina del Norte en las elecciones de 2026.',
    },
    races: [
      {
        slug: 'nc-senate',
        title: { en: 'NC Senate', es: 'Senado de NC' },
        candidates: [
          {
            name: 'Raygan Angel',
            party: 'D',
            district: '37',
            issues: [
              { en: 'Fixing rigged maps', es: 'Corregir los mapas manipulados' },
              { en: 'Funding public schools', es: 'Financiar las escuelas públicas' },
              { en: 'Affordable healthcare', es: 'Atención médica asequible' },
            ],
          },
          {
            name: 'Vickie Sawyer',
            party: 'R',
            district: '37',
            issues: [
              { en: 'Improving transportation', es: 'Mejorar el transporte' },
              { en: 'Protecting schools and families', es: 'Proteger las escuelas y las familias' },
            ],
          },
          {
            name: 'Mujtaba Mohammed',
            party: 'D',
            district: '38',
            issues: [
              { en: 'Ensuring quality education', es: 'Garantizar una educación de calidad' },
              { en: 'Building a stronger economy', es: 'Construir una economía más fuerte' },
              { en: 'Creating equitable policies', es: 'Crear políticas equitativas' },
            ],
          },
          tbd('38'),
          tbd('39'),
        ],
      },
      {
        slug: 'nc-house',
        title: { en: 'NC House', es: 'Cámara de NC' },
        candidates: [tbd('88'), tbd('88'), tbd('92')],
      },
      {
        slug: 'nc-judiciary',
        title: { en: 'NC Judiciary', es: 'Poder Judicial de NC' },
        candidates: [tbd(), tbd()],
      },
    ],
  },
  {
    slug: 'mecklenburg-county',
    navLabel: { en: 'Mecklenburg County', es: 'Condado de Mecklenburg' },
    title: { en: 'Mecklenburg County', es: 'Condado de Mecklenburg' },
    subtitle: {
      en: 'View all of your candidates for county office in the 2026 elections.',
      es: 'Consulta todos tus candidatos a cargos del condado en las elecciones de 2026.',
    },
    races: [
      {
        slug: 'board-of-commissioners',
        title: { en: 'Board of Commissioners', es: 'Junta de Comisionados' },
        candidates: [tbd('1'), tbd('2'), tbd('3')],
      },
      {
        slug: 'sheriff',
        title: { en: 'Sheriff', es: 'Alguacil' },
        candidates: [tbd(), tbd()],
      },
    ],
  },
  {
    slug: 'city-of-charlotte',
    navLabel: { en: 'City of Charlotte', es: 'Ciudad de Charlotte' },
    title: { en: 'City of Charlotte', es: 'Ciudad de Charlotte' },
    subtitle: {
      en: 'View all of your candidates for city office in the 2026 elections.',
      es: 'Consulta todos tus candidatos a cargos municipales en las elecciones de 2026.',
    },
    races: [
      {
        slug: 'mayor',
        title: { en: 'Mayor', es: 'Alcalde' },
        candidates: [tbd(), tbd()],
      },
      {
        slug: 'city-council',
        title: { en: 'City Council', es: 'Concejo Municipal' },
        candidates: [tbd('1'), tbd('2'), tbd('3'), tbd('4')],
      },
    ],
  },
];

export function getJurisdiction(slug: string): Jurisdiction | undefined {
  return jurisdictions.find((j) => j.slug === slug);
}
