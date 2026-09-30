// Onboarding and style preferences (texts of the onboarding mockups, tutoiement).
export const onboardingFr = {
  step: 'Étape {{current}}/{{total}}',
  continue: 'Continuer',
  finish: 'Terminer',
  back: 'Retour',
  welcome: {
    title: 'Bienvenue dans Klotho',
    overline: 'Compose des tenues avec ta propre garde-robe',
    body: 'Photographie tes vêtements, et laisse Klotho créer des tenues qui te ressemblent, pour chaque moment de ta vie.',
    start: 'Commencer',
    skip: 'Passer pour l’instant',
  },
  styles: {
    title: 'Choisis tes styles',
    overline: 'Sélectionne les univers qui te ressemblent',
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
