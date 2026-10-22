import { renderHomePage, renderLegalPage } from './legal-pages';
import type { SiteSettings } from './site-tracking';

const SITE: SiteSettings = {
  contactEmail: 'contact@example.com',
  playStoreLive: false,
  pixels: {},
};
const PIXELS = {
  meta: '1234567890',
  tiktok: 'CABCDEF1234567',
  googleAds: 'AW-123456789',
  googleAdsLabel: 'AbC-123',
  pinterest: '2612345678901',
};

describe('website pages', () => {
  it('carries the Search Console tag when configured', () => {
    const html = renderHomePage('fr', {
      ...SITE,
      siteVerification: 'abc-123_XYZ',
    });

    expect(html).toContain(
      '<meta name="google-site-verification" content="abc-123_XYZ">',
    );
    expect(html).toContain('mailto:contact@example.com');
  });

  it('has the navigation, the sections and the footer, without any script', () => {
    const html = renderHomePage('fr', SITE);

    for (const part of [
      'class="top"',
      'href="#features"',
      'id="how"',
      '/site/monogram.svg',
      '/site/hero.webp',
      'href="/legal/privacy?lang=fr"',
      'Bientôt sur Google Play',
      '© 2026 Laura Bojon EI',
    ])
      expect(html).toContain(part);
    expect(html).not.toContain('<script');
    expect(html).not.toContain('google-site-verification');
    expect(html).not.toContain('Gérer les cookies');
  });

  it('links to the Play Store once the app is live, with the campaign', () => {
    const html = renderHomePage(
      'fr',
      { ...SITE, playStoreLive: true },
      { utm_source: 'instagram', utm_campaign: 'launch', utm_term: '<bad>' },
    );

    expect(html).toContain('Télécharger sur Google Play');
    expect(html).toContain(
      'https://play.google.com/store/apps/details?id=com.laurabjn.klotho&amp;referrer=utm_source%3Dinstagram%26utm_campaign%3Dlaunch',
    );
    expect(html).not.toContain('bad');
    expect(html).not.toContain('Bientôt sur Google Play');
  });

  it('asks for consent before loading the pixels', () => {
    const html = renderHomePage('fr', { ...SITE, pixels: PIXELS });

    expect(html).toContain('id="consent"');
    expect(html).toContain('>Refuser</button>');
    expect(html).toContain('>Accepter</button>');
    expect(html).toContain('id="manage-cookies"');
    // The loaders exist, but only run from load(), after "Accepter".
    expect(html).toContain('fbq(\'init\',"1234567890")');
    expect(html).toContain('ttq.load("CABCDEF1234567")');
    expect(html).toContain('gtag(\'config\',"AW-123456789")');
    expect(html).toContain('pintrk(\'load\',"2612345678901")');
    expect(html).toContain('"AW-123456789/AbC-123"');
    expect(html.indexOf('function load()')).toBeLessThan(
      html.indexOf("fbq('init'"),
    );
  });

  it('shows the same banner on the legal pages', () => {
    const html = renderLegalPage('privacy', 'en', { ...SITE, pixels: PIXELS });

    expect(html).toContain('>Refuse</button>');
    expect(html).toContain('Our website and its cookies');
  });
});
