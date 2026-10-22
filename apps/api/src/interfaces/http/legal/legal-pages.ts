import {
  PRIVACY_SECTIONS,
  resources,
  TERMS_DATE,
  TERMS_SECTIONS,
  type Locale,
} from '@klotho/i18n';

/** The legal pages, on the web (the store listing links to them). */
export type LegalPage = 'privacy' | 'terms' | 'delete-account';

const PAGES: LegalPage[] = ['privacy', 'terms', 'delete-account'];

const href = (page: LegalPage, locale: Locale) =>
  `/legal/${page}?lang=${locale}`;

const escape = (text: string) =>
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const fill = (text: string, values: Record<string, string>) =>
  text.replace(/\{\{(\w+)\}\}/g, (_, key: string) => values[key] ?? '');

interface Section {
  title: string;
  body: string;
}

function content(page: LegalPage, locale: Locale, contactEmail: string) {
  const t = resources[locale].translation;
  if (page === 'privacy') {
    return {
      title: t.privacy.title,
      intro: t.privacy.intro,
      sections: PRIVACY_SECTIONS.map((key): Section => t.privacy.sections[key]),
    };
  }
  if (page === 'terms') {
    const date = new Intl.DateTimeFormat(locale, { dateStyle: 'long' }).format(
      new Date(`${TERMS_DATE}T12:00:00Z`),
    );
    return {
      title: t.settings.terms.title,
      intro: fill(t.settings.terms.updated, { date }),
      sections: TERMS_SECTIONS.map(
        (key): Section => t.settings.terms.sections[key],
      ),
    };
  }
  const d = t.privacy.deletePage;
  return {
    title: d.title,
    intro: d.intro,
    sections: [
      { title: d.inAppTitle, body: d.inApp },
      { title: d.byEmailTitle, body: fill(d.byEmail, { email: contactEmail }) },
      { title: d.whatTitle, body: d.what },
    ],
  };
}

const LINKS: Record<Locale, Record<LegalPage, string>> = {
  fr: {
    privacy: 'Confidentialité',
    terms: 'Conditions générales',
    'delete-account': 'Suppression de compte',
  },
  en: {
    privacy: 'Privacy',
    terms: 'Terms of use',
    'delete-account': 'Account deletion',
  },
};

/** Line icons of the features (stroke inherits the card's colour). */
const ICONS: Record<string, string> = {
  wardrobe:
    '<path d="M12 4a2 2 0 0 1 1.6 3.2L12 9l9 6.5a1.2 1.2 0 0 1-.7 2.2H3.7a1.2 1.2 0 0 1-.7-2.2L12 9"/>',
  weather:
    '<circle cx="8" cy="8" r="3"/><path d="M8 2v1.5M2 8h1.5M3.8 3.8l1 1M12.2 3.8l-1 1"/><path d="M9 19h9a3.5 3.5 0 0 0 0-7 5 5 0 0 0-9.5 1.5A3 3 0 0 0 9 19z"/>',
  occasion:
    '<path d="M8 3h8l-1 6a3 3 0 0 1-6 0z"/><path d="M12 12v8M8.5 21h7"/>',
  calendar:
    '<rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/><circle cx="12" cy="15" r="1.4"/>',
  styles:
    '<path d="M12 3.5l2.4 5 5.4.6-4 3.7 1.1 5.4L12 15.5 7.1 18.2l1.1-5.4-4-3.7 5.4-.6z"/>',
  privacy:
    '<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',
};

const icon = (name: string) =>
  `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] ?? ''}</svg>`;

const STYLE = `
@font-face { font-family: 'Cormorant'; font-weight: 500; font-display: swap;
  src: url('/site/fonts/cormorant-500.woff2') format('woff2'); }
@font-face { font-family: 'Cormorant'; font-weight: 600; font-display: swap;
  src: url('/site/fonts/cormorant-600.woff2') format('woff2'); }
@font-face { font-family: 'Jost'; font-weight: 400; font-display: swap;
  src: url('/site/fonts/jost-400.woff2') format('woff2'); }
@font-face { font-family: 'Jost'; font-weight: 500; font-display: swap;
  src: url('/site/fonts/jost-500.woff2') format('woff2'); }
:root { color-scheme: light; --bg: #FBF7F2; --surface: #FCF8F3;
  --blush: #EFD9D0; --rose: #B07869; --rose-dark: #9C6658;
  --title: #3E231C; --body: #6B5048; --muted: #816A60; --line: #EFE4DA; }
* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body { margin: 0; background: var(--bg); color: var(--body);
  font: 400 17px/1.65 'Jost', system-ui, sans-serif; }
img { max-width: 100%; height: auto; display: block; }
a { color: var(--rose-dark); }
h1, h2, h3, .brand { font-family: 'Cormorant', Georgia, serif;
  color: var(--title); font-weight: 600; }
.wrap { max-width: 1120px; margin: 0 auto; padding: 0 24px; }
header.top { position: sticky; top: 0; z-index: 10;
  background: rgba(251, 247, 242, .92); backdrop-filter: blur(8px);
  border-bottom: 1px solid var(--line); }
.bar { display: flex; align-items: center; gap: 24px; height: 72px; }
.brand { display: flex; align-items: center; gap: 10px; font-size: 30px;
  text-decoration: none; letter-spacing: .01em; }
.brand img { width: 40px; height: 40px; }
nav.links { display: flex; gap: 24px; margin-left: auto; font-size: 15px; }
nav.links a { color: var(--body); text-decoration: none; }
nav.links a:hover, nav.links a[aria-current] { color: var(--rose-dark); }
.lang { font-size: 14px; color: var(--muted); text-decoration: none;
  border: 1px solid var(--line); border-radius: 999px; padding: 4px 10px; }
.pill { display: inline-flex; align-items: center; gap: 8px; border-radius: 999px;
  padding: 12px 22px; font: 500 15px 'Jost', sans-serif; text-decoration: none; }
.pill.primary { background: var(--rose); color: #FFF9F5;
  box-shadow: 0 8px 20px rgba(176, 120, 105, .3); }
.pill.primary:hover { background: var(--rose-dark); }
.pill.soft { background: var(--blush); color: var(--title); }
.hero { background: radial-gradient(circle at 80% 20%, #F6E3DB 0, transparent 55%),
  linear-gradient(180deg, #FBF7F2, #F7EDE6); }
.hero .wrap { display: grid; grid-template-columns: 1.1fr .9fr; gap: 40px;
  align-items: center; padding-top: 64px; padding-bottom: 64px; }
.overline { text-transform: uppercase; letter-spacing: .2em; font-size: 13px;
  color: var(--rose-dark); }
.hero h1 { font-size: clamp(40px, 5.5vw, 64px); line-height: 1.05; margin: 12px 0 18px; }
.hero p.lead { font-size: 19px; max-width: 520px; }
.actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 28px; }
section.block { padding: 80px 0; }
section.block h2 { font-size: clamp(32px, 4vw, 44px); text-align: center; margin: 0 0 40px; }
.grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
.card { background: var(--surface); border: 1px solid var(--line); border-radius: 24px;
  padding: 28px; }
.card svg { width: 44px; height: 44px; padding: 10px; border-radius: 999px;
  background: var(--blush); stroke: var(--rose-dark); fill: none;
  stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; }
.card h3 { font-size: 24px; margin: 16px 0 6px; }
.card p { margin: 0; }
.how { background: #F7EDE6; }
.how .wrap { display: grid; grid-template-columns: .9fr 1.1fr; gap: 48px; align-items: center; }
.how h2, .privacy h2 { text-align: left !important; }
.privacy h2 { margin-bottom: 16px !important; }
.steps { list-style: none; padding: 0; margin: 0; counter-reset: step; }
.steps li { position: relative; padding-left: 64px; margin-bottom: 28px; }
.steps li::before { counter-increment: step; content: counter(step);
  position: absolute; left: 0; top: 0; width: 44px; height: 44px; border-radius: 999px;
  background: var(--rose); color: #FFF9F5; display: grid; place-items: center;
  font: 600 22px 'Cormorant', serif; }
.steps h3 { font-size: 24px; margin: 0 0 4px; }
.steps p { margin: 0; }
.privacy .wrap { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; align-items: center; }
.contact { text-align: center; }
.contact p { font-size: 19px; }
.contact .pill { margin-top: 8px; }
footer.bottom { border-top: 1px solid var(--line); padding: 40px 0; font-size: 14px;
  color: var(--muted); }
footer.bottom .wrap { display: flex; flex-wrap: wrap; gap: 16px 32px; align-items: center; }
footer.bottom nav { display: flex; flex-wrap: wrap; gap: 16px; }
footer.bottom a { color: var(--muted); }
footer.bottom .brand { font-size: 22px; }
footer.bottom .brand img { width: 28px; height: 28px; }
footer.bottom .copy { margin-left: auto; }
.doc { max-width: 760px; margin: 0 auto; padding: 56px 24px 80px; }
.doc h1 { font-size: clamp(36px, 5vw, 52px); line-height: 1.1; margin: 0 0 12px; }
.doc .intro { font-size: 19px; }
.doc section { background: var(--surface); border: 1px solid var(--line);
  border-radius: 20px; padding: 22px 26px; margin-top: 16px; }
.doc h2 { font-size: 24px; margin: 0 0 6px; }
.doc p { margin: 0; }
@media (max-width: 860px) {
  nav.links { display: none; }
  .bar .lang { margin-left: auto; }
  .bar .pill { display: none; }
  .hero .wrap, .how .wrap, .privacy .wrap { grid-template-columns: 1fr; }
  .hero .wrap { padding-top: 40px; }
  .hero figure { max-width: 380px; margin: 0 auto !important; }
  .grid { grid-template-columns: 1fr; }
  section.block { padding: 56px 0; }
  footer.bottom .copy { margin-left: 0; }
}
`;

/** Header, footer and the page around `main`: no script, no tracking. */
function layout(options: {
  locale: Locale;
  title: string;
  description: string;
  current: LegalPage | 'home';
  switchTo: string;
  contactEmail: string;
  main: string;
  head?: string;
}): string {
  const { locale, current } = options;
  const t = resources[locale].translation.site;
  const other: Locale = locale === 'fr' ? 'en' : 'fr';
  const home = `/?lang=${locale}`;
  const anchor = (id: string) =>
    current === 'home' ? `#${id}` : `${home}#${id}`;
  const legal = PAGES.map(
    (p) =>
      `<a href="${href(p, locale)}"${p === current ? ' aria-current="page"' : ''}>${escape(LINKS[locale][p])}</a>`,
  ).join('');
  const contact = options.contactEmail
    ? `<a href="mailto:${escape(options.contactEmail)}">${escape(options.contactEmail)}</a>`
    : '';
  return `<!doctype html>
<html lang="${locale}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escape(options.title)}</title>
<meta name="description" content="${escape(options.description)}">
<meta property="og:title" content="${escape(options.title)}">
<meta property="og:description" content="${escape(options.description)}">
<meta property="og:image" content="/site/hero.webp">
<meta name="theme-color" content="#FBF7F2">
<link rel="icon" href="/site/monogram.svg" type="image/svg+xml">
<link rel="preload" href="/site/fonts/cormorant-600.woff2" as="font" type="font/woff2" crossorigin>${options.head ?? ''}
<style>${STYLE}</style>
</head>
<body>
<header class="top">
  <div class="wrap bar">
    <a class="brand" href="${home}"><img src="/site/monogram.svg" alt="" width="40" height="40">Klotho</a>
    <nav class="links" aria-label="Klotho">
      <a href="${anchor('features')}">${escape(t.nav.features)}</a>
      <a href="${anchor('how')}">${escape(t.nav.how)}</a>
      <a href="${href('privacy', locale)}"${current === 'privacy' ? ' aria-current="page"' : ''}>${escape(t.nav.privacy)}</a>
      <a href="${anchor('contact')}">${escape(t.nav.contact)}</a>
    </nav>
    <a class="lang" href="${options.switchTo}" hreflang="${other}">${other.toUpperCase()}</a>
    <span class="pill soft">${escape(t.soon)}</span>
  </div>
</header>
${options.main}
<footer class="bottom">
  <div class="wrap">
    <a class="brand" href="${home}"><img src="/site/monogram.svg" alt="" width="28" height="28">Klotho</a>
    <nav aria-label="${escape(t.legalTitle)}">${legal}</nav>
    ${contact}
    <span class="copy">© 2026 Laura Bojon EI. ${escape(t.rights)}</span>
  </div>
</footer>
</body>
</html>`;
}

export function renderLegalPage(
  page: LegalPage,
  locale: Locale,
  contactEmail: string,
): string {
  const { title, intro, sections } = content(page, locale, contactEmail);
  const other: Locale = locale === 'fr' ? 'en' : 'fr';
  const body = sections
    .map(
      (s, i) =>
        `<section><h2>${i + 1}. ${escape(s.title)}</h2><p>${escape(s.body)}</p></section>`,
    )
    .join('\n');
  return layout({
    locale,
    title: `${title} · Klotho`,
    description: intro,
    current: page,
    switchTo: href(page, other),
    contactEmail,
    main: `<main class="doc">
<h1>${escape(title)}</h1>
<p class="intro">${escape(intro)}</p>
${body}
</main>`,
  });
}

const FEATURES = [
  'wardrobe',
  'weather',
  'occasion',
  'calendar',
  'styles',
  'privacy',
] as const;

/** The home page: what Klotho is, how it works, how to reach its author. */
export function renderHomePage(
  locale: Locale,
  contactEmail: string,
  /** Google Search Console proof that the site is ours. */
  siteVerification?: string,
): string {
  const t = resources[locale].translation.site;
  const other: Locale = locale === 'fr' ? 'en' : 'fr';
  const cards = FEATURES.map(
    (key) =>
      `<article class="card">${icon(key)}<h3>${escape(t.features[key].title)}</h3><p>${escape(t.features[key].body)}</p></article>`,
  ).join('\n');
  const steps = t.steps
    .map(
      (step) =>
        `<li><h3>${escape(step.title)}</h3><p>${escape(step.body)}</p></li>`,
    )
    .join('\n');
  const mail = contactEmail
    ? `<p><a class="pill primary" href="mailto:${escape(contactEmail)}">${escape(contactEmail)}</a></p>`
    : '';
  return layout({
    locale,
    title: t.title,
    description: t.description,
    current: 'home',
    switchTo: `/?lang=${other}`,
    contactEmail,
    head: siteVerification
      ? `\n<meta name="google-site-verification" content="${escape(siteVerification)}">`
      : '',
    main: `<main>
<section class="hero">
  <div class="wrap">
    <div>
      <span class="overline">${escape(t.hero.overline)}</span>
      <h1>${escape(t.hero.title)}</h1>
      <p class="lead">${escape(t.hero.body)}</p>
      <div class="actions">
        <a class="pill primary" href="#features">${escape(t.hero.discover)}</a>
        <span class="pill soft">${escape(t.soon)}</span>
      </div>
    </div>
    <figure style="margin:0"><img src="/site/hero.webp" alt="" width="720" height="861"></figure>
  </div>
</section>
<section class="block" id="features">
  <div class="wrap">
    <h2>${escape(t.featuresTitle)}</h2>
    <div class="grid">
${cards}
    </div>
  </div>
</section>
<section class="block how" id="how">
  <div class="wrap">
    <img src="/site/wardrobe.webp" alt="" width="720" height="755" loading="lazy">
    <div>
      <h2>${escape(t.howTitle)}</h2>
      <ol class="steps">
${steps}
      </ol>
    </div>
  </div>
</section>
<section class="block privacy" id="privacy">
  <div class="wrap">
    <div>
      <h2>${escape(t.privacyTitle)}</h2>
      <p>${escape(t.privacyBody)}</p>
      <p><a href="${href('privacy', locale)}">${escape(t.privacyLink)}</a></p>
    </div>
    <img src="/site/vanity.webp" alt="" width="640" height="522" loading="lazy">
  </div>
</section>
<section class="block contact" id="contact">
  <div class="wrap">
    <h2>${escape(t.contactTitle)}</h2>
    <p>${escape(t.contactBody)}</p>
    ${mail}
  </div>
</section>
</main>`,
  });
}
