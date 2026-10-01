import type {
  ApiErrorBody,
  AuthSession,
  Outfit,
  UploadedPhoto,
  WardrobeItem,
} from '@klotho/shared';
import sharp from 'sharp';
import request from 'supertest';

import { createTestApp, type TestApp } from './utils/test-app';

const PASSWORD = 'Dressing2026!';

describe('Account deletion (e2e)', () => {
  let t: TestApp;
  let laura: AuthSession;
  let other: AuthSession;
  let picture: Buffer;
  const http = () => request(t.app.getHttpServer());
  const as = (session: AuthSession) => ({
    Authorization: `Bearer ${session.tokens.accessToken}`,
  });

  async function register(email: string): Promise<AuthSession> {
    const res = await http()
      .post('/auth/register')
      .send({ email, password: PASSWORD, firstName: 'Test' })
      .expect(201);
    return res.body as AuthSession;
  }

  async function upload(session: AuthSession): Promise<UploadedPhoto> {
    const res = await http()
      .post('/uploads/wardrobe')
      .set(as(session))
      .attach('file', picture, 'photo.jpg')
      .expect(201);
    return res.body as UploadedPhoto;
  }

  /** Something in every table: profile, settings, pieces, photos, a liked, favourite, worn look… */
  async function fillAccount(session: AuthSession, photos: number) {
    await http()
      .put('/preferences/me')
      .set(as(session))
      .send({ preferredStyles: ['casual'] })
      .expect(200);
    await http()
      .put('/weather/settings')
      .set(as(session))
      .send({ temperatureUnit: 'fahrenheit' })
      .expect(200);
    const piece = async (category: string) =>
      (
        await http()
          .post('/wardrobe')
          .set(as(session))
          .send({ category, primaryColor: 'ecru' })
          .expect(201)
      ).body as WardrobeItem;
    const top = await piece('TOP');
    await piece('BOTTOM');
    await piece('SHOES');

    for (let i = 0; i < photos; i++) {
      const { key } = await upload(session);
      await http()
        .post(`/wardrobe/${top.id}/photos`)
        .set(as(session))
        .send({ key })
        .expect(201);
    }
    // An upload never attached to a piece.
    await upload(session);

    const [look] = (
      await http()
        .post('/outfits/generate')
        .set(as(session))
        .send({ temperature: 18 })
        .expect(201)
    ).body as Outfit[];
    await http()
      .post(`/outfits/${look!.id}/favorite`)
      .set(as(session))
      .expect(200);
    await http()
      .post(`/outfits/${look!.id}/feedback`)
      .set(as(session))
      .send({ rating: 'like' })
      .expect(200);
    await http()
      .post(`/outfits/${look!.id}/wear`)
      .set(as(session))
      .send({ wornOn: '2026-10-01' })
      .expect(200);
    await http()
      .post('/auth/forgot-password')
      .send({ email: session.user.email })
      .expect(202);
  }

  /** Rows of every table belonging to a user. */
  async function rowsOf(userId: string) {
    const p = t.prisma;
    const where = { userId };
    return {
      users: await p.user.count({ where: { id: userId } }),
      refreshTokens: await p.refreshToken.count({ where }),
      resetTokens: await p.passwordResetToken.count({ where }),
      items: await p.wardrobeItem.count({ where }),
      photos: await p.wardrobeItemPhoto.count({ where: { item: where } }),
      profile: await p.styleProfile.count({ where }),
      weather: await p.weatherSettings.count({ where }),
      outfits: await p.outfit.count({ where }),
      outfitItems: await p.outfitItem.count({ where: { outfit: where } }),
      feedback: await p.outfitFeedback.count({ where }),
      wears: await p.outfitWear.count({ where }),
    };
  }

  const filesOf = (userId: string) =>
    [...t.storage.files.keys()].filter((key) =>
      key.startsWith(`users/${userId}/`),
    );

  const deleteAccount = (session: AuthSession, password = PASSWORD) =>
    http().delete('/users/me').set(as(session)).send({ password });

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
    other = await register('other@example.com');
    await fillAccount(laura, 2);
    await fillAccount(other, 1);
  });

  afterAll(async () => {
    await t.app.close();
  });

  it('requires authentication', async () => {
    await http().delete('/users/me').send({ password: PASSWORD }).expect(401);
  });

  it('validates the body', async () => {
    const res = await http()
      .delete('/users/me')
      .set(as(laura))
      .send({})
      .expect(400);
    expect((res.body as ApiErrorBody).code).toBe('validation.failed');
  });

  it('refuses a wrong password with 403 users.invalidPassword and keeps everything', async () => {
    const before = await rowsOf(laura.user.id);

    const res = await deleteAccount(laura, 'Wrong2026!').expect(403);

    expect(res.body).toEqual({
      statusCode: 403,
      code: 'users.invalidPassword',
    });
    expect(await rowsOf(laura.user.id)).toEqual(before);
    expect(filesOf(laura.user.id)).toHaveLength(3);
    expect(t.storage.deleted).toEqual([]);
  });

  it('deletes the account, all its data and its files, and nothing else', async () => {
    const before = await rowsOf(laura.user.id);
    expect(Object.values(before).every((count) => count > 0)).toBe(true);
    const otherBefore = await rowsOf(other.user.id);
    const lauraFiles = filesOf(laura.user.id);
    const otherFiles = filesOf(other.user.id);
    expect(lauraFiles).toHaveLength(3); // 2 photos + 1 upload never attached

    await deleteAccount(laura).expect(204);

    expect(Object.values(await rowsOf(laura.user.id))).toEqual(
      Object.values(before).map(() => 0),
    );
    expect(t.storage.deleted).toEqual(expect.arrayContaining(lauraFiles));
    expect(filesOf(laura.user.id)).toEqual([]);

    expect(await rowsOf(other.user.id)).toEqual(otherBefore);
    expect(filesOf(other.user.id)).toEqual(otherFiles);
  });

  it('closes every session: no login, no refresh, no data', async () => {
    await deleteAccount(laura).expect(204);

    await http()
      .post('/auth/login')
      .send({ email: 'laura@example.com', password: PASSWORD })
      .expect(401);
    await http()
      .post('/auth/refresh')
      .send({ refreshToken: laura.tokens.refreshToken })
      .expect(401);
    // The access token is still signed until it expires, but refused.
    await http().get('/users/me').set(as(laura)).expect(401);
    await http().get('/wardrobe').set(as(laura)).expect(401);
    await http()
      .post('/uploads/wardrobe')
      .set(as(laura))
      .attach('file', picture, 'photo.jpg')
      .expect(401);
    await deleteAccount(laura).expect(401);

    // The email address is free again.
    await register('laura@example.com');
  });

  it('deletes the account even when the storage is down', async () => {
    t.storage.failing = true;

    await deleteAccount(laura).expect(204);

    expect((await rowsOf(laura.user.id)).users).toBe(0);
  });
});
