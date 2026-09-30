import request from 'supertest';

import { createTestApp, type TestApp } from './utils/test-app';

describe('Smoke (e2e)', () => {
  let t: TestApp;

  beforeAll(async () => {
    t = await createTestApp();
  });

  afterAll(async () => {
    await t.app.close();
  });

  it('GET /health returns ok', async () => {
    await request(t.app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect({ status: 'ok' });
  });
});
