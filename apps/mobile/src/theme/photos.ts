import type { Occasion, Style } from '@klotho/shared';

// Editorial photos of the mockups. Provisional crops of the mockup boards:
// replace the files (same names) with the HD versions, then update the ratios.

interface Photo {
  source: number;
  /** Width / height. */
  ratio: number;
}

export const photos = {
  login: { source: require('../../assets/photos/login.jpg'), ratio: 735 / 507 },
  register: {
    source: require('../../assets/photos/register.jpg'),
    ratio: 369 / 553,
  },
  forgotPassword: {
    source: require('../../assets/photos/forgot-password.jpg'),
    ratio: 735 / 608,
  },
  passwordChanged: {
    source: require('../../assets/photos/password-changed.jpg'),
    ratio: 735 / 690,
  },
  changeEmail: {
    source: require('../../assets/photos/change-email.jpg'),
    ratio: 280 / 360,
  },
  planned: {
    source: require('../../assets/photos/planned.jpg'),
    ratio: 420 / 225,
  },
  passwordFooter: {
    source: require('../../assets/photos/password-footer.jpg'),
    ratio: 735 / 250,
  },
  welcome: {
    source: require('../../assets/photos/welcome.jpg'),
    ratio: 735 / 524,
  },
  weather: {
    source: require('../../assets/photos/weather.jpg'),
    ratio: 735 / 650,
  },
  colorsFooter: {
    source: require('../../assets/photos/colors-footer.jpg'),
    ratio: 735 / 120,
  },
  outfitOfTheDay: {
    source: require('../../assets/photos/outfit-of-the-day.jpg'),
    ratio: 360 / 428,
  },
} satisfies Record<string, Photo>;

/** Occasion cards of "Créer une tenue"; the others show an icon. */
export const occasionPhotos: Partial<Record<Occasion, number>> = {
  everyday: require('../../assets/occasions/everyday.jpg'),
  work: require('../../assets/occasions/work.jpg'),
  date: require('../../assets/occasions/date.jpg'),
};

/** Square-ish thumbnails of the style cards; styles without one show an icon. */
export const stylePhotos: Partial<Record<Style, number>> = {
  romantic: require('../../assets/styles/romantic.jpg'),
  casual: require('../../assets/styles/casual.jpg'),
  chic: require('../../assets/styles/chic.jpg'),
  minimalist: require('../../assets/styles/minimalist.jpg'),
  classic: require('../../assets/styles/classic.jpg'),
  boho: require('../../assets/styles/boho.jpg'),
  vintage: require('../../assets/styles/vintage.jpg'),
  business: require('../../assets/styles/business.jpg'),
  y2k: require('../../assets/styles/y2k.jpg'),
  parisian: require('../../assets/styles/parisian.jpg'),
  preppy: require('../../assets/styles/preppy.jpg'),
  oldMoney: require('../../assets/styles/oldMoney.jpg'),
  evening: require('../../assets/styles/evening.jpg'),
  sporty: require('../../assets/styles/sporty.jpg'),
  cottagecore: require('../../assets/styles/cottagecore.jpg'),
  artsy: require('../../assets/styles/artsy.jpg'),
  streetwear: require('../../assets/styles/streetwear.jpg'),
  rock: require('../../assets/styles/rock.jpg'),
  glamour: require('../../assets/styles/glamour.jpg'),
  coquette: require('../../assets/styles/coquette.jpg'),
  vintage50s: require('../../assets/styles/vintage50s.jpg'),
  vintage60s: require('../../assets/styles/vintage60s.jpg'),
  victorian: require('../../assets/styles/victorian.jpg'),
};

/** Illustrations of the state screens (provisional crops of the board). */
export const statePhotos = {
  emptyWardrobe: require('../../assets/states/empty-wardrobe.jpg'),
  generating: require('../../assets/states/generating.jpg'),
  noOutfit: require('../../assets/states/no-outfit.jpg'),
  offline: require('../../assets/states/offline.jpg'),
  photos: require('../../assets/states/photos.jpg'),
  location: require('../../assets/states/location.jpg'),
  search: require('../../assets/states/search.jpg'),
} as const;
