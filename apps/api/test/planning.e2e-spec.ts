import type { AuthSession, DayNote, Outfit, OutfitPlan } from '@klotho/shared';
import request from 'supertest';

import { LYON } from '../src/testing/weather-fakes';
import { createTestApp, type TestApp } from './utils/test-app';

describe('Planning (e2e)', () => {
  let t: TestApp;
  let laura: string;
  let other: string;
  let looks: Outfit[];
  const http = () => request(t.app.getHttpServer());
  const as = (token: string) => ({ Authorization: `Bearer ${token}` });

  async function tokenFor(email: string): Promise<string> {
    const res = await http()
      .post('/auth/register')
      .send({ email, password: 'Dressing2026!', firstName: 'Test' })
      .expect(201);
    return (res.body as AuthSession).tokens.accessToken;
  }

  /** 3 tops, 3 bottoms, 2 dresses, 3 shoes. */
  async function wardrobe(token: string) {
    const pieces = [
      ['TOP', 'Blouse'],
      ['TOP', 'T-shirt'],
      ['TOP', 'Chemise'],
      ['BOTTOM', 'Jean'],
      ['BOTTOM', 'Jupe'],
      ['BOTTOM', 'Pantalon'],
      ['DRESS', 'Robe'],
      ['DRESS', 'Robe noire'],
      ['SHOES', 'Baskets'],
      ['SHOES', 'Ballerines'],
      ['SHOES', 'Mocassins'],
    ];
    for (const [category, name] of pieces)
      await http()
        .post('/wardrobe')
        .set(as(token))
        .send({ category, name, primaryColor: 'ecru' })
        .expect(201);
  }

  const plan = (token: string, day: string, outfitId: string) =>
    http().put(`/plans/${day}`).set(as(token)).send({ outfitId });

  async function calendar(from = '2026-10-01', to = '2026-10-31') {
    const res = await http()
      .get(`/plans?from=${from}&to=${to}`)
      .set(as(laura))
      .expect(200);
    return res.body as OutfitPlan[];
  }

  beforeAll(async () => {
    t = await createTestApp();
  });

  beforeEach(async () => {
    await t.reset();
    laura = await tokenFor('laura@example.com');
    other = await tokenFor('other@example.com');
    await wardrobe(laura);
    const res = await http()
      .post('/outfits/generate')
      .set(as(laura))
      .send({ temperature: 18, style: 'casual', occasion: 'work' })
      .expect(201);
    looks = res.body as Outfit[];
  });

  afterAll(async () => {
    await t.app.close();
  });

  describe('PUT /plans/:day and GET /plans', () => {
    it("plans looks with the saved city's forecast, listed by day", async () => {
      await http()
        .put('/weather/settings')
        .set(as(laura))
        .send({ locationMode: 'city', city: LYON })
        .expect(200);

      const res = await plan(laura, '2026-10-02', looks[0]!.id).expect(200);
      await plan(laura, '2026-10-20', looks[1]!.id).expect(200);
      await plan(laura, '2026-09-30', looks[2]!.id).expect(200);

      expect(res.body).toEqual({
        id: expect.any(String),
        day: '2026-10-02',
        outfit: looks[0],
        forecast: { temperature: 14, condition: 'rain' },
      });
      const plans = await calendar();
      expect(plans.map((p) => [p.day, p.outfit.id, p.forecast])).toEqual([
        ['2026-10-02', looks[0]!.id, { temperature: 14, condition: 'rain' }],
        // Beyond the 5-day forecast.
        ['2026-10-20', looks[1]!.id, null],
      ]);
      expect(t.weather.forecastCalls[0]).toEqual({
        latitude: 45.76,
        longitude: 4.84,
      });
    });

    it('replaces the plan of the day', async () => {
      await plan(laura, '2026-10-02', looks[0]!.id).expect(200);
      await plan(laura, '2026-10-02', looks[1]!.id).expect(200);

      expect((await calendar()).map((p) => p.outfit.id)).toEqual([
        looks[1]!.id,
      ]);
    });

    it('still plans when the weather is unavailable, or without a city', async () => {
      const none = await plan(laura, '2026-10-02', looks[0]!.id).expect(200);
      expect((none.body as OutfitPlan).forecast).toBeNull();
      await http()
        .put('/weather/settings')
        .set(as(laura))
        .send({ locationMode: 'city', city: LYON })
        .expect(200);
      t.weather.failing = true;
      const res = await plan(laura, '2026-10-03', looks[0]!.id).expect(200);

      expect((res.body as OutfitPlan).forecast).toBeNull();
    });

    it("refuses an invalid day and another user's look", async () => {
      const invalid = await plan(laura, '2026-02-31', looks[0]!.id).expect(400);
      expect(invalid.body).toMatchObject({ code: 'validation.failed' });

      const res = await plan(other, '2026-10-02', looks[0]!.id).expect(404);
      expect(res.body).toEqual({ statusCode: 404, code: 'outfits.notFound' });
      await http()
        .get('/plans?from=2026-01-01&to=2026-06-01')
        .set(as(laura))
        .expect(400);
    });

    it("never shows another user's plans", async () => {
      await plan(laura, '2026-10-02', looks[0]!.id).expect(200);

      const res = await http()
        .get('/plans?from=2026-10-01&to=2026-10-31')
        .set(as(other))
        .expect(200);
      expect(res.body).toEqual([]);
    });
  });

  describe('DELETE /plans/:day', () => {
    it('removes the plan, idempotently, and keeps the look', async () => {
      await plan(laura, '2026-10-02', looks[0]!.id).expect(200);

      await http().delete('/plans/2026-10-02').set(as(laura)).expect(204);
      await http().delete('/plans/2026-10-02').set(as(laura)).expect(204);

      expect(await calendar()).toEqual([]);
      await http().get(`/outfits/${looks[0]!.id}`).set(as(laura)).expect(200);
    });
  });

  describe('POST /plans/:day/move', () => {
    it('moves to a free day, or swaps with the planned look', async () => {
      await plan(laura, '2026-10-02', looks[0]!.id).expect(200);
      await plan(laura, '2026-10-04', looks[1]!.id).expect(200);

      const moved = await http()
        .post('/plans/2026-10-02/move')
        .set(as(laura))
        .send({ toDay: '2026-10-03' })
        .expect(200);
      expect(
        (moved.body as OutfitPlan[]).map((p) => [p.day, p.outfit.id]),
      ).toEqual([['2026-10-03', looks[0]!.id]]);

      const swapped = await http()
        .post('/plans/2026-10-03/move')
        .set(as(laura))
        .send({ toDay: '2026-10-04' })
        .expect(200);
      expect(
        (swapped.body as OutfitPlan[]).map((p) => [p.day, p.outfit.id]),
      ).toEqual([
        ['2026-10-04', looks[0]!.id],
        ['2026-10-03', looks[1]!.id],
      ]);
      expect((await calendar()).map((p) => [p.day, p.outfit.id])).toEqual([
        ['2026-10-03', looks[1]!.id],
        ['2026-10-04', looks[0]!.id],
      ]);
    });

    it('answers 404 plans.notFound without a plan that day', async () => {
      await plan(laura, '2026-10-02', looks[0]!.id).expect(200);

      for (const token of [laura, other]) {
        const res = await http()
          .post(`/plans/${token === laura ? '2026-10-05' : '2026-10-02'}/move`)
          .set(as(token))
          .send({ toDay: '2026-10-06' })
          .expect(404);
        expect(res.body).toEqual({ statusCode: 404, code: 'plans.notFound' });
      }
    });
  });

  describe('POST /plans/:day/regenerate', () => {
    it('plans a new look with the same style and occasion', async () => {
      await plan(laura, '2026-10-02', looks[0]!.id).expect(200);

      const res = await http()
        .post('/plans/2026-10-02/regenerate')
        .set(as(laura))
        .expect(200);

      const regenerated = res.body as OutfitPlan;
      expect(regenerated.day).toBe('2026-10-02');
      expect(regenerated.outfit.id).not.toBe(looks[0]!.id);
      expect(regenerated.outfit).toMatchObject({
        style: 'casual',
        occasion: 'work',
      });
      expect((await calendar())[0]!.outfit.id).toBe(regenerated.outfit.id);
    });

    it('answers 404 plans.notFound without a plan that day', async () => {
      const res = await http()
        .post('/plans/2026-10-02/regenerate')
        .set(as(laura))
        .expect(404);
      expect(res.body).toEqual({ statusCode: 404, code: 'plans.notFound' });
    });
  });

  describe('POST /plans/week', () => {
    // A Monday far enough to be in the future whenever the tests run.
    const monday = '2030-01-07';

    it('plans every free day until Sunday with different looks', async () => {
      await plan(laura, '2030-01-09', looks[0]!.id).expect(200);

      const res = await http()
        .post('/plans/week')
        .set(as(laura))
        .send({ from: monday, occasion: 'work' })
        .expect(200);

      const created = res.body as OutfitPlan[];
      expect(created.map((p) => p.day)).toEqual([
        '2030-01-07',
        '2030-01-08',
        '2030-01-10',
        '2030-01-11',
        '2030-01-12',
        '2030-01-13',
      ]);
      const ids = created.map((p) => p.outfit.id);
      expect(new Set([...ids, looks[0]!.id]).size).toBe(7);
      expect(created[0]!.outfit.occasion).toBe('work');
      expect(await calendar('2030-01-01', '2030-01-31')).toHaveLength(7);

      const again = await http()
        .post('/plans/week')
        .set(as(laura))
        .send({ from: monday })
        .expect(200);
      expect(again.body).toEqual([]);
    });

    it('refuses a past day', async () => {
      const res = await http()
        .post('/plans/week')
        .set(as(laura))
        .send({ from: '2020-01-06' })
        .expect(400);
      expect(res.body).toEqual({ statusCode: 400, code: 'plans.pastDay' });
    });

    it('answers 422 when no day can be planned', async () => {
      const res = await http()
        .post('/plans/week')
        .set(as(other))
        .send({ from: monday })
        .expect(422);
      expect(res.body).toEqual({
        statusCode: 422,
        code: 'outfits.noOutfitPossible',
      });
    });
  });

  describe('/days/:day/note', () => {
    const note = (token: string, text: string | null) =>
      http().put('/days/2026-10-02/note').set(as(token)).send({ text });
    const read = async (token = laura) =>
      (await http().get('/days/2026-10-02/note').set(as(token)).expect(200))
        .body as DayNote;

    it('saves, replaces and removes the note of a day', async () => {
      await expect(read()).resolves.toEqual({ day: '2026-10-02', text: null });

      await note(laura, ' Dîner chez Léa ').expect(200, {
        day: '2026-10-02',
        text: 'Dîner chez Léa',
      });
      await note(laura, 'Entretien').expect(200);
      await expect(read()).resolves.toEqual({
        day: '2026-10-02',
        text: 'Entretien',
      });
      await expect(read(other)).resolves.toMatchObject({ text: null });

      await note(laura, '').expect(200, { day: '2026-10-02', text: null });
      await expect(read()).resolves.toMatchObject({ text: null });
    });

    it('bounds the note and validates the day', async () => {
      await note(laura, 'a'.repeat(501)).expect(400);
      await http().get('/days/02-10-2026/note').set(as(laura)).expect(400);
    });
  });

  describe('DELETE /outfits/:id', () => {
    it('removes a look never worn, with its plans', async () => {
      await plan(laura, '2026-10-02', looks[0]!.id).expect(200);

      await http()
        .delete(`/outfits/${looks[0]!.id}`)
        .set(as(laura))
        .expect(204);

      await http().get(`/outfits/${looks[0]!.id}`).set(as(laura)).expect(404);
      expect(await calendar()).toEqual([]);
    });

    it('keeps a worn look (409 outfits.worn)', async () => {
      await http()
        .post(`/outfits/${looks[0]!.id}/wear`)
        .set(as(laura))
        .send({ wornOn: '2026-09-30' })
        .expect(200);

      const res = await http()
        .delete(`/outfits/${looks[0]!.id}`)
        .set(as(laura))
        .expect(409);
      expect(res.body).toEqual({ statusCode: 409, code: 'outfits.worn' });
    });

    it("answers 404 for another user's look", async () => {
      const res = await http()
        .delete(`/outfits/${looks[0]!.id}`)
        .set(as(other))
        .expect(404);
      expect(res.body).toEqual({ statusCode: 404, code: 'outfits.notFound' });
    });
  });
});
