import { execSync } from 'node:child_process';
import path from 'node:path';

import { Client } from 'pg';

import './setup-env';

/** Creates the test database if needed and applies every migration, once per run. */
export default async function globalSetup(): Promise<void> {
  const url = new URL(process.env.DATABASE_URL ?? '');
  const database = url.pathname.slice(1);
  if (!database.endsWith('_test')) {
    throw new Error(
      `Refusing to run e2e tests against "${database}": its name must end with _test.`,
    );
  }

  const admin = new Client({
    connectionString: new URL('/postgres', url).toString(),
  });
  await admin.connect();
  try {
    const { rowCount } = await admin.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [database],
    );
    if (!rowCount) await admin.query(`CREATE DATABASE "${database}"`);
  } finally {
    await admin.end();
  }

  execSync('npx prisma migrate deploy', {
    cwd: path.resolve(__dirname, '..'),
    env: process.env,
    stdio: 'ignore',
  });
}
