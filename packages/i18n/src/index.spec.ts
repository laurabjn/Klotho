import {
  DEFAULT_LOCALE,
  resolveLocale,
  resources,
  SUPPORTED_LOCALES,
} from './index';

function flattenKeys(value: object, prefix = ''): string[] {
  return Object.entries(value).flatMap(([key, child]) =>
    typeof child === 'object' && child !== null
      ? flattenKeys(child as object, `${prefix}${key}.`)
      : [`${prefix}${key}`],
  );
}

describe('i18n resources', () => {
  const referenceKeys = flattenKeys(
    resources[DEFAULT_LOCALE].translation,
  ).sort();

  it.each(SUPPORTED_LOCALES)(
    'locale "%s" has exactly the reference keys',
    (locale) => {
      expect(flattenKeys(resources[locale].translation).sort()).toEqual(
        referenceKeys,
      );
    },
  );

  it.each(SUPPORTED_LOCALES)(
    'locale "%s" has no empty translation',
    (locale) => {
      const translation = resources[locale].translation;
      for (const key of referenceKeys) {
        const text = key
          .split('.')
          .reduce<unknown>(
            (node, part) => (node as Record<string, unknown>)[part],
            translation,
          );
        expect(typeof text === 'string' && text.trim().length > 0).toBe(true);
      }
    },
  );
});

describe('resolveLocale', () => {
  it('returns the first supported candidate', () => {
    expect(resolveLocale(['de', 'en', 'fr'])).toBe('en');
  });

  it('falls back to the default locale', () => {
    expect(resolveLocale(['de', null, undefined])).toBe(DEFAULT_LOCALE);
  });
});
