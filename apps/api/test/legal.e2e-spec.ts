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

  it('serves a home page with the legal links', async () => {
    const res = await http().get('/').expect(200);

    expect(res.headers['content-type']).toContain('text/html');
    expect(res.text).toContain('Ta tenue du jour, sans y passer la matinée.');
    expect(res.text).toContain('href="/legal/privacy?lang=fr"');
    expect(res.text).toContain('href="/legal/delete-account?lang=fr"');
    expect(res.text).not.toContain('<script');
    // No Search Console tag unless GOOGLE_SITE_VERIFICATION is set.
    expect(res.text).not.toContain('google-site-verification');

    const en = await http().get('/?lang=en').expect(200);
    expect(en.text).toContain('Your outfit of the day');
  });

  it('serves the logo, illustrations and fonts of the site', async () => {
    const logo = await http().get('/site/monogram.svg').expect(200);
    expect(logo.headers['content-type']).toContain('image/svg+xml');
    expect(logo.headers['cache-control']).toContain('max-age=604800');

    const hero = await http().get('/site/hero.webp').expect(200);
    expect(hero.headers['content-type']).toContain('image/webp');

    const font = await http().get('/site/fonts/jost-400.woff2').expect(200);
    expect(font.headers['content-type']).toContain('font/woff2');
  });

  it('serves nothing else from the site folder', async () => {
    await http().get('/site/secret.txt').expect(404);
    await http().get('/site/fonts/..%2F..%2Fpackage.json').expect(404);
    await http().get('/site/fonts/hero.webp').expect(404);
  });

  it('answers 404 for an unknown page', async () => {
    await http().get('/legal/cookies').expect(404);
  });
});
