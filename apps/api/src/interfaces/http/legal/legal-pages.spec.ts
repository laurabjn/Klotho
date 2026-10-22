import { renderHomePage } from './legal-pages';

describe('renderHomePage', () => {
  it('carries the Search Console tag when configured', () => {
    const html = renderHomePage('fr', 'contact@example.com', 'abc-123_XYZ');

    expect(html).toContain(
      '<meta name="google-site-verification" content="abc-123_XYZ">',
    );
    expect(html).toContain('mailto:contact@example.com');
  });

  it('has no tag otherwise', () => {
    expect(renderHomePage('en', '')).not.toContain('google-site-verification');
  });

  it('has the navigation, the sections and the footer', () => {
    const html = renderHomePage('fr', 'contact@example.com');

    for (const part of [
      'class="top"',
      'href="#features"',
      'id="how"',
      '/site/monogram.svg',
      '/site/hero.webp',
      'href="/legal/privacy?lang=fr"',
      '© 2026 Laura Bojon EI',
    ])
      expect(html).toContain(part);
    expect(html).not.toContain('<script');
  });
});
