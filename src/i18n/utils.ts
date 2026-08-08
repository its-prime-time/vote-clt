import { defaultLocale, locales, ui, type Locale, type UIKey } from './ui';

/**
 * A piece of editorial content that exists in every supported language.
 * Used throughout `src/data/` so content and translation stay side by side.
 */
export type I18nText = Record<Locale, string>;

/** Look up a chrome string, falling back to English if a key is untranslated. */
export function useTranslations(locale: Locale) {
  return function t(key: UIKey): string {
    return ui[locale][key] ?? ui[defaultLocale][key];
  };
}

/** Pull the right language out of an `I18nText` value. */
export function pick(text: I18nText, locale: Locale): string {
  return text[locale] || text[defaultLocale];
}

/**
 * Turn a canonical, unprefixed path into a URL for the given locale.
 * `/next-elections` -> `/next-elections` (en) or `/es/next-elections` (es).
 */
export function localizePath(path: string, locale: Locale): string {
  const clean = path === '/' ? '' : path.replace(/\/$/, '');
  return locale === defaultLocale ? clean || '/' : `/${locale}${clean}`;
}

/**
 * Every page under `src/pages/[...locale]/` calls this from `getStaticPaths`.
 *
 * The rest parameter matches zero segments for the default locale, so English
 * lives at the site root (`/about`) and Spanish is prefixed (`/es/about`) —
 * without duplicating a single `.astro` file per language.
 */
export function localePaths() {
  return locales.map((locale) => ({
    params: { locale: locale === defaultLocale ? undefined : locale },
    props: { locale },
  }));
}

/** Strip the locale prefix from a URL path, giving back the canonical path. */
export function canonicalPath(pathname: string): string {
  for (const locale of locales) {
    if (locale === defaultLocale) continue;
    if (pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)) {
      return pathname.slice(locale.length + 1) || '/';
    }
  }
  return pathname;
}

export { defaultLocale, locales };
export type { Locale };
