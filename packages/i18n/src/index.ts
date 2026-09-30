import { en } from './locales/en';
import { fr, type TranslationResource } from './locales/fr';

export type { TranslationResource };

export const SUPPORTED_LOCALES = ['fr', 'en'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'fr';
export const DEFAULT_NAMESPACE = 'translation';

export const resources: Record<Locale, { translation: TranslationResource }> = {
  fr: { translation: fr },
  en: { translation: en },
};

export function isSupportedLocale(
  value: string | null | undefined,
): value is Locale {
  return SUPPORTED_LOCALES.includes(value as Locale);
}

export function resolveLocale(
  candidates: ReadonlyArray<string | null | undefined>,
): Locale {
  return candidates.find(isSupportedLocale) ?? DEFAULT_LOCALE;
}
