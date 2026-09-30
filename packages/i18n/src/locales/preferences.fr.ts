// Onboarding and style preferences (texts of the onboarding mockups, tutoiement).
export const onboardingFr = {
  step: 'Étape {{current}}/{{total}}',
  continue: 'Continuer',
  finish: 'Terminer',
  back: 'Retour',
  welcome: {
    title: 'Bienvenue\ndans Klotho',
    overline: 'Compose des tenues\navec ta propre garde-robe',
    body: 'Photographie tes vêtements, et laisse Klotho créer des tenues qui te ressemblent, pour chaque moment de ta vie.',
    start: 'Commencer',
    skip: 'Passer pour l’instant',
  },
  styles: {
    title: 'Choisis tes styles',
    overline: 'Sélectionne les univers qui te ressemblent',
    seeAll: 'Voir tous les styles',
  },
  colors: {
    title: 'Tes couleurs favorites',
    overline: 'Aide Klotho à mieux composer tes tenues',
    body: 'Sélectionne les couleurs que tu aimes porter. Cela nous permettra de créer des tenues qui te ressemblent.',
  },
  practical: {
    title: 'Tes habitudes',
    overline: 'Pour des tenues qui te conviennent vraiment',
    body: 'Tout est facultatif, et modifiable plus tard dans Moi → Mes préférences.',
  },
  weather: {
    title: 'Météo & localisation',
    overline: 'Pour des tenues encore plus pertinentes',
    body: 'Autorise l’accès à ta localisation pour que Klotho te propose des tenues adaptées à la météo de ta région, chaque jour.',
    allow: 'Autoriser',
    chooseCity: 'Choisir ma ville manuellement',
    privacy:
      'Ta localisation est uniquement utilisée pour obtenir la météo de ta région. Elle reste confidentielle.',
    learnMore: 'En savoir plus',
    privacyTitle: 'Ta localisation',
    privacyDetails:
      'Klotho s’en sert seulement pour connaître la météo. Elle est arrondie à environ 1 km sur ton téléphone avant d’être envoyée, et n’est jamais enregistrée. Tu peux changer d’avis à tout moment dans Moi → Météo.',
    understood: 'J’ai compris',
  },
} as const;

export const preferencesFr = {
  title: 'Mes préférences',
  overline: 'Affine ton univers',
  open: 'Mes préférences',
  save: 'Enregistrer',
  saved: 'Préférences enregistrées',
  loadError: 'Impossible de charger tes préférences.',
  severalChoices: 'Plusieurs choix possibles',
  optional: 'Si tu le souhaites',
  noPreference: 'Pas de préférence',
  styles: 'Mes styles préférés',
  colors: 'Mes couleurs favorites',
  colorsHint: 'Sélectionne plusieurs couleurs',
  avoided: 'Couleurs à éviter',
  avoidedHint:
    'Elles seront moins proposées, sans être interdites. Une couleur ne peut pas être à la fois favorite et à éviter.',
  face: 'Couleurs près du visage',
  faceHint:
    'Celles qui illuminent ton teint : hauts, foulards, boucles d’oreilles…',
  colorSeason: 'Ma colorimétrie',
  colorSeasonHint: 'Ta saison de couleurs, si tu la connais.',
  metal: 'Mes métaux préférés',
  metalHint: 'Coche-en plusieurs si tu aimes les mélanger.',
  metals: {
    gold: 'Doré',
    silver: 'Argenté',
    roseGold: 'Rosé',
  },
  heels: 'Les talons',
  heelsYes: 'J’en porte',
  heelsNo: 'Je préfère éviter',
  bottoms: 'Je porte volontiers',
  bottomOptions: {
    skirts: 'Des jupes',
    dresses: 'Des robes',
    trousers: 'Des pantalons',
  },
  formality: 'Mon niveau de formalité',
  length: 'Longueur minimale',
  lengthHint: 'Les jupes et robes plus courtes seront moins proposées.',
  lengths: {
    mini: 'Courte',
    knee: 'Au genou',
    midi: 'Midi',
    maxi: 'Longue',
  },
  neckline: 'Décolleté',
  necklineAvoid: 'Éviter les décolletés profonds',
  necklineAny: 'Peu importe',
} as const;
