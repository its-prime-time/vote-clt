import type { I18nText } from '../i18n/utils';
import {
  meckBoeUpcomingElectionsUrl,
  ncReferendums2026Url,
  ncStatewideReferendums2026Url,
  ncVoterSearchUrl,
} from './links';

/** Upcoming elections and their certified ballot initiatives. */

export interface BallotInitiative {
  type: I18nText;
  title: I18nText;
  subject: I18nText;
  description: I18nText;
  /**
   * Who gets this question on their ballot, when it isn't every voter in the
   * county — e.g. "City of Charlotte residents only". Shown under the title.
   * Leave unset for statewide / countywide questions.
   */
  votersNote?: I18nText;
  /**
   * The initiative exactly as printed on the ballot, shown under "Full Text".
   * Copy it word for word from the NCSBE referendum list (see `sourceUrl`).
   */
  ballot: {
    /** Contest heading, e.g. "CONSTITUTIONAL AMENDMENT - …". */
    heading: I18nText;
    /** The ballot wording, one entry per paragraph. */
    text: I18nText[];
    /**
     * The two choices printed under the question. Constitutional amendments
     * use For / Against; local bond referenda use Yes / No. The labels
     * themselves live in `src/i18n/ui.ts`.
     */
    choices: 'forAgainst' | 'yesNo';
    /** The official document the wording was copied from. */
    sourceUrl: string;
  };
}

export interface Election {
  /** Stable id, used for the disclosure element's anchor. */
  id: string;
  /** Heading text. Free-form so an undated election can read "TBD". */
  date: I18nText;
  /**
   * One short paragraph under the date. **Markdown** (so it can carry links),
   * rendered at build time by `src/lib/markdown.ts`, like the FAQ answers.
   */
  summary: I18nText;
  initiatives: BallotInitiative[];
}

const constitutionalAmendment: I18nText = {
  en: 'Constitutional Amendment',
  es: 'Enmienda Constitucional',
};

const bondReferendum: I18nText = {
  en: 'Bond Referendum',
  es: 'Referéndum de Bonos',
};

const charlotteVotersOnly: I18nText = {
  en: 'On the ballot for City of Charlotte residents only.',
  es: 'Solo aparece en la boleta de los residentes de la ciudad de Charlotte.',
};

/**
 * Every City of Charlotte bond question on the 2026 ballot follows the same
 * legally required template; only the dollar amounts and the purpose differ.
 * This builds the ballot paragraphs from those pieces so the boilerplate is
 * typed once. The English output must match the NCSBE referendum list word
 * for word — if the city changes the template, update it here.
 */
function charlotteBondBallotText(bond: {
  /** Principal, as printed: "$280,000,000". */
  principal: string;
  /** Interest, as printed: "$157,113,600". */
  interest: string;
  /** Principal plus interest, as printed: "$437,113,600". */
  cumulativeCost: string;
  /** Estimated yearly tax increase per $100,000 of value, as printed: "$0.00". */
  taxPer100k: string;
  /** What the money pays for — the text after "capital costs of". */
  purpose: I18nText;
}): I18nText[] {
  return [
    {
      en: 'Additional property taxes may be levied on property located in the City of Charlotte in an amount sufficient to pay the principal of and interest on bonds if approved by the following ballot question.',
      es: 'Se podrán cobrar impuestos adicionales a la propiedad ubicada en la ciudad de Charlotte en una cantidad suficiente para pagar el capital y los intereses de los bonos si se aprueba la siguiente pregunta de la boleta.',
    },
    {
      en: `Shall the order authorizing ${bond.principal} of bonds plus interest to provide funds to pay the capital costs of ${bond.purpose.en}, and providing that additional taxes may be levied in an amount sufficient to pay the principal of and interest on the bonds be approved, in light of the following:`,
      es: `¿Se aprueba la orden que autoriza ${bond.principal} en bonos más intereses para proporcionar fondos para pagar los costos de capital de ${bond.purpose.es}, y que dispone que se podrán cobrar impuestos adicionales en una cantidad suficiente para pagar el capital y los intereses de los bonos, en vista de lo siguiente?`,
    },
    {
      en: `(1) The estimated cumulative cost over the life of the bond, using the highest interest rate charged for similar debt over the last 20 years, would be ${bond.cumulativeCost} (consisting of ${bond.principal} principal amount of bonds plus ${bond.interest} of interest).`,
      es: `(1) El costo acumulado estimado durante la vida del bono, usando la tasa de interés más alta cobrada por deudas similares en los últimos 20 años, sería de ${bond.cumulativeCost} (que consiste en ${bond.principal} de capital de los bonos más ${bond.interest} de intereses).`,
    },
    {
      en: `(2) The estimated amount of property tax liability increase for each one hundred thousand dollars ($100,000) of property tax value to service the cumulative cost over the life of the bond provided above would be ${bond.taxPer100k} per year.`,
      es: `(2) El aumento estimado del impuesto a la propiedad por cada cien mil dólares ($100,000) de valor tributario de la propiedad para cubrir el costo acumulado durante la vida del bono indicado arriba sería de ${bond.taxPer100k} por año.`,
    },
  ];
}

export const elections: Election[] = [
  {
    id: '2026-11-03',
    date: { en: 'Nov. 3, 2026', es: '3 de nov. de 2026' },
    summary: {
      en: `Includes federal, state, county, and city elections. In-person early voting begins October 15 and runs through October 31. The [Mecklenburg County Board of Elections](${meckBoeUpcomingElectionsUrl}) lists every site with its address and hours.`,
      es: `Incluye elecciones federales, estatales, del condado y de la ciudad. La votación anticipada en persona comienza el 15 de octubre y termina el 31 de octubre. La [Junta Electoral del Condado de Mecklenburg](${meckBoeUpcomingElectionsUrl}) publica la lista de sitios con sus direcciones y horarios (en inglés).`,
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
        ballot: {
          heading: {
            en: 'CONSTITUTIONAL AMENDMENT - PROPERTY TAX LEVY LIMIT',
            es: 'ENMIENDA CONSTITUCIONAL - LÍMITE A LA RECAUDACIÓN DEL IMPUESTO A LA PROPIEDAD',
          },
          text: [
            {
              en: 'Constitutional amendment requiring limits on property tax increases by local governments.',
              es: 'Enmienda constitucional que exige límites a los aumentos del impuesto a la propiedad por parte de los gobiernos locales.',
            },
          ],
          choices: 'forAgainst',
          sourceUrl: ncStatewideReferendums2026Url,
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
        ballot: {
          heading: {
            en: 'CONSTITUTIONAL AMENDMENT - MAXIMUM INCOME TAX RATE OF 3.5%',
            es: 'ENMIENDA CONSTITUCIONAL - TASA MÁXIMA DEL IMPUESTO SOBRE LA RENTA DEL 3,5 %',
          },
          text: [
            {
              en: 'Constitutional amendment to keep the State income tax rate from being raised higher than three and one-half percent (3.5%).',
              es: 'Enmienda constitucional para impedir que la tasa estatal del impuesto sobre la renta se eleve por encima del tres y medio por ciento (3,5 %).',
            },
          ],
          choices: 'forAgainst',
          sourceUrl: ncStatewideReferendums2026Url,
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
        ballot: {
          heading: {
            en: 'CONSTITUTIONAL AMENDMENT - REQUIRE PHOTO ID FOR VOTING',
            es: 'ENMIENDA CONSTITUCIONAL - EXIGIR IDENTIFICACIÓN CON FOTO PARA VOTAR',
          },
          text: [
            {
              en: 'Constitutional amendment to require all voters, not just those presenting to vote in person, to present photo identification before voting.',
              es: 'Enmienda constitucional para exigir que todos los votantes, no solo quienes se presentan a votar en persona, presenten una identificación con fotografía antes de votar.',
            },
          ],
          choices: 'forAgainst',
          sourceUrl: ncStatewideReferendums2026Url,
        },
      },
      {
        type: bondReferendum,
        title: {
          en: 'City of Charlotte Transportation Bonds',
          es: 'Bonos de Transporte de la Ciudad de Charlotte',
        },
        subject: { en: 'Transportation', es: 'Transporte' },
        description: {
          en: 'Authorize the City of Charlotte to issue $280 million in bonds for streets, sidewalks, bike and pedestrian paths, bridges, storm drainage, and related improvements.',
          es: 'Autorizar a la ciudad de Charlotte a emitir $280 millones en bonos para calles, aceras, senderos para bicicletas y peatones, puentes, drenaje pluvial y mejoras relacionadas.',
        },
        votersNote: charlotteVotersOnly,
        ballot: {
          heading: {
            en: 'CITY OF CHARLOTTE TRANSPORTATION BONDS REFERENDUM',
            es: 'REFERÉNDUM DE BONOS DE TRANSPORTE DE LA CIUDAD DE CHARLOTTE',
          },
          text: charlotteBondBallotText({
            principal: '$280,000,000',
            interest: '$157,113,600',
            cumulativeCost: '$437,113,600',
            taxPer100k: '$0.00',
            purpose: {
              en: 'constructing, reconstructing, enlarging, extending and improving certain streets, including streets and roads constituting a part of the State highway system or otherwise the responsibility of the State and including the cost of related studies, streetscape and pedestrian improvements, relocation of utilities, plans and design; acquiring, constructing, reconstructing, widening, extending, paving, milling, resurfacing, grading or improving streets, roads, intersections, parking lots and pedestrian and bicycle paths; acquiring, constructing, reconstructing or improving sidewalks, curbs, gutters, storm drainage, bridges, overpasses, underpasses and grade crossings and providing related landscaping, lighting and traffic controls, signals and markers; and the acquisition of interests in land and rights-of-way required therefor',
              es: 'construir, reconstruir, ampliar, extender y mejorar ciertas calles, incluidas calles y carreteras que forman parte del sistema estatal de carreteras o que de otro modo son responsabilidad del Estado, e incluido el costo de estudios relacionados, mejoras del paisaje urbano y peatonales, reubicación de servicios públicos, planos y diseño; adquirir, construir, reconstruir, ensanchar, extender, pavimentar, fresar, repavimentar, nivelar o mejorar calles, carreteras, intersecciones, estacionamientos y senderos para peatones y bicicletas; adquirir, construir, reconstruir o mejorar aceras, bordillos, cunetas, drenaje pluvial, puentes, pasos elevados, pasos a desnivel y cruces a nivel, y proporcionar jardinería, iluminación y controles, semáforos y señales de tráfico relacionados; y la adquisición de derechos sobre terrenos y derechos de paso necesarios para ello',
            },
          }),
          choices: 'yesNo',
          sourceUrl: ncReferendums2026Url,
        },
      },
      {
        type: bondReferendum,
        title: {
          en: 'City of Charlotte Housing Bonds',
          es: 'Bonos de Vivienda de la Ciudad de Charlotte',
        },
        subject: { en: 'Housing', es: 'Vivienda' },
        description: {
          en: 'Authorize the City of Charlotte to issue $125 million in bonds for housing projects for people with low or moderate incomes.',
          es: 'Autorizar a la ciudad de Charlotte a emitir $125 millones en bonos para proyectos de vivienda para personas de ingresos bajos o moderados.',
        },
        votersNote: charlotteVotersOnly,
        ballot: {
          heading: {
            en: 'CITY OF CHARLOTTE HOUSING BONDS REFERENDUM',
            es: 'REFERÉNDUM DE BONOS DE VIVIENDA DE LA CIUDAD DE CHARLOTTE',
          },
          text: charlotteBondBallotText({
            principal: '$125,000,000',
            interest: '$73,396,312.50',
            cumulativeCost: '$198,396,312.50',
            taxPer100k: '$0.00',
            purpose: {
              en: 'housing projects for the benefit of persons of low income, or moderate income, or low and moderate income, including construction of infrastructure improvements related thereto and the acquisition of land and rights-of-way required therefor',
              es: 'proyectos de vivienda en beneficio de personas de ingresos bajos, o de ingresos moderados, o de ingresos bajos y moderados, incluida la construcción de mejoras de infraestructura relacionadas y la adquisición de terrenos y derechos de paso necesarios para ello',
            },
          }),
          choices: 'yesNo',
          sourceUrl: ncReferendums2026Url,
        },
      },
      {
        type: bondReferendum,
        title: {
          en: 'City of Charlotte Neighborhood Improvement Bonds',
          es: 'Bonos de Mejoras de Vecindarios de la Ciudad de Charlotte',
        },
        subject: { en: 'Neighborhood infrastructure', es: 'Infraestructura de vecindarios' },
        description: {
          en: 'Authorize the City of Charlotte to issue $20 million in bonds for neighborhood infrastructure such as sidewalks, storm drainage, street repairs, lighting, and public open space.',
          es: 'Autorizar a la ciudad de Charlotte a emitir $20 millones en bonos para infraestructura de vecindarios, como aceras, drenaje pluvial, reparación de calles, iluminación y espacios públicos abiertos.',
        },
        votersNote: charlotteVotersOnly,
        ballot: {
          heading: {
            en: 'CITY OF CHARLOTTE NEIGHBORHOOD IMPROVEMENT BONDS REFERENDUM',
            es: 'REFERÉNDUM DE BONOS DE MEJORAS DE VECINDARIOS DE LA CIUDAD DE CHARLOTTE',
          },
          text: charlotteBondBallotText({
            principal: '$20,000,000',
            interest: '$11,222,400',
            cumulativeCost: '$31,222,400',
            taxPer100k: '$0.00',
            purpose: {
              en: 'infrastructure improvements for various neighborhoods of the City, including the cost of related studies, plans and design, acquiring, constructing, reconstructing, improving, installing or providing curbs, gutters, storm drainage, sidewalks, pedestrian and bicycle paths, and relocation of utilities; paving, milling, resurfacing, grading or improving streets, roads and intersections, providing public open space, landscaping, lighting and traffic controls, signals and markers, and acquiring any necessary equipment, land, interests in land and rights-of-way therefor',
              es: 'mejoras de infraestructura para varios vecindarios de la ciudad, incluido el costo de estudios, planos y diseño relacionados; adquirir, construir, reconstruir, mejorar, instalar o proporcionar bordillos, cunetas, drenaje pluvial, aceras, senderos para peatones y bicicletas, y la reubicación de servicios públicos; pavimentar, fresar, repavimentar, nivelar o mejorar calles, carreteras e intersecciones; proporcionar espacios públicos abiertos, jardinería, iluminación y controles, semáforos y señales de tráfico; y adquirir el equipo, los terrenos, los derechos sobre terrenos y los derechos de paso necesarios para ello',
            },
          }),
          choices: 'yesNo',
          sourceUrl: ncReferendums2026Url,
        },
      },
    ],
  },
];

/** Where the "find your polling location" link points: the NCSBE Voter Search. */
export const pollingLocationUrl = ncVoterSearchUrl;
