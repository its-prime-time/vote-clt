import type { I18nText } from '../i18n/utils';
import { meckBoePhone, meckBoeUrl, ncVoterSearchUrl } from './links';

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
      en: 'Placeholder answer.',
      es: 'Respuesta pendiente.',
    },
  },
  {
    question: {
      en: 'What do I need to bring with me?',
      es: '¿Qué necesito llevar conmigo?',
    },
    answer: {
      en: 'Placeholder answer.',
      es: 'Respuesta pendiente.',
    },
  },
];
