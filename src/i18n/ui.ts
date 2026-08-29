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
    'results.noAddress': 'No address provided.',
    'results.loading': 'Looking up your ballot information',
    'results.loadingNote': 'This usually takes 10–15 seconds.',
    'results.error.unrecognized':
      'We couldn’t read that as a street address. Try a format like ‘123 Main St’.',
    'results.error.notFound':
      'We couldn’t find that address in Mecklenburg County. Double-check the house number and street name.',
    'results.error.multiple':
      'That search matched more than one address. Choose yours below, or add more detail such as a ZIP code.',
    'results.error.upstream':
      'The Board of Elections site isn’t responding right now. Please try again in a few minutes.',
    'results.error.network':
      'We couldn’t reach the lookup service. Check your connection and try again.',
    'results.error.generic': 'Something went wrong looking up your ballot. Please try again.',
    'results.didYouMean': 'Did you mean:',
    'results.browse': 'Browse all candidates',
    'results.tryAgain': 'Search a different address',

    'ballot.heading': 'Your Sample Ballot',
    'ballot.detailsHeading': 'Your voting details',
    'ballot.address': 'Address',
    'ballot.pollingPlace': 'Polling place',
    'ballot.directions': 'Directions',
    'ballot.precinct': 'Precinct',
    'ballot.samplePdf': 'Official sample ballot (PDF)',
    'ballot.source': 'Voting details from the Mecklenburg County Board of Elections.',
    'ballot.selectOne': 'Select one.',
    'ballot.selectUpTo': 'Select up to',
    'ballot.vs': 'VS',
    'ballot.prioritizes': 'This candidate prioritizes {issues}',
    'ballot.alsoPrefix': 'Also on your ballot: ',
    'ballot.initiative': 'ballot initiative',
    'ballot.initiatives': 'ballot initiatives',
    'ballot.alsoSuffix': '.',
    'ballot.noMatches':
      'We couldn’t match your districts to any of the contests we have information on.',

    'party.Democratic': 'Democratic',
    'party.Republican': 'Republican',
    'party.Libertarian': 'Libertarian',
    'party.Green': 'Green',
    'party.Constitution': 'Constitution',
    'party.Unaffiliated': 'Unaffiliated',

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
    'candidates.seat': 'Seat',
    'candidates.atLarge': 'At-Large',
    'candidates.voteFor': 'Vote for',
    'candidates.noData': 'No additional data',
    'candidates.website': 'Campaign website',
    'candidates.noContests': 'There are no contests for this jurisdiction on the upcoming ballot.',

    'footer.rights': 'Vote CLT is a nonpartisan voter information project.',
    'footer.disclaimer':
      'Always confirm details with the Mecklenburg County Board of Elections before you vote.',
    'footer.attributionPrefix': 'Ballot lookup information provided by ',
    'footer.attributionLink': 'Mecklenburg Board of Elections',
    'footer.attributionSuffix': '.',

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
    'results.noAddress': 'No se proporcionó ninguna dirección.',
    'results.loading': 'Buscando la información de tu boleta',
    'results.loadingNote': 'Esto suele tardar entre 10 y 15 segundos.',
    'results.error.unrecognized':
      'No pudimos interpretar eso como una dirección. Prueba un formato como ‘123 Main St’.',
    'results.error.notFound':
      'No encontramos esa dirección en el condado de Mecklenburg. Verifica el número de casa y el nombre de la calle.',
    'results.error.multiple':
      'La búsqueda coincidió con más de una dirección. Elige la tuya abajo o agrega más detalles, como el código postal.',
    'results.error.upstream':
      'El sitio de la Junta Electoral no responde en este momento. Inténtalo de nuevo en unos minutos.',
    'results.error.network':
      'No pudimos conectar con el servicio de búsqueda. Revisa tu conexión e inténtalo de nuevo.',
    'results.error.generic': 'Algo salió mal al buscar tu boleta. Inténtalo de nuevo.',
    'results.didYouMean': '¿Quisiste decir:',
    'results.browse': 'Ver todos los candidatos',
    'results.tryAgain': 'Buscar otra dirección',

    'ballot.heading': 'Tu boleta de muestra',
    'ballot.detailsHeading': 'Tus datos de votación',
    'ballot.address': 'Dirección',
    'ballot.pollingPlace': 'Lugar de votación',
    'ballot.directions': 'Cómo llegar',
    'ballot.precinct': 'Precinto',
    'ballot.samplePdf': 'Boleta de muestra oficial (PDF)',
    'ballot.source': 'Datos de votación de la Junta Electoral del Condado de Mecklenburg.',
    'ballot.selectOne': 'Selecciona uno.',
    'ballot.selectUpTo': 'Selecciona hasta',
    'ballot.vs': 'VS',
    'ballot.prioritizes': 'Prioriza {issues}',
    'ballot.alsoPrefix': 'También en tu boleta: ',
    'ballot.initiative': 'iniciativa electoral',
    'ballot.initiatives': 'iniciativas electorales',
    'ballot.alsoSuffix': '.',
    'ballot.noMatches':
      'No pudimos relacionar tus distritos con ninguna de las contiendas sobre las que tenemos información.',

    'party.Democratic': 'Demócrata',
    'party.Republican': 'Republicano',
    'party.Libertarian': 'Libertario',
    'party.Green': 'Verde',
    'party.Constitution': 'Constitución',
    'party.Unaffiliated': 'Sin afiliación',

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
    'candidates.seat': 'Puesto',
    'candidates.atLarge': 'General',
    'candidates.voteFor': 'Vota por',
    'candidates.noData': 'Sin datos adicionales',
    'candidates.website': 'Sitio web de campaña',
    'candidates.noContests': 'No hay contiendas para esta jurisdicción en la próxima boleta.',

    'footer.rights': 'Vote CLT es un proyecto no partidista de información para votantes.',
    'footer.disclaimer':
      'Confirma siempre los detalles con la Junta Electoral del Condado de Mecklenburg antes de votar.',
    'footer.attributionPrefix': 'Información de búsqueda de boletas proporcionada por la ',
    'footer.attributionLink': 'Junta Electoral del Condado de Mecklenburg',
    'footer.attributionSuffix': '.',

    'notFound.title': 'Página no encontrada',
    'notFound.body': 'No pudimos encontrar esa página. Intenta comenzar desde la página principal.',
    'notFound.home': 'Ir a la página principal',
  },
} as const;

export type UIKey = keyof (typeof ui)['en'];
