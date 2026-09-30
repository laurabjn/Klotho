import { validateEnv } from './env';

const validEnv = {
  DATABASE_URL: 'postgresql://klotho:klotho@localhost:5432/klotho',
  JWT_ACCESS_SECRET: 'a'.repeat(32),
  STORAGE_ENDPOINT: 'http://localhost:9010',
  STORAGE_BUCKET: 'klotho-photos',
  STORAGE_ACCESS_KEY_ID: 'key',
  STORAGE_SECRET_ACCESS_KEY: 'secret',
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
      STORAGE_REGION: 'auto',
      STORAGE_CREATE_BUCKET: false,
      PHOTO_URL_TTL_SECONDS: 3600,
      PHOTOS_MAX_PER_ITEM: 5,
      UPLOAD_MAX_BYTES: 10 * 1024 * 1024,
    });
  });

  it('coerces numbers and booleans from strings', () => {
    const env = validateEnv({
      ...validEnv,
      PORT: '4000',
      STORAGE_CREATE_BUCKET: 'true',
    });
    expect(env.PORT).toBe(4000);
    expect(env.STORAGE_CREATE_BUCKET).toBe(true);
  });

  it('rejects a missing DATABASE_URL', () => {
    const { DATABASE_URL: _missing, ...rest } = validEnv;
    expect(() => validateEnv(rest)).toThrow(/DATABASE_URL/);
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

  it('requires the storage configuration', () => {
    const { STORAGE_BUCKET: _missing, ...rest } = validEnv;
    expect(() => validateEnv(rest)).toThrow(/STORAGE_BUCKET/);
  });

  it('refuses the console mailer in production', () => {
    expect(() => validateEnv({ ...validEnv, NODE_ENV: 'production' })).toThrow(
      /MAIL_DRIVER/,
    );
  });
});
