import type { I18nText } from '../i18n/utils';

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

/** Placeholder FAQ entries — replace the copy, keep the shape. */
export const faqs: { question: I18nText; answer: I18nText }[] = [
  {
    question: {
      en: 'Am I registered to vote?',
      es: '¿Estoy registrado para votar?',
    },
    answer: {
      en: 'Placeholder answer.',
      es: 'Respuesta pendiente.',
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
