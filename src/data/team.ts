import type { I18nText } from '../i18n/utils';
import {
  meckBoePhone,
  meckBoeUpcomingElectionsUrl,
  meckBoeUrl,
  ncEarlyVotingUrl,
  ncFreeVoterIdUrl,
  ncSameDayRegistrationUrl,
  ncVoterIdUrl,
  ncVoterSearchUrl,
} from './links';

export interface TeamMember {
  name: string;
  role: I18nText;
  /** Path under `public/`. Leave unset to render the placeholder avatar. */
  photo?: string;
}

export const team: TeamMember[] = [
  {
    name: 'Team Member One',
    role: { en: 'Role placeholder', es: 'Función pendiente' },
  },
  {
    name: 'Team Member Two',
    role: { en: 'Role placeholder', es: 'Función pendiente' },
  },
  {
    name: 'Team Member Three',
    role: { en: 'Role placeholder', es: 'Función pendiente' },
  },
];

/**
 * FAQ entries. Answers are **Markdown** — paragraphs, links, lists — rendered
 * to HTML at build time by `src/lib/markdown.ts`. Keep them short; a link to
 * the official source beats restating it.
 */
export const faqs: { question: I18nText; answer: I18nText }[] = [
  {
    question: {
      en: 'Am I registered to vote?',
      es: '¿Estoy registrado para votar?',
    },
    answer: {
      en: `Check in about a minute on the NC State Board of Elections’ official [Voter Search](${ncVoterSearchUrl}): enter your first and last name (adding your birth year or “Mecklenburg” narrows the results). It shows whether you’re registered, your party, your polling place, and your districts.

If you don’t find yourself, or something looks wrong, contact the [Mecklenburg County Board of Elections](${meckBoeUrl}) at ${meckBoePhone}.`,
      es: `Verifícalo en un minuto en la [Búsqueda de Votantes](${ncVoterSearchUrl}) oficial de la Junta Estatal de Elecciones de Carolina del Norte (la herramienta está en inglés): escribe tu nombre y apellido (agregar tu año de nacimiento o “Mecklenburg” reduce los resultados). Muestra si estás registrado, tu partido, tu lugar de votación y tus distritos.

Si no apareces o algo no coincide, comunícate con la [Junta Electoral del Condado de Mecklenburg](${meckBoeUrl}) al ${meckBoePhone}.`,
    },
  },
  {
    question: {
      en: 'Where do I vote?',
      es: '¿Dónde voto?',
    },
    answer: {
      en: `**On Election Day**, your polling place depends on your address. Look it up on the NC State Board of Elections’ official [Voter Search](${ncVoterSearchUrl}).

**During early voting** (Thursday, October 15 through 3 p.m. Saturday, October 31), you can vote at [any early voting site in your county](${ncEarlyVotingUrl}). The [Mecklenburg County Board of Elections](${meckBoeUpcomingElectionsUrl}) lists every site with its address and hours.`,
      es: `**El día de las elecciones**, tu lugar de votación depende de tu dirección. Búscalo en la [Búsqueda de Votantes](${ncVoterSearchUrl}) oficial de la Junta Estatal de Elecciones de Carolina del Norte (la herramienta está en inglés).

**Durante la votación anticipada** (del jueves 15 de octubre hasta las 3 p. m. del sábado 31 de octubre), puedes votar en [cualquier sitio de votación anticipada de tu condado](${ncEarlyVotingUrl}) (en inglés). La [Junta Electoral del Condado de Mecklenburg](${meckBoeUpcomingElectionsUrl}) publica la lista de sitios con sus direcciones y horarios (en inglés).`,
    },
  },
  {
    question: {
      en: 'What do I need to bring with me?',
      es: '¿Qué necesito llevar conmigo?',
    },
    answer: {
      en: `**Bring a photo ID.** North Carolina voters are asked to show one when they check in, whether early or on Election Day. Most people use a driver’s license; a U.S. passport, a state ID from the NCDMV, a military or veterans ID, and approved student or government-employee IDs also work, among others. See the full list, including how expired IDs are treated, on the NC State Board of Elections’ [Voter ID page](${ncVoterIdUrl}).

**No ID? You can still vote.** You can fill out an ID Exception Form and vote a provisional ballot, or, if you just forgot your ID, bring it to the county elections office by noon on the fifth business day after Election Day ([details](${ncVoterIdUrl})). Registered voters can also get a [free voter photo ID](${ncFreeVoterIdUrl}) from the [Mecklenburg County Board of Elections](${meckBoeUrl}); no documents are needed.

**Registering during early voting?** Same-day registration requires proof of where you live, such as a North Carolina driver’s license, or a current utility bill, bank statement, paycheck, or government document with your name and address ([full list](${ncSameDayRegistrationUrl})).`,
      es: `**Lleva una identificación con foto.** En Carolina del Norte se pide mostrarla al registrarte para votar, ya sea en la votación anticipada o el día de las elecciones. La mayoría usa su licencia de conducir; también sirven, entre otras, el pasaporte estadounidense, la identificación estatal del NCDMV, la identificación militar o de veterano y ciertas identificaciones de estudiante o de empleado público aprobadas. Consulta la lista completa, incluidas las reglas para identificaciones vencidas, en la [página de identificación de votantes](${ncVoterIdUrl}) de la Junta Estatal de Elecciones de Carolina del Norte (en inglés).

**¿No tienes identificación? Aun así puedes votar.** Puedes llenar un formulario de excepción de identificación y emitir una boleta provisional o, si solo la olvidaste, llevarla a la oficina electoral del condado antes del mediodía del quinto día hábil después de las elecciones ([detalles](${ncVoterIdUrl}), en inglés). Los votantes registrados también pueden obtener una [identificación de votante con foto gratuita](${ncFreeVoterIdUrl}) (en inglés) en la [Junta Electoral del Condado de Mecklenburg](${meckBoeUrl}); no se necesitan documentos.

**¿Te vas a registrar durante la votación anticipada?** El registro el mismo día requiere un comprobante de domicilio, como una licencia de conducir de Carolina del Norte, o una factura de servicios, estado de cuenta bancario, talón de pago o documento del gobierno reciente con tu nombre y dirección ([lista completa](${ncSameDayRegistrationUrl}), en inglés).`,
    },
  },
];
