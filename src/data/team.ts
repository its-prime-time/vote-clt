import type { I18nText } from '../i18n/utils';
import {
  meckBoePhone,
  ncAbsenteePortalUrl,
  ncAbsenteeRequestFormUrl,
  ncCountyBoeSearchUrl,
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
  /** Role on the team, shown in italics under the name. */
  role: I18nText;
  /**
   * Short first-person bio shown under the photo, in both languages.
   * Optional: leave unset to show just the name and role.
   */
  bio?: I18nText;
  /** Path under `public/`. Leave unset to render the placeholder avatar. */
  photo?: string;
  /**
   * Minor contributor: shown on its own centered row below the main team,
   * with an avatar half the size of everyone else's.
   */
  minor?: boolean;
}

export const team: TeamMember[] = [
  {
    name: 'Hayden Jenkins',
    role: {
      en: 'Project Manager / Web Designer / Information Architect',
      es: 'Gerente de proyecto / Diseñador web / Arquitecto de información',
    },
    photo: '/team/hayden-jenkins.jpg',
    bio: {
      en: "I'm an IB senior at East Meck High and a future political science major. I believe voting is one of the most important political tools to make our voices heard and hold politicians accountable to community needs. So, for my senior project, I want to increase voting accessibility in my home community, Charlotte.",
      es: 'Soy estudiante de último año del programa IB en East Meck High y planeo estudiar ciencias políticas. Creo que votar es una de las herramientas políticas más importantes para hacer oír nuestras voces y exigir a los políticos que respondan a las necesidades de la comunidad. Por eso, para mi proyecto de último año, quiero aumentar el acceso al voto en mi comunidad, Charlotte.',
    },
  },
  {
    name: 'Claire Villavicencio',
    role: { en: 'Spanish Translations', es: 'Traducciones al español' },
    // The Drive original is a round avatar on a square blue backdrop; this
    // copy is cropped to just inside the circle so the round frame hides the
    // backdrop and the face matches Hayden's size.
    photo: '/team/claire-villavicencio.jpg',
    bio: {
      en: "A strong voting rights advocate, I always jump at the chance to increase voter awareness and engagement! Whether driving voters to the polls, registering voters, or being a poll worker, I'm here to help people participate in their fundamental right to vote.",
      es: 'Como firme defensora del derecho al voto, ¡siempre aprovecho cualquier oportunidad para aumentar la conciencia y la participación de los votantes! Ya sea llevando votantes a las urnas, registrando votantes o trabajando en un centro de votación, estoy aquí para ayudar a las personas a ejercer su derecho fundamental al voto.',
    },
  },
  {
    name: 'Andy Jenkins',
    role: { en: 'Code Monkey', es: 'Programador' },
    // Free cartoon from Vecteezy, cropped square around the monkey's face.
    photo: '/team/andy-jenkins.jpg',
    minor: true,
    bio: {
      en: "Eeep eeep! (Translation: I coded Hayden's design. Now go vote!)",
      es: '¡Eeep eeep! (Traducción: programé el diseño de Hayden. ¡Ahora ve a votar!)',
    },
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
      en: 'Why should I vote?',
      es: '¿Por qué debo votar?',
    },
    answer: {
      en: `Voting allows your voice to be heard. While there is a lot more focus on large federal elections, local elections are often the biggest determinants of your day-to-day life. Additionally, the more people that vote, the more politicians are able to be held accountable to their entire community, not just their supporters.`,
      es: `Votar permite que tu voz se escuche. Aunque se presta mucha más atención a las grandes elecciones federales, las elecciones locales suelen ser las que más influyen en tu vida diaria. Además, cuanta más gente vota, más se puede exigir a los políticos que rindan cuentas ante toda su comunidad, no solo ante quienes los apoyan.`,
    },
  },
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
      en: 'When do I need to be registered?',
      es: '¿Cuándo tengo que estar registrado?',
    },
    answer: {
      en: `In North Carolina, you must have applied to register 25 days before Election Day.

If you are voting early, you can [register in person](${ncSameDayRegistrationUrl}) until early voting is over.`,
      es: `En Carolina del Norte, debes haber solicitado tu registro 25 días antes del día de las elecciones.

Si votas de forma anticipada, puedes [registrarte en persona](${ncSameDayRegistrationUrl}) (en inglés) hasta que termine la votación anticipada.`,
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
      en: 'How does early voting work?',
      es: '¿Cómo funciona la votación anticipada?',
    },
    answer: {
      en: `[Early voting](${ncEarlyVotingUrl}) allows you to cast your ballot before the official Election Day. Unlike on Election Day, you can register and vote at any early voting site in the county, not just your assigned polling place. The [Mecklenburg County Board of Elections](${meckBoeUpcomingElectionsUrl}) lists every site with its address and hours.`,
      es: `La [votación anticipada](${ncEarlyVotingUrl}) (en inglés) te permite emitir tu voto antes del día oficial de las elecciones. A diferencia del día de las elecciones, puedes registrarte y votar en cualquier sitio de votación anticipada del condado, no solo en tu lugar de votación asignado. La [Junta Electoral del Condado de Mecklenburg](${meckBoeUpcomingElectionsUrl}) publica la lista de sitios con sus direcciones y horarios (en inglés).`,
    },
  },
  {
    question: {
      en: 'How do mail-in ballots work?',
      es: '¿Cómo funciona el voto por correo?',
    },
    answer: {
      en: `**Request your ballot** through the [NC Absentee Ballot Portal](${ncAbsenteePortalUrl}) or by filling out the [Absentee Request Form (PDF)](${ncAbsenteeRequestFormUrl}). Your request must reach your county board of elections by **5 p.m. on the Tuesday two weeks before Election Day** (October 20 this year).

**Return your finished ballot** by mail, or drop it off in person at your [County Board of Elections](${ncCountyBoeSearchUrl}) office or at any early voting site in your county. It must be **received by 7:30 p.m. on Election Day**. Ballots can’t be dropped off at a polling place on Election Day.`,
      es: `**Solicita tu boleta** en el [Portal de Boletas de Voto Ausente de Carolina del Norte](${ncAbsenteePortalUrl}) (en inglés) o llenando el [Formulario de Solicitud de Boleta de Voto Ausente (PDF)](${ncAbsenteeRequestFormUrl}) (en inglés). Tu solicitud debe llegar a la junta electoral de tu condado antes de las **5 p. m. del martes dos semanas antes del día de las elecciones** (el 20 de octubre este año).

**Devuelve tu boleta completada** por correo, o entrégala en persona en la oficina de la [Junta Electoral de tu condado](${ncCountyBoeSearchUrl}) (en inglés) o en cualquier sitio de votación anticipada de tu condado. Debe **recibirse antes de las 7:30 p. m. del día de las elecciones**. No se pueden entregar boletas en un lugar de votación el día de las elecciones.`,
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
  {
    question: {
      en: 'What are political parties?',
      es: '¿Qué son los partidos políticos?',
    },
    answer: {
      en: `Parties are political groups or factions with the same common interests. A party’s platform is their list of issues and goals they plan to take action on, released every 4 years. The two major parties are the Republican party and Democratic party. Minor parties include the Libertarian party and Green party; minor parties typically have candidates in only some contests. In addition, candidates who do not feel aligned to any political party may run as Independents.`,
      es: `Los partidos son grupos o facciones políticas con intereses en común. La plataforma de un partido es su lista de temas y metas sobre los que planea actuar, y se publica cada 4 años. Los dos partidos principales son el Partido Republicano y el Partido Demócrata. Entre los partidos minoritarios están el Partido Libertario y el Partido Verde; los partidos minoritarios suelen tener candidatos solo en algunas contiendas. Además, los candidatos que no se identifican con ningún partido político pueden postularse como independientes.`,
    },
  },
  {
    question: {
      en: 'What are ballot initiatives?',
      es: '¿Qué son las iniciativas en la boleta?',
    },
    answer: {
      en: `Ballot initiatives are public amendments or referendums that must be approved by a majority of voters in the state or city to pass. However, these can be worded trickily on the ballot, so make sure to read carefully!`,
      es: `Las iniciativas en la boleta son enmiendas o referendos públicos que necesitan el voto a favor de la mayoría de los votantes del estado o de la ciudad para aprobarse. Sin embargo, pueden estar redactados de forma confusa en la boleta, ¡así que léelos con atención!`,
    },
  },
];
