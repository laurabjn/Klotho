// e2e tests run with explicit defaults that CI (or the caller) can override.
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL ??=
  'postgresql://klotho:klotho@localhost:5433/klotho_test';
process.env.JWT_ACCESS_SECRET ??= 'e2e-test-secret-at-least-32-characters-long';
process.env.BCRYPT_COST ??= '4';
// Storage is replaced by an in-memory fake in e2e tests; these only satisfy validation.
process.env.STORAGE_ENDPOINT ??= 'http://localhost:9010';
process.env.STORAGE_BUCKET ??= 'klotho-test';
process.env.STORAGE_ACCESS_KEY_ID ??= 'test';
process.env.STORAGE_SECRET_ACCESS_KEY ??= 'test';
process.env.STORAGE_CREATE_BUCKET = 'false';
