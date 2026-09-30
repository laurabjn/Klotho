// French is the reference locale: every other locale must match its keys.
// Tone: tutoiement everywhere.
export const fr = {
  common: {
    appName: 'Klotho',
    loading: 'Chargement…',
    error: 'Une erreur est survenue.',
    retry: 'Réessayer',
    cancel: 'Annuler',
    or: 'ou',
    back: 'Retour',
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
    },
    forgotPassword: {
      title: 'Mot de passe oublié',
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
  home: {
    greeting: 'Bonjour {{firstName}}',
    overline: 'Envie d’écrire une nouvelle histoire aujourd’hui ?',
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
  },
  // API error codes (ApiErrorBody.code).
  apiErrors: {
    auth: {
      emailAlreadyUsed: 'Un compte existe déjà avec cet email.',
      invalidCredentials: 'Email ou mot de passe incorrect.',
      invalidRefreshToken: 'Ta session a expiré. Reconnecte-toi.',
      invalidResetToken:
        'Ce lien a expiré ou a déjà été utilisé. Demande un nouveau lien.',
      unauthorized: 'Ta session a expiré. Reconnecte-toi.',
    },
    validation: { failed: 'Certains champs sont invalides.' },
    request: { tooMany: 'Trop de tentatives. Réessaie dans quelques minutes.' },
    network:
      'Impossible de joindre le serveur. Vérifie ta connexion internet et réessaie.',
    unknown: 'Une erreur est survenue. Réessaie dans un instant.',
  },
} as const;

type DeepString<T> = {
  [K in keyof T]: T[K] extends string ? string : DeepString<T[K]>;
};

export type TranslationResource = DeepString<typeof fr>;
