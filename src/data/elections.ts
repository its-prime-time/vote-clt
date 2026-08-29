import type { I18nText } from '../i18n/utils';
import { ncVoterSearchUrl } from './links';

/** Upcoming elections and their certified ballot initiatives. */

export interface BallotInitiative {
  type: I18nText;
  title: I18nText;
  subject: I18nText;
  description: I18nText;
}

export interface Election {
  /** Stable id, used for the disclosure element's anchor. */
  id: string;
  /** Heading text. Free-form so an undated election can read "TBD". */
  date: I18nText;
  summary: I18nText;
  initiatives: BallotInitiative[];
}

const constitutionalAmendment: I18nText = {
  en: 'Constitutional Amendment',
  es: 'Enmienda Constitucional',
};

export const elections: Election[] = [
  {
    id: '2026-11-03',
    date: { en: 'Nov. 3, 2026', es: '3 de nov. de 2026' },
    summary: {
      en: 'Includes federal, state, county, and city elections.',
      es: 'Incluye elecciones federales, estatales, del condado y de la ciudad.',
    },
    initiatives: [
      {
        type: constitutionalAmendment,
        title: {
          en: 'Property Tax Levy Limit Amendment',
          es: 'Enmienda sobre el Límite del Impuesto a la Propiedad',
        },
        subject: { en: 'Property taxes', es: 'Impuestos a la propiedad' },
        description: {
          en: 'Require the state legislature to pass laws limiting the amount that property taxes may increase.',
          es: 'Exigir que la legislatura estatal apruebe leyes que limiten cuánto pueden aumentar los impuestos a la propiedad.',
        },
      },
      {
        type: constitutionalAmendment,
        title: {
          en: 'Reduce Income Tax Rate Cap from 7% to 3.5% Amendment',
          es: 'Enmienda para Reducir el Tope del Impuesto sobre la Renta del 7 % al 3,5 %',
        },
        subject: { en: 'Income taxes', es: 'Impuestos sobre la renta' },
        description: {
          en: 'Reduce the maximum allowable income tax rate from 7% to 3.5%.',
          es: 'Reducir la tasa máxima permitida del impuesto sobre la renta del 7 % al 3,5 %.',
        },
      },
      {
        type: constitutionalAmendment,
        title: {
          en: 'Require Voter Identification Amendment',
          es: 'Enmienda para Exigir Identificación del Votante',
        },
        subject: { en: 'Voter ID', es: 'Identificación del votante' },
        description: {
          en: 'Require photographic identification to vote for all voters, not just those voting in person.',
          es: 'Exigir identificación con fotografía para votar a todos los votantes, no solo a quienes votan en persona.',
        },
      },
    ],
  },
  {
    id: 'tbd',
    date: { en: 'TBD', es: 'Por determinar' },
    summary: { en: 'TBD', es: 'Por determinar' },
    initiatives: [],
  },
];

/** Where the "find your polling location" link points: the NCSBE Voter Search. */
export const pollingLocationUrl = ncVoterSearchUrl;
