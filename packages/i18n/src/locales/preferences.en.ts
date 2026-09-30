import type { TranslationResource } from './fr';

export const onboardingEn: TranslationResource['onboarding'] = {
  step: 'Step {{current}}/{{total}}',
  continue: 'Continue',
  finish: 'Finish',
  back: 'Back',
  welcome: {
    title: 'Welcome\nto Klotho',
    overline: 'Create outfits\nwith your own wardrobe',
    body: 'Photograph your clothes and let Klotho create outfits that feel like you, for every moment of your life.',
    start: 'Get started',
    skip: 'Skip for now',
  },
  styles: {
    title: 'Choose your styles',
    overline: 'Select the worlds that feel like you',
    seeAll: 'See all styles',
  },
  colors: {
    title: 'Your favourite colours',
    overline: 'Help Klotho create better outfits',
    body: 'Select the colours you love to wear, so we can create outfits that feel like you.',
  },
  practical: {
    title: 'Your habits',
    overline: 'For outfits that really suit you',
    body: 'Everything is optional and can be changed later in Me → My preferences.',
  },
  weather: {
    title: 'Weather & location',
    overline: 'For even more relevant outfits',
    body: 'Allow access to your location so Klotho suggests outfits suited to the weather where you are, every day.',
    allow: 'Allow',
    chooseCity: 'Choose my city manually',
    privacy:
      'Your location is only used to get the weather where you are. It stays private.',
    learnMore: 'Learn more',
    privacyTitle: 'Your location',
    privacyDetails:
      'Klotho only uses it to get the weather. It is rounded to about 1 km on your phone before being sent, and never saved. You can change your mind at any time in Me → Weather.',
    understood: 'Got it',
  },
};

export const preferencesEn: TranslationResource['preferences'] = {
  title: 'My preferences',
  overline: 'Refine your style',
  open: 'My preferences',
  save: 'Save',
  saved: 'Preferences saved',
  loadError: 'Could not load your preferences.',
  severalChoices: 'Several choices possible',
  optional: 'If you wish',
  noPreference: 'No preference',
  styles: 'My favourite styles',
  colors: 'My favourite colours',
  colorsHint: 'Select several colours',
  avoided: 'Colours to avoid',
  avoidedHint:
    'They will be suggested less, not forbidden. A colour cannot be both a favourite and to avoid.',
  face: 'Colours near the face',
  faceHint: 'The ones that brighten your complexion: tops, scarves, earrings…',
  colorSeason: 'My colour season',
  colorSeasonHint: 'Your colour season, if you know it.',
  metal: 'My favourite metals',
  metalHint: 'Tick several if you like mixing them.',
  metals: {
    gold: 'Gold',
    silver: 'Silver',
    roseGold: 'Rose gold',
  },
  heels: 'Heels',
  heelsYes: 'I wear them',
  heelsNo: 'I prefer to avoid them',
  bottoms: 'I happily wear',
  bottomOptions: {
    skirts: 'Skirts',
    dresses: 'Dresses',
    trousers: 'Trousers',
  },
  formality: 'My formality level',
  length: 'Minimum length',
  lengthHint: 'Shorter skirts and dresses will be suggested less.',
  lengths: {
    mini: 'Short',
    knee: 'Knee length',
    midi: 'Midi',
    maxi: 'Long',
  },
  neckline: 'Neckline',
  necklineAvoid: 'Avoid deep necklines',
  necklineAny: 'Doesn’t matter',
};
