import type {
  AiCredits,
  ApiErrorBody,
  AuthSession,
  WardrobeItem,
  WardrobePhotoAnalysis,
} from '@klotho/shared';
import sharp from 'sharp';
import request from 'supertest';

import { createTestApp, type TestApp } from './utils/test-app';

function jpeg(width = 1600, height = 1200): Promise<Buffer> {
  return sharp({
    create: { width, height, channels: 3, background: '#F5EFE6' },
  })
    .jpeg()
    .toBuffer();
}

describe('AI photo analysis (e2e)', () => {
  let t: TestApp;
  let laura: string;
  let other: string;
  const http = () => request(t.app.getHttpServer());
  const as = (token: string) => ({ Authorization: `Bearer ${token}` });

  async function tokenFor(email: string): Promise<string> {
    const res = await http()
      .post('/auth/register')
      .send({ email, password: 'Dressing2026!', firstName: 'Test' })
      .expect(201);
    return (res.body as AuthSession).tokens.accessToken;
  }

  async function analyze(token: string, expected = 201) {
    return http()
      .post('/ai/wardrobe-photo?language=fr')
      .set(as(token))
      .attach('file', await jpeg(), 'photo.jpg')
      .expect(expected);
  }

  beforeAll(async () => {
    t = await createTestApp();
  });

  beforeEach(async () => {
    await t.reset();
    laura = await tokenFor('laura@example.com');
    other = await tokenFor('other@example.com');
  });

  afterAll(async () => {
    await t.app.close();
  });

  it('requires authentication', async () => {
    await http().get('/ai/credits').expect(401);
    await http().post('/ai/wardrobe-photo').expect(401);
  });

  it('proposes the attributes, then the photo is attached to the piece', async () => {
    const res = await analyze(laura);
    const { photo, suggestion, credits } = res.body as WardrobePhotoAnalysis;

    expect(suggestion).toMatchObject({
      name: 'Blouse romantique',
      category: 'TOP',
      primaryColor: 'white',
    });
    expect(credits).toEqual({ enabled: true, remaining: 1, quota: 2 });
    expect(photo).toMatchObject({ width: 1600, height: 1200 });
    // A smaller copy went to the AI.
    expect(t.analyzer.calls[0]).toMatchObject({
      language: 'fr',
      image: { width: 800, height: 600 },
    });

    const created = await http()
      .post('/wardrobe')
      .set(as(laura))
      .send({ category: 'TOP', primaryColor: 'white' })
      .expect(201);
    const item = created.body as WardrobeItem;
    const attached = await http()
      .post(`/wardrobe/${item.id}/photos`)
      .set(as(laura))
      .send({ key: photo.key })
      .expect(201);
    expect((attached.body as WardrobeItem).photos).toHaveLength(1);
  });

  it('counts the analyses of each user and stops at the quota', async () => {
    await analyze(laura);
    await analyze(laura);

    const refused = await analyze(laura, 402);
    expect((refused.body as ApiErrorBody).code).toBe('ai.quotaExceeded');
    expect(t.analyzer.calls).toHaveLength(2);

    const credits = await http().get('/ai/credits').set(as(laura)).expect(200);
    expect(credits.body as AiCredits).toEqual({
      enabled: true,
      remaining: 0,
      quota: 2,
    });
    const others = await http().get('/ai/credits').set(as(other)).expect(200);
    expect((others.body as AiCredits).remaining).toBe(2);
  });

  it('keeps the cost of every call', async () => {
    await analyze(laura);

    expect(
      await t.prisma.aiUsage.findMany({
        select: { feature: true, inputTokens: true, pool: true },
      }),
    ).toEqual([
      { feature: 'photoAnalysis', inputTokens: 900, pool: 'balance' },
    ]);
  });

  it('does not charge a photo without any piece', async () => {
    t.analyzer.answer = { isGarment: false, attributes: {} };

    const res = await analyze(laura, 422);

    expect((res.body as ApiErrorBody).code).toBe('ai.noGarment');
    const credits = await http().get('/ai/credits').set(as(laura)).expect(200);
    expect((credits.body as AiCredits).remaining).toBe(2);
    expect(t.storage.files.size).toBe(0);
  });

  it('says when the AI is down', async () => {
    t.analyzer.failing = true;

    const res = await analyze(laura, 503);

    expect((res.body as ApiErrorBody).code).toBe('ai.unavailable');
  });

  it('needs a picture', async () => {
    const missing = await http()
      .post('/ai/wardrobe-photo')
      .set(as(laura))
      .expect(400);
    expect((missing.body as ApiErrorBody).code).toBe('uploads.missingFile');

    const notImage = await http()
      .post('/ai/wardrobe-photo')
      .set(as(laura))
      .attach('file', Buffer.from('%PDF-1.4'), 'photo.jpg')
      .expect(415);
    expect((notImage.body as ApiErrorBody).code).toBe('uploads.invalidImage');
    expect(t.analyzer.calls).toHaveLength(0);
  });

  it('forgets the analyses with the account', async () => {
    await analyze(laura);

    await http()
      .delete('/users/me')
      .set(as(laura))
      .send({ password: 'Dressing2026!' })
      .expect(204);

    expect(await t.prisma.aiUsage.count()).toBe(0);
  });
});
