import type { AuthSession, Outfit } from '@klotho/shared';
import request from 'supertest';

import {
  KPI_SOURCE,
  type KpiSource,
} from '../src/domain/analytics/ports/kpi-source';
import { createTestApp, type TestApp } from './utils/test-app';

describe('KPI source (e2e)', () => {
  let t: TestApp;
  const http = () => request(t.app.getHttpServer());

  beforeAll(async () => {
    t = await createTestApp();
    await t.reset();
  });

  afterAll(async () => {
    await t.app.close();
  });

  it('counts users, first looks, opinions, wears and favourites', async () => {
    const sessions: AuthSession[] = [];
    for (const email of ['a@example.com', 'b@example.com', 'c@example.com']) {
      sessions.push(
        (
          await http()
            .post('/auth/register')
            .send({ email, password: 'Dressing2026!', firstName: 'Test' })
            .expect(201)
        ).body as AuthSession,
      );
    }
    const auth = {
      Authorization: `Bearer ${sessions[0]!.tokens.accessToken}`,
    };
    for (const category of ['TOP', 'TOP', 'BOTTOM', 'BOTTOM', 'SHOES']) {
      await http()
        .post('/wardrobe')
        .set(auth)
        .send({ category, primaryColor: 'ecru' })
        .expect(201);
    }
    const looks = (
      await http()
        .post('/outfits/generate')
        .set(auth)
        .send({ temperature: 18 })
        .expect(201)
    ).body as Outfit[];
    const [first, second, third] = looks as [Outfit, Outfit, Outfit];
    await http()
      .post(`/outfits/${first.id}/feedback`)
      .set(auth)
      .send({ rating: 'like' })
      .expect(200);
    await http()
      .post(`/outfits/${second.id}/feedback`)
      .set(auth)
      .send({ rating: 'like' })
      .expect(200);
    await http()
      .post(`/outfits/${third.id}/feedback`)
      .set(auth)
      .send({ rating: 'dislike' })
      .expect(200);
    await http().post(`/outfits/${first.id}/favorite`).set(auth).expect(200);
    for (const wornOn of ['2026-09-30', '2026-09-10', '2026-06-01']) {
      await http()
        .post(`/outfits/${first.id}/wear`)
        .set(auth)
        .send({ wornOn })
        .expect(200);
    }

    const facts = await t.app
      .get<KpiSource>(KPI_SOURCE)
      .collect(new Date('2026-10-01T12:00:00Z'));

    expect(facts).toEqual({
      users: 3,
      firstGenerationDelaysMs: [expect.any(Number)],
      looksGenerated: looks.length,
      likes: 2,
      dislikes: 1,
      wears: { total: 3, last7Days: 1, last30Days: 2 },
      favoriteLooks: 1,
      favoritePieces: 0,
    });
    expect(facts.firstGenerationDelaysMs[0]).toBeGreaterThanOrEqual(0);
    expect(facts.firstGenerationDelaysMs[0]).toBeLessThan(60_000);
  });
});
