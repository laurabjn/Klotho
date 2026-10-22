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
    'delete-account': 'Supprimer mon compte',
  },
  en: {
    privacy: 'Privacy',
    terms: 'Terms of use',
    'delete-account': 'Delete my account',
  },
};

/** A self-contained page: no script, no external font or image. */
function layout(
  locale: Locale,
  title: string,
  nav: string,
  switchTo: string,
  main: string,
): string {
  const other: Locale = locale === 'fr' ? 'en' : 'fr';
  return `<!doctype html>
<html lang="${locale}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escape(title)}</title>
<style>
  :root { color-scheme: light; }
  body { margin: 0; background: #FBF7F2; color: #6B5048;
    font: 17px/1.6 Georgia, 'Times New Roman', serif; }
  main { max-width: 720px; margin: 0 auto; padding: 32px 20px 64px; }
  .brand { font-size: 28px; color: #3E231C; letter-spacing: .02em;
    text-decoration: none; }
  h1 { color: #3E231C; font-size: 34px; line-height: 1.2; margin: 24px 0 8px; }
  h2 { color: #3E231C; font-size: 21px; margin: 28px 0 6px; }
  nav { font-size: 15px; margin-top: 8px; }
  a { color: #9A4A40; }
  .intro { font-size: 18px; }
  ul.features { padding-left: 0; list-style: none; }
  ul.features li { margin: 8px 0; }
  ul.features li::before { content: "✿ "; color: #B07869; }
  .badge { display: inline-block; margin-top: 16px; padding: 8px 16px;
    border-radius: 999px; background: #EFD9D0; color: #3E231C; }
  footer { margin-top: 40px; font-size: 14px; color: #816A60; }
</style>
</head>
<body>
<main>
<a class="brand" href="/?lang=${locale}">Klotho</a>
<nav>${nav} · <a href="${switchTo}">${other.toUpperCase()}</a></nav>
${main}
<footer>Klotho · Laura Bojon EI</footer>
</main>
</body>
</html>`;
}

function navigation(locale: Locale, current: LegalPage | 'home'): string {
  const t = resources[locale].translation;
  const home =
    current === 'home'
      ? `<strong>${escape(t.site.home)}</strong>`
      : `<a href="/?lang=${locale}">${escape(t.site.home)}</a>`;
  const pages = PAGES.map((p) =>
    p === current
      ? `<strong>${escape(LINKS[locale][p])}</strong>`
      : `<a href="${href(p, locale)}">${escape(LINKS[locale][p])}</a>`,
  );
  return [home, ...pages].join(' · ');
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
  return layout(
    locale,
    `${title} · Klotho`,
    navigation(locale, page),
    href(page, other),
    `<h1>${escape(title)}</h1>\n<p class="intro">${escape(intro)}</p>\n${body}`,
  );
}

/** The home page: what Klotho is, how to reach its author, the legal pages. */
export function renderHomePage(locale: Locale, contactEmail: string): string {
  const t = resources[locale].translation.site;
  const other: Locale = locale === 'fr' ? 'en' : 'fr';
  const features = t.features
    .map((feature) => `<li>${escape(feature)}</li>`)
    .join('');
  const contact = contactEmail
    ? `<p>${escape(fill(t.contact, { email: contactEmail })).replace(
        escape(contactEmail),
        `<a href="mailto:${escape(contactEmail)}">${escape(contactEmail)}</a>`,
      )}</p>`
    : '';
  const legal = PAGES.map(
    (p) =>
      `<li><a href="${href(p, locale)}">${escape(LINKS[locale][p])}</a></li>`,
  ).join('');
  return layout(
    locale,
    t.title,
    navigation(locale, 'home'),
    `/?lang=${other}`,
    `<h1>${escape(t.tagline)}</h1>
<p class="intro">${escape(t.intro)}</p>
<ul class="features">${features}</ul>
<p class="badge">${escape(t.availability)}</p>
${contact}
<h2>${escape(t.legalTitle)}</h2>
<ul>${legal}</ul>`,
  );
}
