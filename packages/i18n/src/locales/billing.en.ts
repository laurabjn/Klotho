import type { TranslationResource } from './fr';

export const billingEn: TranslationResource['billing'] = {
  open: 'Klotho Premium',
  title: 'Klotho Premium',
  overline: 'Your wardrobe, without limits',
  intro: 'Keep the essentials for free, or enjoy Klotho without any limit.',
  plan: { free: 'Free', premium: 'Premium', founders: 'Founders' },
  compare: {
    free: 'Free',
    premium: 'Premium',
    unlimited: 'Unlimited',
    pieces: 'Pieces in your wardrobe',
    generations: 'Outfits generated',
    generationsFree: '{{count}} / week',
    history: 'Outfit history',
    historyFree: '{{count}} days',
    historyPremium: 'Full',
    analyses: 'AI photo analyses',
    analysesFree: '{{count}} offered',
    analysesPremium: '{{count}} / month',
  },
  plans: {
    annual: 'Yearly',
    annualPrice: '€32.99 / year',
    annualHint: 'That is €2.75 a month',
    save: '−31%',
    monthly: 'Monthly',
    monthlyPrice: '€3.99 / month',
    monthlyHint: 'Cancel anytime',
    founders: 'Founders',
    foundersPrice: '€39.99 for life',
    foundersHint: 'Launch offer: all of Klotho for life, and 30 AI analyses.',
    foundersBadge: 'Limited edition',
  },
  subscribe: 'Continue',
  restore: 'Restore my purchases',
  restored: 'Your purchases have been restored.',
  thanks: 'Thank you! Your purchase is confirmed.',
  legal:
    'The subscription renews automatically at the end of each period. You can cancel it at any time from {{store}}, at least 24 hours before the renewal.',
  stores: { android: 'Google Play', ios: 'the App Store' },
  terms: 'Terms of use',
  privacy: 'Privacy',
  unavailable:
    'Purchases will be possible in the installed app (beta version), not in Expo Go.',
  current: {
    premium: 'You are Premium until {{date}}.',
    founders: 'You are one of the Founders: Klotho is yours, for life.',
    manage: 'Manage my subscription',
  },
  credits: {
    title: 'AI analysis credits',
    body: 'To analyse more photos. Credits you buy never expire.',
    pack: '{{count}} credits',
    buy: 'Buy',
  },
  limits: {
    piecesTitle: 'Your wardrobe is full',
    piecesBody:
      'The free version keeps up to {{count}} pieces. Go Premium to add as many as you like.',
    generationsTitle: 'No more outfits this week',
    generationsBody:
      'You have used your {{count}} free generations this week. Go Premium to create without limits.',
    generationsLeft_one: '{{count}} generation left this week',
    generationsLeft_other: '{{count}} generations left this week',
    history:
      'The free version shows the last {{count}} days. Your full history comes with Premium.',
    upgrade: 'Go Premium',
    later: 'Later',
  },
};
