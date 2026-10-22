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
});
