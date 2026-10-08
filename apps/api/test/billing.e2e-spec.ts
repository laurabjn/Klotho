import type { ApiErrorBody, AuthSession, BillingStatus } from '@klotho/shared';
import request from 'supertest';

import { createTestApp, type TestApp } from './utils/test-app';

const PIECE = { category: 'TOP', primaryColor: 'white' };
const GENERATE = {
  style: null,
  occasion: 'everyday',
  temperature: 18,
  condition: 'clear',
};
const WEBHOOK = 'Bearer e2e-webhook-secret';

describe('Billing (e2e)', () => {
  let t: TestApp;
  let laura: string;
  let lauraId: string;
  const http = () => request(t.app.getHttpServer());
  const as = (token: string) => ({ Authorization: `Bearer ${token}` });

  async function register(email: string): Promise<AuthSession> {
    const res = await http()
      .post('/auth/register')
      .send({ email, password: 'Dressing2026!', firstName: 'Test' })
      .expect(201);
    return res.body as AuthSession;
  }

  async function status(token = laura): Promise<BillingStatus> {
    const res = await http().get('/billing/status').set(as(token)).expect(200);
    return res.body as BillingStatus;
  }

  beforeAll(async () => {
    t = await createTestApp({
      billing: {
        enabled: true,
        free: { pieces: 3, generationsPerWeek: 1, historyDays: 7 },
        premiumMonthlyAnalyses: 25,
        foundersUntil: null,
        unlimitedEmails: [],
      },
    });
  });

  beforeEach(async () => {
    await t.reset();
    const session = await register('laura@example.com');
    laura = session.tokens.accessToken;
    lauraId = session.user.id;
  });

  afterAll(async () => {
    await t.app.close();
  });

  it('requires authentication, except for the webhook', async () => {
    await http().get('/billing/status').expect(401);
    await http().post('/billing/sync').expect(401);
    await http().post('/billing/revenuecat').send({}).expect(401);
  });

  it('starts on the free plan, with its limits', async () => {
    expect(await status()).toEqual({
      enabled: true,
      plan: 'free',
      expiresAt: null,
      limits: { pieces: 3, generationsPerWeek: 1, historyDays: 7 },
      usage: { pieces: 0, generationsThisWeek: 0 },
      credits: { enabled: true, remaining: 2, quota: 2 },
      offer: {
        free: { pieces: 3, generationsPerWeek: 1, historyDays: 7 },
        freeAnalyses: 2,
        premiumMonthlyAnalyses: 25,
        foundersOnSale: true,
        foundersUntil: null,
      },
    });
  });

  it('stops at the free number of pieces', async () => {
    for (let i = 0; i < 3; i += 1)
      await http().post('/wardrobe').set(as(laura)).send(PIECE).expect(201);

    const res = await http()
      .post('/wardrobe')
      .set(as(laura))
      .send(PIECE)
      .expect(402);
    expect((res.body as ApiErrorBody).code).toBe('billing.pieceLimit');
  });

  it('stops at the free number of generations', async () => {
    for (const category of ['TOP', 'BOTTOM', 'SHOES'])
      await http()
        .post('/wardrobe')
        .set(as(laura))
        .send({ category, primaryColor: 'white' })
        .expect(201);
    await http()
      .post('/outfits/generate')
      .set(as(laura))
      .send(GENERATE)
      .expect(201);

    const res = await http()
      .post('/outfits/generate')
      .set(as(laura))
      .send(GENERATE)
      .expect(402);
    expect((res.body as ApiErrorBody).code).toBe('billing.generationLimit');
    expect((await status()).usage.generationsThisWeek).toBe(1);
  });

  it('turns Premium on after a purchase, and lifts the limits', async () => {
    t.store.customers.set(lauraId, {
      entitlements: [
        {
          id: 'premium',
          productId: 'klotho_premium_annual',
          expiresAt: new Date(Date.now() + 365 * 24 * 3600 * 1000),
        },
      ],
      purchases: [{ productId: 'klotho_credits_25', transactionId: 'GPA.1' }],
    });

    const res = await http().post('/billing/sync').set(as(laura)).expect(200);

    const synced = res.body as BillingStatus;
    expect(synced.plan).toBe('premium');
    expect(synced.limits).toEqual({
      pieces: null,
      generationsPerWeek: null,
      historyDays: null,
    });
    // 25 a month + 2 free + 25 bought.
    expect(synced.credits.remaining).toBe(52);
    for (let i = 0; i < 4; i += 1)
      await http().post('/wardrobe').set(as(laura)).send(PIECE).expect(201);
  });

  it('follows the RevenueCat webhook', async () => {
    t.store.customers.set(lauraId, {
      entitlements: [
        { id: 'founders', productId: 'klotho_founders', expiresAt: null },
      ],
      purchases: [{ productId: 'klotho_founders', transactionId: 'GPA.F' }],
    });
    const event = {
      api_version: '1.0',
      event: { type: 'NON_RENEWING_PURCHASE', app_user_id: lauraId },
    };

    await http()
      .post('/billing/revenuecat')
      .set('Authorization', 'Bearer wrong')
      .send(event)
      .expect(401);
    const res = await http()
      .post('/billing/revenuecat')
      .set('Authorization', WEBHOOK)
      .send(event)
      .expect(200);
    // Delivered twice: credited once.
    await http()
      .post('/billing/revenuecat')
      .set('Authorization', WEBHOOK)
      .send(event)
      .expect(200);

    expect(res.body).toEqual({ synced: 1 });
    const now = await status();
    expect(now.plan).toBe('founders');
    expect(now.credits.remaining).toBe(32);
  });

  it('asks RevenueCat to retry when the store is down', async () => {
    t.store.failing = true;

    const res = await http()
      .post('/billing/revenuecat')
      .set('Authorization', WEBHOOK)
      .send({ event: { type: 'RENEWAL', app_user_id: lauraId } })
      .expect(503);

    expect((res.body as ApiErrorBody).code).toBe('billing.storeUnavailable');
  });

  it('shows only the last days of the history on the free plan', async () => {
    for (const category of ['TOP', 'BOTTOM', 'SHOES'])
      await http()
        .post('/wardrobe')
        .set(as(laura))
        .send({ category, primaryColor: 'white' })
        .expect(201);
    const generated = await http()
      .post('/outfits/generate')
      .set(as(laura))
      .send(GENERATE)
      .expect(201);
    const [outfit] = generated.body as { id: string }[];
    const day = (offset: number) =>
      new Date(Date.now() - offset * 24 * 3600 * 1000)
        .toISOString()
        .slice(0, 10);
    for (const offset of [1, 20])
      await http()
        .post(`/outfits/${outfit!.id}/wear`)
        .set(as(laura))
        .send({ wornOn: day(offset) })
        .expect(200);

    const res = await http().get('/outfits/history').set(as(laura)).expect(200);

    expect((res.body as { items: { wornOn: string }[] }).items).toEqual([
      expect.objectContaining({ wornOn: day(1) }),
    ]);
  });

  it('forgets the purchases with the account', async () => {
    t.store.customers.set(lauraId, {
      entitlements: [],
      purchases: [{ productId: 'klotho_credits_75', transactionId: 'GPA.2' }],
    });
    await http().post('/billing/sync').set(as(laura)).expect(200);
    await http().post('/wardrobe').set(as(laura)).send(PIECE).expect(201);

    await http()
      .delete('/users/me')
      .set(as(laura))
      .send({ password: 'Dressing2026!' })
      .expect(204);

    expect(await t.prisma.creditGrant.count()).toBe(0);
    expect(await t.prisma.usageEvent.count()).toBe(0);
  });

  it('keeps every limit off while payments are off', async () => {
    const beta = await createTestApp();
    try {
      const session = await request(beta.app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'beta@example.com',
          password: 'Dressing2026!',
          firstName: 'Beta',
        })
        .expect(201);
      const token = (session.body as AuthSession).tokens.accessToken;
      const res = await request(beta.app.getHttpServer())
        .get('/billing/status')
        .set(as(token))
        .expect(200);

      expect(res.body as BillingStatus).toMatchObject({
        enabled: false,
        plan: 'free',
        limits: { pieces: null, generationsPerWeek: null, historyDays: null },
      });
    } finally {
      await beta.app.close();
    }
  });
});
