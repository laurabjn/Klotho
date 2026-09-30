import {
  emailSchema,
  forgotPasswordSchema,
  loginSchema,
  PASSWORD_RULES,
  passwordSchema,
  refreshTokenSchema,
  registerFormSchema,
  registerSchema,
  resetPasswordFormSchema,
  resetPasswordSchema,
  updateProfileSchema,
} from './schemas';

function firstMessage(result: {
  success: boolean;
  error?: { issues: { message: string }[] };
}) {
  return result.error?.issues[0]?.message;
}

describe('emailSchema', () => {
  it('normalises case and surrounding spaces', () => {
    expect(emailSchema.parse('  Laura.B@Example.COM ')).toBe(
      'laura.b@example.com',
    );
  });

  it('rejects an invalid email', () => {
    expect(firstMessage(emailSchema.safeParse('not-an-email'))).toBe(
      'errors.email.invalid',
    );
  });
});

function messages(result: { error?: { issues: { message: string }[] } }) {
  return result.error?.issues.map((issue) => issue.message) ?? [];
}

describe('passwordSchema', () => {
  it.each(['Dressing2026!', 'Motdepasse#1', 'Élégance2026 ?', 'aB3$aB3$'])(
    'accepts "%s"',
    (password) => {
      expect(passwordSchema.safeParse(password).success).toBe(true);
    },
  );

  it.each([
    ['Ab1!xyz', 'errors.password.tooShort'],
    ['dressing2026!', 'errors.password.uppercase'],
    ['DRESSING2026!', 'errors.password.lowercase'],
    ['Dressing!!!!', 'errors.password.digit'],
    ['Dressing2026', 'errors.password.special'],
  ])('rejects "%s" with %s', (password, expected) => {
    expect(messages(passwordSchema.safeParse(password))).toEqual([expected]);
  });

  it('reports every broken rule at once, for the checklist', () => {
    expect(messages(passwordSchema.safeParse('abc'))).toEqual([
      'errors.password.tooShort',
      'errors.password.uppercase',
      'errors.password.digit',
      'errors.password.special',
    ]);
  });

  it('does not count a space as a special character', () => {
    expect(messages(passwordSchema.safeParse('Dressing 2026'))).toEqual([
      'errors.password.special',
    ]);
  });

  it('rejects more than 72 bytes (bcrypt limit)', () => {
    const exactly72Bytes = `${'é'.repeat(34)}Aa1!`; // 34 x 2 bytes + 4 bytes
    expect(passwordSchema.safeParse(exactly72Bytes).success).toBe(true);
    expect(messages(passwordSchema.safeParse(`${exactly72Bytes}x`))).toEqual([
      'errors.password.tooLong',
    ]);
  });
});

describe('PASSWORD_RULES', () => {
  it('lists the rules in display order', () => {
    expect(PASSWORD_RULES.map((rule) => rule.key)).toEqual([
      'errors.password.tooShort',
      'errors.password.uppercase',
      'errors.password.lowercase',
      'errors.password.digit',
      'errors.password.special',
    ]);
  });
});

describe('registerSchema', () => {
  it('trims the first name', () => {
    const result = registerSchema.parse({
      email: 'a@b.fr',
      password: 'Dressing2026!',
      firstName: '  Laura ',
    });
    expect(result.firstName).toBe('Laura');
  });

  it('requires a first name', () => {
    const result = registerSchema.safeParse({
      email: 'a@b.fr',
      password: 'Dressing2026!',
      firstName: ' ',
    });
    expect(firstMessage(result)).toBe('errors.firstName.required');
  });
});

describe('loginSchema', () => {
  it('does not apply the password policy (legacy passwords must still log in)', () => {
    expect(
      loginSchema.safeParse({ email: 'a@b.fr', password: 'x' }).success,
    ).toBe(true);
  });

  it('requires a password', () => {
    expect(
      firstMessage(loginSchema.safeParse({ email: 'a@b.fr', password: '' })),
    ).toBe('errors.password.required');
  });
});

describe('token schemas', () => {
  it('refreshTokenSchema requires a token', () => {
    expect(refreshTokenSchema.safeParse({ refreshToken: '' }).success).toBe(
      false,
    );
  });

  it('forgotPasswordSchema normalises the email', () => {
    expect(forgotPasswordSchema.parse({ email: 'A@B.FR' }).email).toBe(
      'a@b.fr',
    );
  });

  it('resetPasswordSchema applies the password policy', () => {
    const result = resetPasswordSchema.safeParse({
      token: 'abc',
      password: 'short',
    });
    expect(firstMessage(result)).toBe('errors.password.tooShort');
  });
});

describe('form schemas', () => {
  const valid = {
    email: 'a@b.fr',
    firstName: 'Laura',
    password: 'Dressing2026!',
    confirmPassword: 'Dressing2026!',
  };

  it('registerFormSchema accepts matching passwords', () => {
    expect(registerFormSchema.safeParse(valid).success).toBe(true);
  });

  it('registerFormSchema flags a mismatch on the confirmation field', () => {
    const result = registerFormSchema.safeParse({
      ...valid,
      confirmPassword: 'Dressing2026?',
    });
    expect(result.error?.issues).toEqual([
      expect.objectContaining({
        path: ['confirmPassword'],
        message: 'errors.password.mismatch',
      }),
    ]);
  });

  it('resetPasswordFormSchema applies the policy and the confirmation', () => {
    const result = resetPasswordFormSchema.safeParse({
      password: 'weak',
      confirmPassword: 'other',
    });
    expect(messages(result)).toContain('errors.password.tooShort');
  });
});

describe('updateProfileSchema', () => {
  it('drops fields that cannot be edited', () => {
    const result = updateProfileSchema.parse({
      firstName: 'Laura',
      email: 'hacker@evil.com',
      passwordHash: 'x',
    });
    expect(result).toEqual({ firstName: 'Laura' });
  });

  it('allows clearing the avatar', () => {
    expect(updateProfileSchema.parse({ avatarUrl: null })).toEqual({
      avatarUrl: null,
    });
  });

  it('rejects a non-https avatar url', () => {
    expect(
      updateProfileSchema.safeParse({ avatarUrl: 'http://x.fr/a.png' }).success,
    ).toBe(false);
  });
});
