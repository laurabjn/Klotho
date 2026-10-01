import { SUPPORTED_LOCALES, resources } from '@klotho/i18n';
import {
  BOTTOM_PREFERENCES,
  COLOR_KEYS,
  LENGTHS,
  METALS,
  OCCASIONS,
  OUTFIT_HIGHLIGHTS,
  OUTFIT_ROLES,
  PASSWORD_RULES,
  PATTERNS,
  SEASONS,
  STYLES,
  SUBCATEGORIES,
  WARDROBE_CATEGORIES,
  WARDROBE_SORTS,
  WARDROBE_STATUSES,
} from '@klotho/shared';

function lookup(key: string, locale: 'fr' | 'en' = 'fr'): unknown {
  return key
    .split('.')
    .reduce<unknown>(
      (node, part) => (node as Record<string, unknown> | undefined)?.[part],
      resources[locale].translation,
    );
}

describe('wardrobe taxonomy translations', () => {
  const keys = [
    ...WARDROBE_CATEGORIES.map((key) => `wardrobe.categories.${key}`),
    ...WARDROBE_CATEGORIES.map((key) => `wardrobe.category.${key}`),
    ...Object.values(SUBCATEGORIES)
      .flat()
      .map((key) => `wardrobe.subcategories.${key}`),
    ...COLOR_KEYS.map((key) => `wardrobe.colors.${key}`),
    ...STYLES.map((key) => `wardrobe.styles.${key}`),
    ...SEASONS.map((key) => `wardrobe.seasons.${key}`),
    ...WARDROBE_STATUSES.map((key) => `wardrobe.statuses.${key}`),
    ...PATTERNS.map((key) => `wardrobe.patterns.${key}`),
    ...WARDROBE_SORTS.map((key) => `wardrobe.sorts.${key}`),
    ...METALS.map((key) => `preferences.metals.${key}`),
    ...OCCASIONS.map((key) => `outfits.occasions.${key}`),
    ...OCCASIONS.map((key) => `outfits.titles.${key}`),
    ...OUTFIT_ROLES.map((key) => `outfits.roles.${key}`),
    ...OUTFIT_HIGHLIGHTS.map((key) => `outfits.highlights.${key}`),
    ...LENGTHS.map((key) => `preferences.lengths.${key}`),
    ...BOTTOM_PREFERENCES.map((key) => `preferences.bottomOptions.${key}`),
    ...[1, 2, 3, 4, 5].flatMap((level) => [
      `wardrobe.warmth.${level}`,
      `wardrobe.formality.${level}`,
    ]),
  ];

  it.each(SUPPORTED_LOCALES)(
    'every taxonomy value is translated in %s',
    (locale) => {
      const missing = keys.filter(
        (key) => typeof lookup(key, locale) !== 'string',
      );
      expect(missing).toEqual([]);
    },
  );
});

describe('translations used by the auth flow', () => {
  it.each(PASSWORD_RULES.map((rule) => rule.key))(
    'password rule %s is translated',
    (key) => {
      expect(typeof lookup(key)).toBe('string');
    },
  );

  it.each([
    'errors.email.invalid',
    'errors.password.required',
    'errors.password.mismatch',
    'errors.password.tooLong',
    'errors.firstName.required',
    'apiErrors.auth.emailAlreadyUsed',
    'apiErrors.auth.invalidCredentials',
    'apiErrors.auth.invalidResetToken',
    'apiErrors.network',
    'apiErrors.unknown',
  ])('%s is translated', (key) => {
    expect(typeof lookup(key)).toBe('string');
  });
});
