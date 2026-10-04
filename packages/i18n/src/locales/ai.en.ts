import type { TranslationResource } from './fr';

export const aiEn: TranslationResource['ai'] = {
  card: {
    title: 'Fill in with Klotho AI',
    body: 'Klotho analyses your main photo and suggests the category, colours, style and season. You can correct everything.',
    action: 'Analyse my photo',
    remaining_one: '{{count}} analysis left',
    remaining_other: '{{count}} analyses left',
    none: 'You have used all your free analyses. You can fill in the details yourself.',
    privacy:
      'Your photo is sent to our AI provider (Groq) only for this analysis.',
  },
  analyzing: {
    title: 'Klotho is analysing your piece…',
    body: 'Category, colours, style, season: one moment.',
  },
  prefilled: 'Filled in by Klotho AI: check and correct if needed.',
};
