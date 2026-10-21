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
export function renderLegalPage(
  page: LegalPage,
  locale: Locale,
  contactEmail: string,
): string {
  const { title, intro, sections } = content(page, locale, contactEmail);
  const other: Locale = locale === 'fr' ? 'en' : 'fr';
  const nav = PAGES.map((p) =>
    p === page
      ? `<strong>${escape(LINKS[locale][p])}</strong>`
      : `<a href="/legal/${p}?lang=${locale}">${escape(LINKS[locale][p])}</a>`,
  ).join(' · ');
  const body = sections
    .map(
      (s, i) =>
        `<section><h2>${i + 1}. ${escape(s.title)}</h2><p>${escape(s.body)}</p></section>`,
    )
    .join('\n');

  return `<!doctype html>
<html lang="${locale}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escape(title)} · Klotho</title>
<style>
  :root { color-scheme: light; }
  body { margin: 0; background: #FBF7F2; color: #6B5048;
    font: 17px/1.6 Georgia, 'Times New Roman', serif; }
  main { max-width: 720px; margin: 0 auto; padding: 32px 20px 64px; }
  .brand { font-size: 28px; color: #3E231C; letter-spacing: .02em; }
  h1 { color: #3E231C; font-size: 34px; line-height: 1.2; margin: 24px 0 8px; }
  h2 { color: #3E231C; font-size: 21px; margin: 28px 0 6px; }
  nav { font-size: 15px; margin-top: 8px; }
  a { color: #9A4A40; }
  .intro { font-size: 18px; }
  footer { margin-top: 40px; font-size: 14px; color: #816A60; }
</style>
</head>
<body>
<main>
<div class="brand">Klotho</div>
<nav>${nav} · <a href="/legal/${page}?lang=${other}">${other.toUpperCase()}</a></nav>
<h1>${escape(title)}</h1>
<p class="intro">${escape(intro)}</p>
${body}
<footer>Klotho · Laura Bojon EI</footer>
</main>
</body>
</html>`;
}
