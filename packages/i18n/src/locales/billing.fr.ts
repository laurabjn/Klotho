// Klotho Premium, founders offer, AI credits and the limits of the free plan.
export const billingFr = {
  open: 'Klotho Premium',
  title: 'Klotho Premium',
  overline: 'Ton dressing, sans limite',
  intro:
    'Garde l’essentiel gratuitement, ou profite de Klotho sans aucune limite.',
  plan: { free: 'Gratuit', premium: 'Premium', founders: 'Founders' },
  compare: {
    free: 'Gratuit',
    premium: 'Premium',
    unlimited: 'Illimité',
    pieces: 'Pièces dans ton dressing',
    generations: 'Tenues générées',
    generationsFree: '{{count}} / semaine',
    history: 'Historique des tenues',
    historyFree: '{{count}} jours',
    historyPremium: 'Complet',
    analyses: 'Analyses photo IA',
    analysesFree: '{{count}} offertes',
    analysesPremium: '{{count}} / mois',
  },
  plans: {
    annual: 'Annuel',
    annualPrice: '32,99 € / an',
    annualHint: 'Soit 2,75 € par mois',
    save: '−45 %',
    monthly: 'Mensuel',
    monthlyPrice: '4,99 € / mois',
    monthlyHint: 'Sans engagement',
    founders: 'Founders',
    foundersPrice: '49,99 € à vie',
    foundersHint: 'Offre de lancement : tout Klotho à vie, et 30 analyses IA.',
    foundersBadge: 'Édition limitée',
    foundersUntil: 'Jusqu’au {{date}} seulement.',
  },
  subscribe: 'Continuer',
  restore: 'Restaurer mes achats',
  restored: 'Tes achats ont été restaurés.',
  thanks: 'Merci ! Ton achat est bien pris en compte.',
  legal:
    'L’abonnement se renouvelle automatiquement à la fin de chaque période. Tu peux le résilier à tout moment depuis {{store}}, au plus tard 24 h avant le renouvellement.',
  stores: { android: 'Google Play', ios: 'l’App Store' },
  terms: 'Conditions d’utilisation',
  privacy: 'Confidentialité',
  unavailable:
    'Les achats seront possibles dans l’application installée (version bêta), pas dans Expo Go.',
  current: {
    premium: 'Tu es Premium jusqu’au {{date}}.',
    founders: 'Tu fais partie des Founders : Klotho est à toi, à vie.',
    manage: 'Gérer mon abonnement',
  },
  credits: {
    title: 'Crédits d’analyse IA',
    body: 'Pour analyser plus de photos. Tes crédits achetés n’expirent pas.',
    pack: '{{count}} crédits',
    buy: 'Acheter',
  },
  limits: {
    piecesTitle: 'Ton dressing est plein',
    piecesBody:
      'La version gratuite garde jusqu’à {{count}} pièces. Passe à Premium pour en ajouter autant que tu veux.',
    generationsTitle: 'Plus de tenues cette semaine',
    generationsBody:
      'Tu as utilisé tes {{count}} générations gratuites de la semaine. Passe à Premium pour en créer sans limite.',
    generationsLeft_one: '{{count}} génération restante cette semaine',
    generationsLeft_other: '{{count}} générations restantes cette semaine',
    history:
      'La version gratuite montre les {{count}} derniers jours. Ton historique complet est inclus dans Premium.',
    upgrade: 'Passer à Premium',
    later: 'Plus tard',
  },
} as const;
