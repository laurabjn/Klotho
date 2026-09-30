// e2e tests run with explicit defaults that CI (or the caller) can override.
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL ??=
  'postgresql://klotho:klotho@localhost:5433/klotho_test';
