import type { AuthSession, AuthTokens } from '@klotho/shared';
import request from 'supertest';

import { createTestApp, type TestApp } from './utils/test-app';

const laura = {
  email: 'laura@example.com',
  password: 'Dressing2026!',
  firstName: 'Laura',
};

describe('Auth & users (e2e)', () => {
  let t: TestApp;
  const http = () => request(t.app.getHttpServer());

  beforeAll(async () => {
    t = await createTestApp();
  });

  beforeEach(async () => {
    await t.reset();
  });

  afterAll(async () => {
    await t.app.close();
  });

  async function register(body: object = laura): Promise<AuthSession> {
    const res = await http().post('/auth/register').send(body).expect(201);
    return res.body as AuthSession;
  }

  describe('POST /auth/register', () => {
    it('201 with the profile, never the password hash', async () => {
      const res = await http().post('/auth/register').send(laura).expect(201);

      expect(res.body).toMatchObject({
        user: { email: laura.email, firstName: 'Laura', avatarUrl: null },
        tokens: {
          accessToken: expect.any(String),
          refreshToken: expect.any(String),
        },
      });
      expect(JSON.stringify(res.body)).not.toMatch(/passwordHash|\$2b\$/);
    });

    it('stores a bcrypt hash, not the password', async () => {
      await register();

      const row = await t.prisma.user.findUniqueOrThrow({
        where: { email: laura.email },
      });
      expect(row.passwordHash).toMatch(/^\$2b\$/);
    });

    it('409 when the email is already used, whatever its case', async () => {
      await register();

      const res = await http()
        .post('/auth/register')
        .send({ ...laura, email: ' LAURA@example.com' })
        .expect(409);
      expect(res.body).toEqual({
        statusCode: 409,
        code: 'auth.emailAlreadyUsed',
      });
    });

    it('400 with i18n keys when the input is invalid', async () => {
      const res = await http()
        .post('/auth/register')
        .send({ email: 'nope', password: 'short', firstName: '' })
        .expect(400);

      expect(res.body.code).toBe('validation.failed');
      expect(res.body.issues).toEqual(
        expect.arrayContaining([
          { path: 'email', message: 'errors.email.invalid' },
          { path: 'password', message: 'errors.password.tooShort' },
          { path: 'firstName', message: 'errors.firstName.required' },
        ]),
      );
    });
  });

  describe('POST /auth/login', () => {
    beforeEach(() => register());

    it('200 with a session', async () => {
      const res = await http()
        .post('/auth/login')
        .send({ email: laura.email, password: laura.password })
        .expect(200);

      expect((res.body as AuthSession).user.email).toBe(laura.email);
    });

    it('401 with the same body for a wrong password and an unknown email', async () => {
      const wrongPassword = await http()
        .post('/auth/login')
        .send({ email: laura.email, password: 'WrongPassword1!' })
        .expect(401);
      const unknownEmail = await http()
        .post('/auth/login')
        .send({ email: 'nobody@example.com', password: laura.password })
        .expect(401);

      expect(wrongPassword.body).toEqual({
        statusCode: 401,
        code: 'auth.invalidCredentials',
      });
      expect(unknownEmail.body).toEqual(wrongPassword.body);
    });
  });

  describe('POST /auth/refresh', () => {
    it('rotates the refresh token and detects replay', async () => {
      const { tokens } = await register();

      const rotated = await http()
        .post('/auth/refresh')
        .send({ refreshToken: tokens.refreshToken })
        .expect(200);
      const next = rotated.body as AuthTokens;
      expect(next.refreshToken).not.toBe(tokens.refreshToken);

      // Replaying the old token revokes the whole session, including the new token.
      await http()
        .post('/auth/refresh')
        .send({ refreshToken: tokens.refreshToken })
        .expect(401);
      await http()
        .post('/auth/refresh')
        .send({ refreshToken: next.refreshToken })
        .expect(401);
    });

    it('stores only token hashes', async () => {
      const { tokens } = await register();

      const rows = await t.prisma.refreshToken.findMany();
      expect(rows.map((r) => r.tokenHash)).not.toContain(tokens.refreshToken);
    });
  });

  describe('POST /auth/logout', () => {
    it('204 and the refresh token stops working', async () => {
      const { tokens } = await register();

      await http()
        .post('/auth/logout')
        .send({ refreshToken: tokens.refreshToken })
        .expect(204);
      await http()
        .post('/auth/refresh')
        .send({ refreshToken: tokens.refreshToken })
        .expect(401);
    });
  });

  describe('password reset', () => {
    it('202 with an empty body, whether the email exists or not', async () => {
      await register();

      const known = await http()
        .post('/auth/forgot-password')
        .send({ email: laura.email })
        .expect(202);
      const unknown = await http()
        .post('/auth/forgot-password')
        .send({ email: 'nobody@example.com' })
        .expect(202);

      expect(known.text).toBe(unknown.text);
      expect(t.mailer.passwordResets).toHaveLength(1);
    });

    it('resets the password once, and signs out every device', async () => {
      const { tokens } = await register();
      await http()
        .post('/auth/forgot-password')
        .send({ email: laura.email })
        .expect(202);
      const token = new URL(
        t.mailer.passwordResets[0]?.resetUrl ?? '',
      ).searchParams.get('token');

      await http()
        .post('/auth/reset-password')
        .send({ token, password: 'NewPassword1!' })
        .expect(204);

      await http()
        .post('/auth/login')
        .send({ email: laura.email, password: 'NewPassword1!' })
        .expect(200);
      await http()
        .post('/auth/refresh')
        .send({ refreshToken: tokens.refreshToken })
        .expect(401);
      const reused = await http()
        .post('/auth/reset-password')
        .send({ token, password: 'OtherPassword2!' })
        .expect(400);
      expect(reused.body.code).toBe('auth.invalidResetToken');
    });
  });

  describe('/users/me', () => {
    it('401 without a token', async () => {
      const res = await http().get('/users/me').expect(401);
      expect(res.body).toEqual({ statusCode: 401, code: 'auth.unauthorized' });
    });

    it('401 with a forged token', async () => {
      await http()
        .get('/users/me')
        .set('Authorization', 'Bearer forged.token.value')
        .expect(401);
    });

    it('returns only my profile', async () => {
      const me = await register();
      await register({
        ...laura,
        email: 'other@example.com',
        firstName: 'Other',
      });

      const res = await http()
        .get('/users/me')
        .set('Authorization', `Bearer ${me.tokens.accessToken}`)
        .expect(200);

      expect(res.body).toEqual(me.user);
    });

    it('PATCH updates allowed fields only', async () => {
      const me = await register();

      const res = await http()
        .patch('/users/me')
        .set('Authorization', `Bearer ${me.tokens.accessToken}`)
        .send({
          firstName: 'Lau',
          email: 'hacker@example.com',
          passwordHash: 'x',
        })
        .expect(200);

      expect(res.body).toMatchObject({ firstName: 'Lau', email: laura.email });
      const row = await t.prisma.user.findUniqueOrThrow({
        where: { id: me.user.id },
      });
      expect(row.passwordHash).toMatch(/^\$2b\$/);
    });
  });
});
