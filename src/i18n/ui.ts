/**
 * Translation dictionary for site chrome (nav, headings, boilerplate).
 *
 * Content that lives in `src/data/` carries its own translations inline via the
 * `I18nText` type in `src/i18n/utils.ts`, so editors can add a candidate or an
 * election without touching this file.
 */

export const locales = ['en', 'es'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

/** Label shown in the header language switcher. */
export const localeLabels: Record<Locale, string> = {
  en: 'EN',
  es: 'ES',
};

export const ui = {
  en: {
    'site.name': 'Vote CLT',
    'site.tagline': 'Election information for Charlotte and Mecklenburg County.',

    'nav.myBallot': 'My Ballot',
    'nav.allCandidates': 'All Candidates',
    'nav.nextElections': 'Next Elections',
    'nav.about': 'About Us',
    'nav.faq': 'FAQ',
    'nav.menu': 'Menu',
    'nav.switchLanguage': 'Switch language',
    'nav.skipToContent': 'Skip to main content',

    'home.title': 'Find my ballot',
    'home.subtitle':
      'Find all of the candidates and policies you can vote for in one quick, easy search.',
    'home.addressPlaceholder': 'Your home street address, for example ‘123 Main St’',
    'home.addressLabel': 'Your home address',
    'home.search': 'Search',
    'home.manualPrefix': 'Don’t want to input your address? Find your candidates manually on the ',
    'home.manualLink': 'All Candidates',
    'home.manualSuffix': ' page.',

    'results.title': 'Your ballot',
    'results.forAddress': 'Results for',
    'results.noAddress': 'No address provided.',
    'results.comingSoon':
      'Address-based ballot lookup is coming soon. In the meantime, browse candidates by jurisdiction.',
    'results.browse': 'Browse all candidates',
    'results.tryAgain': 'Search a different address',

    'elections.title': 'Next Elections',
    'elections.introPrefix': 'View upcoming elections and ballot initiatives in your area. Find your polling location ',
    'elections.introLink': 'here',
    'elections.introSuffix': '.',
    'elections.view': 'View ballot initiatives',
    'elections.close': 'Close ballot initiatives',
    'elections.none': 'No ballot initiatives have been certified for this election yet.',
    'elections.colType': 'Type',
    'elections.colTitle': 'Title',
    'elections.colSubject': 'Subject',
    'elections.colDescription': 'Description',

    'about.title': 'About Us',
    'about.mission': 'Our mission is....',
    'about.team': 'Meet Our Team',

    'faq.title': 'FAQ',
    'faq.intro': 'Answers to common questions about voting in Charlotte and Mecklenburg County.',

    'candidates.district': 'District',
    'candidates.tbd': 'Candidate to be announced',
    'candidates.tbdNote': 'Filing for this seat has not closed yet.',
    'candidates.emptySection': 'Candidates for this race have not been announced yet.',

    'footer.rights': 'Vote CLT is a nonpartisan voter information project.',
    'footer.disclaimer':
      'Always confirm details with the Mecklenburg County Board of Elections before you vote.',

    'notFound.title': 'Page not found',
    'notFound.body': 'We couldn’t find that page. Try starting from the home page.',
    'notFound.home': 'Go to the home page',
  },
  es: {
    'site.name': 'Vote CLT',
    'site.tagline': 'Información electoral para Charlotte y el condado de Mecklenburg.',

    'nav.myBallot': 'Mi Boleta',
    'nav.allCandidates': 'Todos los Candidatos',
    'nav.nextElections': 'Próximas Elecciones',
    'nav.about': 'Quiénes Somos',
    'nav.faq': 'Preguntas Frecuentes',
    'nav.menu': 'Menú',
    'nav.switchLanguage': 'Cambiar idioma',
    'nav.skipToContent': 'Saltar al contenido principal',

    'home.title': 'Encuentra mi boleta',
    'home.subtitle':
      'Encuentra todos los candidatos y las políticas por los que puedes votar en una búsqueda rápida y sencilla.',
    'home.addressPlaceholder': 'Tu dirección de residencia, por ejemplo ‘123 Main St’',
    'home.addressLabel': 'Tu dirección de residencia',
    'home.search': 'Buscar',
    'home.manualPrefix': '¿No quieres ingresar tu dirección? Encuentra tus candidatos manualmente en la página ',
    'home.manualLink': 'Todos los Candidatos',
    'home.manualSuffix': '.',

    'results.title': 'Tu boleta',
    'results.forAddress': 'Resultados para',
    'results.noAddress': 'No se proporcionó ninguna dirección.',
    'results.comingSoon':
      'La búsqueda de boletas por dirección estará disponible pronto. Mientras tanto, explora los candidatos por jurisdicción.',
    'results.browse': 'Ver todos los candidatos',
    'results.tryAgain': 'Buscar otra dirección',

    'elections.title': 'Próximas Elecciones',
    'elections.introPrefix': 'Consulta las próximas elecciones e iniciativas electorales en tu área. Encuentra tu lugar de votación ',
    'elections.introLink': 'aquí',
    'elections.introSuffix': '.',
    'elections.view': 'Ver iniciativas electorales',
    'elections.close': 'Cerrar iniciativas electorales',
    'elections.none': 'Todavía no se han certificado iniciativas electorales para esta elección.',
    'elections.colType': 'Tipo',
    'elections.colTitle': 'Título',
    'elections.colSubject': 'Tema',
    'elections.colDescription': 'Descripción',

    'about.title': 'Quiénes Somos',
    'about.mission': 'Nuestra misión es....',
    'about.team': 'Conoce a Nuestro Equipo',

    'faq.title': 'Preguntas Frecuentes',
    'faq.intro':
      'Respuestas a preguntas comunes sobre cómo votar en Charlotte y el condado de Mecklenburg.',

    'candidates.district': 'Distrito',
    'candidates.tbd': 'Candidato por anunciar',
    'candidates.tbdNote': 'El plazo de inscripción para este puesto aún no ha cerrado.',
    'candidates.emptySection': 'Todavía no se han anunciado los candidatos para esta contienda.',

    'footer.rights': 'Vote CLT es un proyecto no partidista de información para votantes.',
    'footer.disclaimer':
      'Confirma siempre los detalles con la Junta Electoral del Condado de Mecklenburg antes de votar.',

    'notFound.title': 'Página no encontrada',
    'notFound.body': 'No pudimos encontrar esa página. Intenta comenzar desde la página principal.',
    'notFound.home': 'Ir a la página principal',
  },
} as const;

export type UIKey = keyof (typeof ui)['en'];
