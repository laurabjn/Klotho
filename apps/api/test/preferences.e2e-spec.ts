import type { AuthSession, StyleProfile } from '@klotho/shared';
import request from 'supertest';

import { createTestApp, type TestApp } from './utils/test-app';

describe('Preferences (e2e)', () => {
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
    await http().get('/preferences/me').expect(401);
    await http().put('/preferences/me').send({}).expect(401);
  });

  it('a new account has an empty profile and has not done the onboarding', async () => {
    const res = await http().get('/preferences/me').set(as(laura)).expect(200);

    expect(res.body).toMatchObject({
      preferredStyles: [],
      onboardingCompleted: false,
    });
  });

  it('skipping the onboarding (empty PUT) completes it', async () => {
    await http().put('/preferences/me').set(as(laura)).send({}).expect(200);

    const res = await http().get('/preferences/me').set(as(laura)).expect(200);
    expect((res.body as StyleProfile).onboardingCompleted).toBe(true);
  });

  it('saves the profile and keeps it private', async () => {
    const res = await http()
      .put('/preferences/me')
      .set(as(laura))
      .send({
        preferredStyles: ['romantic', 'vintage'],
        preferredColors: ['powderPink'],
        avoidedColors: ['black'],
        facePreferredColors: ['oldRose'],
        colorSeason: 'spring',
        preferredMetals: ['gold', 'roseGold'],
        acceptsHeels: false,
        preferredBottoms: ['skirts'],
        preferredFormality: 2,
      })
      .expect(200);

    expect(res.body).toMatchObject({
      preferredStyles: ['romantic', 'vintage'],
      preferredMetals: ['gold', 'roseGold'],
      acceptsHeels: false,
      onboardingCompleted: true,
    });
    expect(res.body).not.toHaveProperty('userId');

    const others = await http()
      .get('/preferences/me')
      .set(as(other))
      .expect(200);
    expect(others.body).toMatchObject({
      preferredStyles: [],
      onboardingCompleted: false,
    });
  });

  it('PUT replaces the previous profile', async () => {
    await http()
      .put('/preferences/me')
      .set(as(laura))
      .send({ preferredStyles: ['rock'], preferredMetals: ['silver'] })
      .expect(200);
    const res = await http()
      .put('/preferences/me')
      .set(as(laura))
      .send({ preferredStyles: ['chic'] })
      .expect(200);

    expect(res.body).toMatchObject({
      preferredStyles: ['chic'],
      preferredMetals: [],
    });
  });

  it('400 when a colour is both preferred and avoided', async () => {
    const res = await http()
      .put('/preferences/me')
      .set(as(laura))
      .send({ preferredColors: ['black'], avoidedColors: ['black'] })
      .expect(400);

    expect(res.body.issues).toContainEqual({
      path: 'avoidedColors',
      message: 'errors.preferences.colorConflict',
    });
  });

  it('deleting the account deletes the profile', async () => {
    await http().put('/preferences/me').set(as(laura)).send({}).expect(200);

    await t.prisma.user.delete({ where: { email: 'laura@example.com' } });

    expect(await t.prisma.styleProfile.count()).toBe(0);
  });
});
