// Order of the legal sections, shared by the app screens and the web pages
// of the API (keys of privacy.sections and settings.terms.sections).
export const PRIVACY_SECTIONS = [
  'data',
  'location',
  'photos',
  'partners',
  'retention',
  'rights',
  'legal',
] as const;
export type PrivacySection = (typeof PRIVACY_SECTIONS)[number];

export const TERMS_SECTIONS = [
  'purpose',
  'account',
  'beta',
  'paid',
  'content',
  'advice',
  'liability',
  'end',
  'law',
] as const;
export type TermsSection = (typeof TERMS_SECTIONS)[number];

/** Date of the current version of the terms (YYYY-MM-DD). */
export const TERMS_DATE = '2026-10-04';
