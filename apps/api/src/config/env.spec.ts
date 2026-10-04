import { logFormat, validateEnv } from './env';

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
      EMAIL_CHANGE_TTL_MINUTES: 60,
      CONFIRM_EMAIL_URL: 'klotho://confirm-email',
      BCRYPT_COST: 12,
      MAIL_DRIVER: 'console',
      MAIL_FROM_NAME: 'Klotho',
      STORAGE_REGION: 'auto',
      STORAGE_CREATE_BUCKET: false,
      PHOTO_URL_TTL_SECONDS: 3600,
      PHOTOS_MAX_PER_ITEM: 5,
      UPLOAD_MAX_BYTES: 10 * 1024 * 1024,
      WEATHER_TIMEOUT_MS: 5000,
      WEATHER_CACHE_TTL_SECONDS: 600,
      AI_PROVIDER: 'groq',
      AI_TIMEOUT_MS: 30000,
      AI_FREE_PHOTO_ANALYSES: 3,
      BILLING_ENABLED: false,
      FREE_PIECES: 50,
      FREE_GENERATIONS_PER_WEEK: 10,
      FREE_HISTORY_DAYS: 7,
      PREMIUM_MONTHLY_ANALYSES: 25,
      TRUST_PROXY: 0,
      LOG_HTTP_REQUESTS: true,
      RATE_LIMIT_ENABLED: true,
      RATE_LIMIT_LOGIN: { limit: 10, ttlSeconds: 60 },
      RATE_LIMIT_REGISTER: { limit: 5, ttlSeconds: 60 },
      RATE_LIMIT_FORGOT_PASSWORD: { limit: 5, ttlSeconds: 900 },
      RATE_LIMIT_RESET_PASSWORD: { limit: 10, ttlSeconds: 900 },
      RATE_LIMIT_REFRESH: { limit: 30, ttlSeconds: 60 },
      RATE_LIMIT_UPLOADS: { limit: 30, ttlSeconds: 60 },
    });
  });

  it('parses rate limits as <requests>/<seconds>', () => {
    const env = validateEnv({ ...validEnv, RATE_LIMIT_LOGIN: '3/300' });
    expect(env.RATE_LIMIT_LOGIN).toEqual({ limit: 3, ttlSeconds: 300 });
    expect(() =>
      validateEnv({ ...validEnv, RATE_LIMIT_LOGIN: '10 per minute' }),
    ).toThrow(/RATE_LIMIT_LOGIN/);
  });

  it('logs JSON in production, readable text elsewhere, unless told', () => {
    expect(logFormat({ NODE_ENV: 'production' })).toBe('json');
    expect(logFormat({ NODE_ENV: 'development' })).toBe('pretty');
    expect(logFormat({ NODE_ENV: 'production', LOG_FORMAT: 'pretty' })).toBe(
      'pretty',
    );
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

  it('treats an empty weather key as missing', () => {
    expect(
      validateEnv({ ...validEnv, OPENWEATHER_API_KEY: ' ' })
        .OPENWEATHER_API_KEY,
    ).toBeUndefined();
  });

  it('requires the weather key in production', () => {
    expect(() => validateEnv({ ...validEnv, NODE_ENV: 'production' })).toThrow(
      /OPENWEATHER_API_KEY/,
    );
  });

  it('needs the Brevo key and a sender for Brevo', () => {
    expect(() => validateEnv({ ...validEnv, MAIL_DRIVER: 'brevo' })).toThrow(
      /MAIL_DRIVER/,
    );
    expect(
      validateEnv({
        ...validEnv,
        MAIL_DRIVER: 'brevo',
        BREVO_API_KEY: 'key',
        MAIL_FROM: 'contact@klotho.test',
      }).MAIL_DRIVER,
    ).toBe('brevo');
  });

  it('refuses the console mailer in production', () => {
    expect(() => validateEnv({ ...validEnv, NODE_ENV: 'production' })).toThrow(
      /MAIL_DRIVER/,
    );
  });
});
