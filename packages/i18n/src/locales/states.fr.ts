// State screens: empty, loading, no result, no connection, permissions,
// photo upload (the "états" board of the mockups).
export const statesFr = {
  emptyWardrobe: {
    title: 'Mon dressing est encore vide',
    body: 'Ajoute tes premières pièces pour que Klotho puisse créer des tenues qui te ressemblent.',
    add: 'Ajouter ma première pièce',
    example: 'Voir un exemple',
  },
  generating: {
    title: 'Klotho crée tes tenues…',
    steps: {
      wardrobe: 'Analyse de ton dressing',
      weather: 'Prise en compte de la météo',
      match: 'Association des pièces',
      finish: 'Finalisation des tenues…',
    },
    quote: '« Un instant… La tenue parfaite se prépare »',
  },
  noOutfit: {
    title: 'Aucune tenue compatible pour le moment',
    body: 'Avec la météo actuelle et tes critères, aucune tenue adaptée n’a été trouvée. Tu peux ajuster quelques paramètres pour obtenir des propositions.',
    adjust: 'Ajuster mes critères',
    all: 'Voir toutes les tenues',
  },
  offline: {
    title: 'Problème de connexion',
    body: 'Impossible de se connecter au serveur. Vérifie ta connexion internet et réessaie.',
    retry: 'Réessayer',
    offlineMode: 'Continuer hors ligne',
  },
  photos: {
    title: 'Autoriser l’accès à tes photos',
    body: 'Cela permet d’ajouter facilement tes pièces à ton dressing, en les prenant en photo ou en les important depuis ta galerie.',
    allow: 'Autoriser l’accès',
    later: 'Plus tard',
  },
  location: {
    title: 'Autorisation de localisation',
    body: 'La localisation permet d’adapter les tenues à la météo de ta ville. Tu peux la saisir manuellement ou modifier l’autorisation plus tard dans les réglages.',
    manual: 'Saisir ma ville manuellement',
    settings: 'Ouvrir les réglages',
  },
  noResult: {
    title: 'Aucune pièce trouvée',
    body: 'Aucune pièce ne correspond à ta recherche « {{query}} ».',
    bodyFilters: 'Aucune pièce ne correspond à ces filtres.',
    clear: 'Effacer les filtres',
  },
  upload: {
    title: 'Ajouter une pièce',
    sending: 'Envoi de la photo en cours…',
    sendingCount: 'Envoi des photos en cours… ({{done}}/{{total}})',
    keepOpen: 'Garde l’application ouverte pendant l’envoi.',
    successTitle: 'Photo ajoutée !',
    successBody: 'Ta pièce a bien été ajoutée à ton dressing.',
    details: 'Compléter les détails',
    another: 'Ajouter une autre pièce',
    errorTitle: 'Une erreur est survenue',
    errorBody:
      'La photo n’a pas pu être envoyée. Vérifie ta connexion internet et réessaie.',
    retry: 'Réessayer',
    cancel: 'Annuler',
  },
} as const;
