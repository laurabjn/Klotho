import { onboardingFr, preferencesFr } from './preferences.fr';
import { wardrobeFr } from './wardrobe.fr';
import { outfitsFr } from './outfits.fr';
import { notificationsFr } from './notifications.fr';
import { privacyFr } from './privacy.fr';
import { settingsFr } from './settings.fr';
import { statesFr } from './states.fr';
import { aiFr } from './ai.fr';
import { billingFr } from './billing.fr';
import { weatherFr } from './weather.fr';

// French is the reference locale: every other locale must match its keys.
// Tone: tutoiement everywhere.
export const fr = {
  common: {
    appName: 'Klotho',
    loading: 'Chargement…',
    error: 'Une erreur est survenue.',
    retry: 'Réessayer',
    serverWaking: 'Klotho se réveille… un instant.',
    backToTop: 'Revenir en haut',
    cancel: 'Annuler',
    or: 'ou',
    back: 'Retour',
    close: 'Fermer',
    showPassword: 'Afficher le mot de passe',
    hidePassword: 'Masquer le mot de passe',
  },
  auth: {
    fields: {
      firstName: 'Prénom',
      email: 'Email',
      password: 'Mot de passe',
      confirmPassword: 'Confirmer le mot de passe',
      newPassword: 'Nouveau mot de passe',
    },
    login: {
      title: "Plus qu'une garde-robe,\nune version de toi.",
      overline: 'Crée, organise et porte\nun style qui te ressemble.',
      forgotPassword: 'Mot de passe oublié ?',
      submit: 'Se connecter',
      createAccount: 'Créer un compte',
    },
    register: {
      title: 'Créer\nun compte',
      overline: 'Commence à tisser\nton univers mode',
      body: 'Rejoins Klotho et découvre une expérience personnalisée, inspirante et pleine de style.',
      submit: 'Créer mon compte',
      haveAccount: "J'ai déjà un compte",
      consent:
        'En créant ton compte, tu acceptes nos conditions générales et notre politique de confidentialité.',
      privacy: 'Lire la politique de confidentialité',
      terms: 'Lire les conditions générales',
    },
    forgotPassword: {
      title: 'Mot de passe oublié',
      overline: 'Retrouve l’accès à ta garde-robe',
      body: "Entre ton adresse email et nous t'enverrons un lien pour réinitialiser ton mot de passe.",
      hint: "Nous t'enverrons un lien de réinitialisation à cette adresse. Pense à vérifier tes spams.",
      submit: 'Envoyer le lien',
      backToLogin: 'Retour à la connexion',
      sentTitle: 'Vérifie ta boîte mail',
      sentBody:
        'Si un compte existe pour {{email}}, tu vas recevoir un lien pour choisir un nouveau mot de passe. Il est valable une heure.',
      resend: 'Renvoyer le lien',
    },
    resetPassword: {
      title: 'Nouveau\nmot de passe',
      body: 'Choisis un nouveau mot de passe pour sécuriser ton compte et continuer ton expérience avec Klotho.',
      submit: 'Mettre à jour mon mot de passe',
      missingToken:
        'Ce lien est incomplet. Ouvre à nouveau le lien reçu par email, ou demandes-en un nouveau.',
      requestNewLink: 'Demander un nouveau lien',
    },
    passwordChanged: {
      title: 'Mot de passe modifié',
      body: 'Ton mot de passe a bien été mis à jour. Tu peux maintenant te connecter à ton compte Klotho en toute sécurité.',
      login: 'Se connecter',
    },
    passwordRules: {
      title: 'Ton mot de passe doit contenir :',
    },
    logout: {
      action: 'Se déconnecter',
      confirmTitle: 'Se déconnecter ?',
      confirmBody:
        'Tu devras te reconnecter pour accéder à ton compte et à ton dressing.',
    },
  },
  tabs: {
    home: 'Accueil',
    wardrobe: 'Ma garde-robe',
    inspirations: 'Inspirations',
    calendar: 'Calendrier',
    me: 'Moi',
  },
  comingSoon: {
    title: 'Bientôt disponible',
    body: 'Cette partie de Klotho arrive dans une prochaine version.',
  },
  wardrobe: wardrobeFr,
  onboarding: onboardingFr,
  preferences: preferencesFr,
  weather: weatherFr,
  outfits: outfitsFr,
  privacy: privacyFr,
  notifications: notificationsFr,
  settings: settingsFr,
  states: statesFr,
  ai: aiFr,
  billing: billingFr,
  profile: {
    title: 'Mon profil',
    open: 'Ouvrir mon profil',
    overline: 'Mon univers mode, mes préférences',
    pieces_one: 'pièce',
    pieces_other: 'pièces',
    favorites_one: 'tenue favorite',
    favorites_other: 'tenues favorites',
    edit: 'Modifier',
    editPhoto: 'Changer ma photo',
    notifications: 'Notifications',
    notificationsOverline: 'Reste informée et inspirée',
    tips: 'Conseils et inspirations personnalisés',
    reminders: 'Rappels de tenues et suggestions',
    privacy: 'Confidentialité',
    help: 'Aide',
    favoriteOutfits: 'Mes tenues favorites',
    favoritePieces: 'Mes pièces favorites',
    history: 'Historique de mes tenues',
    ok: 'D’accord',
    dominantStyle: 'Style dominant',
    noDominantStyle: 'Ajoute des pièces pour le découvrir',
    styles: 'Mes styles préférés',
    stylesOverline: 'Sélectionne les styles qui te ressemblent',
    colors: 'Mes couleurs favorites',
    colorsOverline: 'Les couleurs qui illuminent ta garde-robe',
    metal: 'Mon métal préféré',
    metalOverline: 'Le détail qui fait la différence',
    units: 'Unités',
    unitsOverline: 'Choisis tes préférences',
    seeAll: 'Voir tout',
    add: 'Ajouter',
    empty: 'Rien de choisi pour l’instant.',
  },
  home: {
    greeting: 'Bonjour {{firstName}}',
    overline: 'Prête à écrire une nouvelle histoire aujourd’hui ?',
    generate: 'Générer ma tenue',
    dailyStyle: 'Mon style du jour',
    outfit: {
      title: 'Tenue du jour',
      overline: 'Une tenue pensée pour ta journée',
      soon: 'Bientôt disponible',
      generating: 'Je prépare ta tenue…',
      see: 'Voir la tenue',
    },
    rediscover: {
      overline: 'On l’oublie trop souvent',
      title: 'Redécouvre cette pièce',
      never: '« {{name}} » n’a pas encore été portée. Et si c’était son jour ?',
      since:
        '« {{name}} » n’a pas été portée depuis le {{date}}. Et si c’était son jour ?',
      open: 'Voir la pièce',
    },
    title: 'Bienvenue dans ton dressing',
    subtitle: 'Des tenues pensées à partir de tes vraies pièces.',
  },
  // Validation messages: keys are produced by the shared zod schemas.
  errors: {
    email: { invalid: 'Adresse email invalide' },
    firstName: {
      required: 'Indique ton prénom',
      tooLong: '50 caractères maximum',
    },
    password: {
      required: 'Saisis ton mot de passe',
      tooShort: 'Au moins 8 caractères',
      uppercase: 'Une majuscule',
      lowercase: 'Une minuscule',
      digit: 'Un chiffre',
      special: 'Un caractère spécial (ex. : ! ? @ # $ %)',
      tooLong: 'Mot de passe trop long',
      mismatch: 'Les mots de passe ne correspondent pas',
    },
    avatarUrl: { invalid: 'Image invalide' },
    bio: { tooLong: '200 caractères maximum' },
    preferences: {
      metal: 'Métal inconnu',
      bottoms: 'Choix inconnu',
      length: 'Longueur inconnue',
      colorConflict:
        'Une couleur ne peut pas être à la fois favorite et à éviter',
    },
    outfits: {
      occasion: 'Occasion inconnue',
      condition: 'Météo inconnue',
      role: 'Place inconnue dans la tenue',
      filter: 'Filtre inconnu',
      rating: 'Choisis « J’aime » ou « Je n’aime pas »',
      reason: 'Raison inconnue',
      note: '250 caractères maximum',
      day: 'Date invalide',
      period: 'La date de fin doit suivre la date de début',
    },
    notifications: {
      time: 'Heure invalide',
    },
    plans: {
      range: 'Période trop longue (deux mois au plus)',
      note: '500 caractères maximum',
    },
    weather: {
      coordinates: 'Position invalide',
      locationMode: 'Choix de localisation inconnu',
      unit: 'Unité inconnue',
      cityRequired: 'Choisis une ville',
      query: 'Saisis au moins 2 lettres',
    },
    wardrobe: {
      category: 'Choisis une catégorie',
      color: 'Choisis une couleur',
      style: 'Style inconnu',
      season: 'Saison inconnue',
      status: 'Statut inconnu',
      pattern: 'Motif inconnu',
      level: 'Choisis un niveau entre 1 et 5',
      temperature: 'Entre -30 °C et 50 °C',
      temperatureRange: 'Le maximum doit être supérieur au minimum',
      tooLong: 'Texte trop long',
      tooMany: 'Trop de choix',
    },
  },
  // API error codes (ApiErrorBody.code).
  apiErrors: {
    uploads: {
      invalidImage:
        'Ce fichier n’est pas une photo valide (JPEG, PNG ou WEBP).',
      tooLarge: 'Cette photo est trop lourde.',
      notFound: 'La photo n’a pas pu être ajoutée. Réessaie.',
      missingFile: 'Aucune photo n’a été envoyée.',
    },
    auth: {
      emailAlreadyUsed: 'Un compte existe déjà avec cet email.',
      invalidEmailToken:
        'Ce lien de confirmation n’est plus valide. Refais la demande depuis tes paramètres.',
      invalidCredentials: 'Email ou mot de passe incorrect.',
      invalidRefreshToken: 'Ta session a expiré. Reconnecte-toi.',
      invalidResetToken:
        'Ce lien a expiré ou a déjà été utilisé. Demande un nouveau lien.',
      unauthorized: 'Ta session a expiré. Reconnecte-toi.',
    },
    wardrobe: {
      photoLimitReached:
        'Tu as atteint le nombre maximum de photos pour cette pièce.',
      photoNotFound: 'Cette photo n’existe plus.',
      notFound: "Cette pièce n'existe plus.",
      invalidTemperatureRange: 'Le maximum doit être supérieur au minimum.',
    },
    outfits: {
      notFound: 'Cette tenue n’existe plus.',
      noOutfitPossible:
        'Pas assez de pièces adaptées pour composer une tenue avec ces choix. Essaie d’autres critères ou ajoute des pièces.',
      invalidReplacement: 'Cette pièce ne peut pas prendre cette place.',
      imposedItemNotFound: 'Cette pièce n’est plus dans ta garde-robe.',
      imposedItemUnavailable:
        'Cette pièce n’est pas disponible aujourd’hui (au lavage, prêtée…).',
      wearNotFound: 'Cette tenue n’est déjà plus dans ton historique.',
    },
    notifications: {
      notFound: 'Cette notification n’existe plus.',
      worn: 'Cette tenue est dans ton historique : elle ne peut pas être supprimée.',
    },
    plans: {
      notFound: 'Aucune tenue n’est prévue ce jour-là.',
      pastDay: 'Ce jour est déjà passé.',
    },
    billing: {
      pieceLimit:
        'Ton dressing a atteint la limite de la version gratuite. Passe à Premium pour ajouter d’autres pièces.',
      generationLimit:
        'Tu as utilisé toutes tes générations gratuites de la semaine.',
      storeUnavailable:
        'Impossible de vérifier ton achat pour le moment. Réessaie dans un instant.',
    },
    ai: {
      unavailable:
        'L’analyse n’est pas disponible pour le moment. Réessaie plus tard ou remplis la fiche toi-même.',
      quotaExceeded: 'Tu as utilisé toutes tes analyses offertes.',
      noGarment:
        'Klotho ne reconnaît pas de vêtement sur cette photo. Essaie avec une photo de la pièce bien visible.',
    },
    weather: {
      unavailable:
        'La météo est indisponible pour le moment. Réessaie plus tard.',
      locationMissing:
        'Choisis une ville ou autorise la localisation pour voir la météo.',
    },
    validation: { failed: 'Certains champs sont invalides.' },
    request: {
      tooMany: 'Trop de tentatives. Réessaie dans quelques minutes.',
      rateLimited: 'Trop de tentatives. Réessaie dans quelques minutes.',
    },
    users: {
      invalidPassword: 'Mot de passe incorrect.',
      invalidAvatar:
        'Cette photo ne peut pas être utilisée. Choisis-en une autre.',
      sameEmail: 'C’est déjà ton adresse actuelle.',
    },
    network:
      'Impossible de joindre le serveur. Vérifie ta connexion internet et réessaie.',
    unknown: 'Une erreur est survenue. Réessaie dans un instant.',
  },
} as const;

type DeepString<T> = {
  [K in keyof T]: T[K] extends string ? string : DeepString<T[K]>;
};

export type TranslationResource = DeepString<typeof fr>;
