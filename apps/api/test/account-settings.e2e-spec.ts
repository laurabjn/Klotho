import type {
  ApiErrorBody,
  AuthSession,
  UploadedPhoto,
  UserProfile,
  WardrobeItem,
} from '@klotho/shared';
import sharp from 'sharp';
import request from 'supertest';

import { createTestApp, type TestApp } from './utils/test-app';

const PASSWORD = 'Dressing2026!';
const NEW_PASSWORD = 'NewDressing2026!';
const NEW_EMAIL = 'laura.new@example.com';

describe('Account settings (e2e)', () => {
  let t: TestApp;
  let laura: AuthSession;
  let picture: Buffer;
  const http = () => request(t.app.getHttpServer());
  const as = (session: AuthSession) => ({
    Authorization: `Bearer ${session.tokens.accessToken}`,
  });

  async function register(email: string): Promise<AuthSession> {
    const res = await http()
      .post('/auth/register')
      .send({ email, password: PASSWORD, firstName: 'Laura' })
      .expect(201);
    return res.body as AuthSession;
  }

  async function upload(session: AuthSession): Promise<string> {
    const res = await http()
      .post('/uploads/wardrobe')
      .set(as(session))
      .attach('file', picture, 'photo.jpg')
      .expect(201);
    return (res.body as UploadedPhoto).key;
  }

  const me = async (session: AuthSession) =>
    (await http().get('/users/me').set(as(session)).expect(200))
      .body as UserProfile;

  beforeAll(async () => {
    t = await createTestApp();
    picture = await sharp({
      create: { width: 40, height: 40, channels: 3, background: '#EFCDC4' },
    })
      .jpeg()
      .toBuffer();
  });

  beforeEach(async () => {
    await t.reset();
    laura = await register('laura@example.com');
  });

  afterAll(async () => {
    await t.app.close();
  });

  describe('profile', () => {
    it('a new profile has no bio, photo nor pending e-mail', () => {
      expect(laura.user).toEqual({
        id: expect.any(String),
        email: 'laura@example.com',
        firstName: 'Laura',
        bio: null,
        avatarUrl: null,
        pendingEmail: null,
        createdAt: expect.any(String),
      });
    });

    it('PATCH /users/me updates the bio; an empty text removes it', async () => {
      const res = await http()
        .patch('/users/me')
        .set(as(laura))
        .send({ bio: '  Rétro chic  ' })
        .expect(200);
      expect((res.body as UserProfile).bio).toBe('Rétro chic');
      expect((await me(laura)).bio).toBe('Rétro chic');

      const cleared = await http()
        .patch('/users/me')
        .set(as(laura))
        .send({ bio: '' })
        .expect(200);
      expect((cleared.body as UserProfile).bio).toBeNull();
    });

    it('400 errors.bio.tooLong beyond 200 characters', async () => {
      const res = await http()
        .patch('/users/me')
        .set(as(laura))
        .send({ bio: 'a'.repeat(201) })
        .expect(400);
      expect((res.body as ApiErrorBody).issues).toEqual([
        { path: 'bio', message: 'errors.bio.tooLong' },
      ]);
    });
  });

  describe('profile photo', () => {
    it('PUT /users/me/avatar sets an upload as photo, with a signed link', async () => {
      const key = await upload(laura);

      const res = await http()
        .put('/users/me/avatar')
        .set(as(laura))
        .send({ key })
        .expect(200);

      const profile = res.body as UserProfile;
      expect(profile.avatarUrl).toBe(
        `https://storage.test/${key}?signature=fake`,
      );
      expect((await me(laura)).avatarUrl).toBe(profile.avatarUrl);
      // The login answer shows it too.
      const login = await http()
        .post('/auth/login')
        .send({ email: 'laura@example.com', password: PASSWORD })
        .expect(200);
      expect((login.body as AuthSession).user.avatarUrl).toBe(
        profile.avatarUrl,
      );
    });

    it('replacing the photo deletes the previous file', async () => {
      const first = await upload(laura);
      const second = await upload(laura);
      await http()
        .put('/users/me/avatar')
        .set(as(laura))
        .send({ key: first })
        .expect(200);

      await http()
        .put('/users/me/avatar')
        .set(as(laura))
        .send({ key: second })
        .expect(200);

      expect(t.storage.deleted).toEqual([first]);
      expect(t.storage.files.has(second)).toBe(true);
    });

    it('400 users.invalidAvatar for another user’s upload, an unknown key or a piece photo', async () => {
      const other = await register('other@example.com');
      const otherKey = await upload(other);
      const piece = (
        await http()
          .post('/wardrobe')
          .set(as(laura))
          .send({ category: 'TOP', primaryColor: 'ecru' })
          .expect(201)
      ).body as WardrobeItem;
      const pieceKey = await upload(laura);
      await http()
        .post(`/wardrobe/${piece.id}/photos`)
        .set(as(laura))
        .send({ key: pieceKey })
        .expect(201);

      for (const key of [otherKey, 'users/whatever.jpg', pieceKey]) {
        const res = await http()
          .put('/users/me/avatar')
          .set(as(laura))
          .send({ key })
          .expect(400);
        expect(res.body).toEqual({
          statusCode: 400,
          code: 'users.invalidAvatar',
        });
      }
      expect((await me(laura)).avatarUrl).toBeNull();
      expect(t.storage.deleted).toEqual([]);
    });

    it('DELETE /users/me/avatar removes the photo and its file (idempotent)', async () => {
      const key = await upload(laura);
      await http()
        .put('/users/me/avatar')
        .set(as(laura))
        .send({ key })
        .expect(200);

      const res = await http()
        .delete('/users/me/avatar')
        .set(as(laura))
        .expect(200);

      expect((res.body as UserProfile).avatarUrl).toBeNull();
      expect(t.storage.files.has(key)).toBe(false);
      await http().delete('/users/me/avatar').set(as(laura)).expect(200);
    });

    it('deleting the account deletes the photo file', async () => {
      const key = await upload(laura);
      await http()
        .put('/users/me/avatar')
        .set(as(laura))
        .send({ key })
        .expect(200);

      await http()
        .delete('/users/me')
        .set(as(laura))
        .send({ password: PASSWORD })
        .expect(204);

      expect(t.storage.files.has(key)).toBe(false);
    });
  });

  describe('POST /users/me/password', () => {
    const changePassword = (session: AuthSession, currentPassword = PASSWORD) =>
      http()
        .post('/users/me/password')
        .set(as(session))
        .send({ currentPassword, newPassword: NEW_PASSWORD });

    it('answers a fresh session and signs out every other device', async () => {
      const otherDevice = (
        await http()
          .post('/auth/login')
          .send({ email: 'laura@example.com', password: PASSWORD })
          .expect(200)
      ).body as AuthSession;

      const res = await changePassword(laura).expect(200);
      const session = res.body as AuthSession;

      expect(session).toEqual({
        user: laura.user,
        tokens: {
          accessToken: expect.any(String),
          accessTokenExpiresIn: expect.any(Number),
          refreshToken: expect.any(String),
        },
      });
      for (const old of [laura, otherDevice]) {
        await http()
          .post('/auth/refresh')
          .send({ refreshToken: old.tokens.refreshToken })
          .expect(401);
      }
      await http()
        .post('/auth/refresh')
        .send({ refreshToken: session.tokens.refreshToken })
        .expect(200);
      await http().get('/users/me').set(as(session)).expect(200);
    });

    it('the new password works, the old one no longer does', async () => {
      await changePassword(laura).expect(200);

      await http()
        .post('/auth/login')
        .send({ email: 'laura@example.com', password: NEW_PASSWORD })
        .expect(200);
      await http()
        .post('/auth/login')
        .send({ email: 'laura@example.com', password: PASSWORD })
        .expect(401);
    });

    it('403 users.invalidPassword with a wrong current password', async () => {
      const res = await changePassword(laura, 'Wrong2026!').expect(403);

      expect(res.body).toEqual({
        statusCode: 403,
        code: 'users.invalidPassword',
      });
      await http()
        .post('/auth/refresh')
        .send({ refreshToken: laura.tokens.refreshToken })
        .expect(200);
    });

    it('400 when the new password breaks the policy', async () => {
      const res = await http()
        .post('/users/me/password')
        .set(as(laura))
        .send({ currentPassword: PASSWORD, newPassword: 'short' })
        .expect(400);
      expect((res.body as ApiErrorBody).code).toBe('validation.failed');
    });
  });

  describe('e-mail change', () => {
    const requestChange = (newEmail = NEW_EMAIL, password = PASSWORD) =>
      http()
        .post('/users/me/email')
        .set(as(laura))
        .send({ newEmail, password });

    const lastToken = () =>
      new URL(t.mailer.emailChanges.at(-1)?.confirmUrl ?? '').searchParams.get(
        'token',
      ) ?? '';

    const confirm = (token: string) =>
      http().post('/auth/confirm-email').send({ token });

    it('202, sends the link to the new address and shows the pending address', async () => {
      const res = await requestChange(' Laura.New@Example.com').expect(202);

      expect(res.body).toEqual({ pendingEmail: NEW_EMAIL });
      expect(t.mailer.emailChanges).toEqual([
        {
          to: NEW_EMAIL,
          firstName: 'Laura',
          confirmUrl: expect.stringMatching(
            /^klotho:\/\/confirm-email\?token=/,
          ),
        },
      ]);
      expect(await me(laura)).toMatchObject({
        email: 'laura@example.com',
        pendingEmail: NEW_EMAIL,
      });
      // Only the hash of the token is stored.
      const row = await t.prisma.emailChangeToken.findFirstOrThrow();
      expect(row.tokenHash).not.toBe(lastToken());
    });

    it('confirming (signed out) changes the address; the link is single-use', async () => {
      await requestChange().expect(202);
      const token = lastToken();

      const res = await confirm(token).expect(200);

      expect(res.body).toEqual({ email: NEW_EMAIL });
      expect(await me(laura)).toMatchObject({
        email: NEW_EMAIL,
        pendingEmail: null,
      });
      await http()
        .post('/auth/login')
        .send({ email: NEW_EMAIL, password: PASSWORD })
        .expect(200);
      const reused = await confirm(token).expect(400);
      expect(reused.body).toEqual({
        statusCode: 400,
        code: 'auth.invalidEmailToken',
      });
      expect(await t.prisma.emailChangeToken.count()).toBe(0);
    });

    it('a new request replaces the previous link', async () => {
      await requestChange().expect(202);
      const first = lastToken();
      await requestChange('other.new@example.com').expect(202);

      await confirm(first).expect(400);
      await confirm(lastToken()).expect(200);
      expect((await me(laura)).email).toBe('other.new@example.com');
    });

    it('400 auth.invalidEmailToken for an unknown token', async () => {
      const res = await confirm('forged').expect(400);
      expect((res.body as ApiErrorBody).code).toBe('auth.invalidEmailToken');
    });

    it('403 users.invalidPassword with a wrong password', async () => {
      const res = await requestChange(NEW_EMAIL, 'Wrong2026!').expect(403);
      expect((res.body as ApiErrorBody).code).toBe('users.invalidPassword');
      expect(t.mailer.emailChanges).toEqual([]);
    });

    it('400 users.sameEmail for the current address', async () => {
      const res = await requestChange('LAURA@example.com').expect(400);
      expect(res.body).toEqual({ statusCode: 400, code: 'users.sameEmail' });
    });

    it('409 auth.emailAlreadyUsed for an address of another account', async () => {
      await register(NEW_EMAIL);

      const res = await requestChange().expect(409);
      expect((res.body as ApiErrorBody).code).toBe('auth.emailAlreadyUsed');
    });

    it('409 auth.emailAlreadyUsed when another account took it before the confirmation', async () => {
      await requestChange().expect(202);
      const token = lastToken();
      await register(NEW_EMAIL);

      const res = await confirm(token).expect(409);
      expect((res.body as ApiErrorBody).code).toBe('auth.emailAlreadyUsed');
      expect((await me(laura)).email).toBe('laura@example.com');
    });
  });
});
