import { resources } from '@klotho/i18n';
import { PASSWORD_RULES } from '@klotho/shared';

function lookup(key: string): unknown {
  return key
    .split('.')
    .reduce<unknown>(
      (node, part) => (node as Record<string, unknown> | undefined)?.[part],
      resources.fr.translation,
    );
}

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
