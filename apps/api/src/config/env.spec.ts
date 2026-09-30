import { validateEnv } from './env';

const validEnv = {
  DATABASE_URL: 'postgresql://klotho:klotho@localhost:5432/klotho',
  JWT_ACCESS_SECRET: 'a'.repeat(32),
};

describe('validateEnv', () => {
  it('applies defaults for optional variables', () => {
    expect(validateEnv(validEnv)).toEqual({
      ...validEnv,
      NODE_ENV: 'development',
      PORT: 3000,
      JWT_ACCESS_TTL_SECONDS: 900,
      REFRESH_TOKEN_TTL_DAYS: 30,
      PASSWORD_RESET_TTL_MINUTES: 60,
      RESET_PASSWORD_URL: 'klotho://reset-password',
      BCRYPT_COST: 12,
      MAIL_DRIVER: 'console',
    });
  });

  it('coerces numbers from strings', () => {
    expect(validateEnv({ ...validEnv, PORT: '4000' }).PORT).toBe(4000);
  });

  it('rejects a missing DATABASE_URL', () => {
    expect(() =>
      validateEnv({ JWT_ACCESS_SECRET: validEnv.JWT_ACCESS_SECRET }),
    ).toThrow(/DATABASE_URL/);
  });

  it('rejects a non-postgres DATABASE_URL', () => {
    expect(() =>
      validateEnv({ ...validEnv, DATABASE_URL: 'mysql://localhost/klotho' }),
    ).toThrow(/DATABASE_URL/);
  });

  it('rejects an unknown NODE_ENV', () => {
    expect(() => validateEnv({ ...validEnv, NODE_ENV: 'staging' })).toThrow(
      /NODE_ENV/,
    );
  });

  it('rejects a short JWT secret', () => {
    expect(() =>
      validateEnv({ ...validEnv, JWT_ACCESS_SECRET: 'short' }),
    ).toThrow(/JWT_ACCESS_SECRET/);
  });

  it('refuses the console mailer in production', () => {
    expect(() => validateEnv({ ...validEnv, NODE_ENV: 'production' })).toThrow(
      /MAIL_DRIVER/,
    );
  });
});
