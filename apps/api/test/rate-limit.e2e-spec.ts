import type { AuthSession } from '@klotho/shared';
import sharp from 'sharp';
import request from 'supertest';

import type { RateLimitSettings } from '../src/interfaces/http/rate-limit/rate-limit.settings';
import { createTestApp, type TestApp } from './utils/test-app';

const tight = { limit: 2, ttlSeconds: 60 };
const loose = { limit: 100, ttlSeconds: 60 };

/** Small limits; register stays loose so that each test can create accounts. */
const settings: RateLimitSettings = {
  enabled: true,
  rules: {
    login: tight,
    register: loose,
    forgotPassword: tight,
    resetPassword: tight,
    refresh: tight,
    uploads: tight,
  },
};

describe('Rate limiting (e2e)', () => {
  let t: TestApp;
  const http = () => request(t.app.getHttpServer());

  async function register(email: string): Promise<AuthSession> {
    const res = await http()
      .post('/auth/register')
      .send({ email, password: 'Dressing2026!', firstName: 'Test' })
      .expect(201);
    return res.body as AuthSession;
  }

  beforeEach(async () => {
    // A fresh app per test: fresh counters.
    t = await createTestApp({ rateLimits: settings });
    await t.reset();
  });

  afterEach(async () => {
    await t.app.close();
  });

  it('answers 429 request.rateLimited with Retry-After beyond the login limit', async () => {
    const attempt = () =>
      http()
        .post('/auth/login')
        .send({ email: 'nobody@example.com', password: 'wrong' });
    await attempt().expect(401);
    await attempt().expect(401);

    const res = await attempt().expect(429);

    expect(res.body).toEqual({ statusCode: 429, code: 'request.rateLimited' });
    expect(Number(res.headers['retry-after'])).toBeGreaterThan(0);
    expect(Number(res.headers['retry-after'])).toBeLessThanOrEqual(60);
  });

  it.each([
    ['/auth/forgot-password', { email: 'a@example.com' }],
    ['/auth/reset-password', { token: 'x', password: 'Dressing2026!' }],
    ['/auth/refresh', { refreshToken: 'x' }],
    ['/auth/confirm-email', { token: 'x' }],
  ])('limits POST %s', async (path, body) => {
    await http().post(path).send(body);
    await http().post(path).send(body);
    await http().post(path).send(body).expect(429);
  });

  it.each([
    [
      '/users/me/password',
      { currentPassword: 'Wrong2026!', newPassword: 'New2026!!' },
    ],
    [
      '/users/me/email',
      { newEmail: 'new@example.com', password: 'Wrong2026!' },
    ],
  ])('limits POST %s like a login', async (path, body) => {
    const { tokens } = await register('laura@example.com');
    const attempt = () =>
      http()
        .post(path)
        .set('Authorization', `Bearer ${tokens.accessToken}`)
        .send(body);
    await attempt().expect(403);
    await attempt().expect(403);
    await attempt().expect(429);
  });

  it('limits registrations', async () => {
    const app = await createTestApp({
      rateLimits: {
        ...settings,
        rules: { ...settings.rules, register: { limit: 1, ttlSeconds: 60 } },
      },
    });
    try {
      const attempt = (email: string) =>
        request(app.app.getHttpServer())
          .post('/auth/register')
          .send({ email, password: 'Dressing2026!', firstName: 'Test' });
      await attempt('one@example.com').expect(201);
      await attempt('two@example.com').expect(429);
    } finally {
      await app.app.close();
    }
  });

  it('limits uploads, without touching the other routes', async () => {
    const { tokens } = await register('laura@example.com');
    const picture = await sharp({
      create: { width: 20, height: 20, channels: 3, background: '#EFCDC4' },
    })
      .jpeg()
      .toBuffer();
    const upload = () =>
      http()
        .post('/uploads/wardrobe')
        .set('Authorization', `Bearer ${tokens.accessToken}`)
        .attach('file', picture, 'photo.jpg');

    await upload().expect(201);
    await upload().expect(201);
    const res = await upload().expect(429);
    expect(res.body).toEqual({ statusCode: 429, code: 'request.rateLimited' });

    for (let i = 0; i < 5; i++) {
      await http()
        .get('/wardrobe')
        .set('Authorization', `Bearer ${tokens.accessToken}`)
        .expect(200);
      await http().get('/health').expect(200);
    }
  });

  it('checks authentication before counting uploads', async () => {
    for (let i = 0; i < 4; i++) {
      await http().post('/uploads/wardrobe').expect(401);
    }
  });
});
