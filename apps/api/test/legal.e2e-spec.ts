import request from 'supertest';

import { createTestApp, type TestApp } from './utils/test-app';

describe('Legal pages (e2e)', () => {
  let t: TestApp;
  const http = () => request(t.app.getHttpServer());

  beforeAll(async () => {
    t = await createTestApp();
  });

  afterAll(async () => {
    await t.app.close();
  });

  it.each([
    ['privacy', 'Confidentialité', 'Ce que Klotho enregistre'],
    ['terms', 'Conditions générales', 'Objet'],
    ['delete-account', 'Supprimer mon compte Klotho', 'Depuis l’application'],
  ])(
    'serves /legal/%s in French, without signing in',
    async (page, title, section) => {
      const res = await http().get(`/legal/${page}`).expect(200);

      expect(res.headers['content-type']).toContain('text/html');
      expect(res.text).toContain(`<title>${title} · Klotho</title>`);
      expect(res.text).toContain(section);
      expect(res.text).not.toContain('<script');
    },
  );

  it('speaks English when asked', async () => {
    const res = await http().get('/legal/delete-account?lang=en').expect(200);

    expect(res.text).toContain('<html lang="en">');
    expect(res.text).toContain('Delete my Klotho account');
  });

  it('answers 404 for an unknown page', async () => {
    await http().get('/legal/cookies').expect(404);
  });
});
