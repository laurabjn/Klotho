// Wardrobe vocabulary shared by the API, the app and (later) the outfit engine.
// Values are stable keys stored in the database; labels live in packages/i18n
// under wardrobe.<group>.<key>.

/** Outfit roles. UNDERWEAR is catalogued but never used to build outfits. */
export const WARDROBE_CATEGORIES = [
  'TOP',
  'BOTTOM',
  'DRESS',
  'LAYER',
  'SHOES',
  'BAG',
  'ACCESSORY',
  'JEWELRY',
  'UNDERWEAR',
] as const;
export type WardrobeCategory = (typeof WARDROBE_CATEGORIES)[number];

/** Only AVAILABLE items can be proposed in outfits. */
export const WARDROBE_STATUSES = [
  'AVAILABLE',
  'WASHING',
  'LENT',
  'ARCHIVED',
  'SOLD',
  'DONATED',
] as const;
export type WardrobeStatus = (typeof WARDROBE_STATUSES)[number];

export const SEASONS = ['spring', 'summer', 'autumn', 'winter'] as const;
export type Season = (typeof SEASONS)[number];

/**
 * Union of the styles of the specification and of the mockups, in the order
 * of the mockups ("Choisis tes styles" shows the first nine, "Voir tout" the rest).
 */
export const STYLES = [
  'romantic',
  'vintage',
  'casual',
  'chic',
  'business',
  'minimalist',
  'boho',
  'y2k',
  'classic',
  'parisian',
  'cottagecore',
  'preppy',
  'oldMoney',
  'evening',
  'sporty',
  'artsy',
  'streetwear',
  'rock',
  'glamour',
  'coquette',
  'vintage50s',
  'vintage60s',
  'victorian',
] as const;
export type Style = (typeof STYLES)[number];

/**
 * Palette of the mockups ("Palette complète"), plus common basics, grouped by
 * family. Items store the key, so keys are never renamed.
 */
export const COLOR_FAMILIES = {
  neutrals: {
    white: '#FFFFFF',
    offWhite: '#F7F2EA',
    ecru: '#FAEFE1',
    lightGrey: '#D6D3CF',
    grey: '#9F9893',
    charcoal: '#4B4A4C',
    black: '#343434',
  },
  browns: {
    sand: '#EAD8C6',
    linen: '#DFCBB9',
    taupe: '#9E8370',
    camel: '#C19A6B',
    caramel: '#C1885A',
    cognac: '#9A5B32',
    chocolate: '#6E4533',
  },
  pinksAndReds: {
    powderPink: '#EFCDC4',
    nudePink: '#D19B8D',
    oldRose: '#CFA397',
    coral: '#EE8572',
    fuchsia: '#C8407F',
    raspberry: '#914046',
    red: '#C33F36',
    burgundy: '#6E2233',
  },
  warm: {
    peach: '#F6C3A5',
    orange: '#EA7D4A',
    terracotta: '#B26849',
    mustard: '#D1A53A',
    softYellow: '#F8DDA6',
    lemon: '#F2D54A',
  },
  greens: {
    mint: '#BFDCC8',
    sage: '#A7AB96',
    khaki: '#A39A6E',
    olive: '#7D7555',
    emerald: '#2E7D5B',
    forestGreen: '#2F4A3A',
  },
  blues: {
    skyBlue: '#BBCAD9',
    turquoise: '#4FB3B0',
    denim: '#69809A',
    petrol: '#2E5E6B',
    royalBlue: '#3057A8',
    navy: '#2D3847',
  },
  purples: {
    lilac: '#CAB9C6',
    mauve: '#B48AA3',
    purple: '#6B4A8C',
    plum: '#805556',
  },
  metallics: {
    gold: '#C9A27A',
    silver: '#C0C0C4',
  },
} as const;
export type ColorFamily = keyof typeof COLOR_FAMILIES;
export const COLOR_FAMILY_KEYS = Object.keys(COLOR_FAMILIES) as ColorFamily[];

export const COLORS = {
  ...COLOR_FAMILIES.neutrals,
  ...COLOR_FAMILIES.browns,
  ...COLOR_FAMILIES.pinksAndReds,
  ...COLOR_FAMILIES.warm,
  ...COLOR_FAMILIES.greens,
  ...COLOR_FAMILIES.blues,
  ...COLOR_FAMILIES.purples,
  ...COLOR_FAMILIES.metallics,
};
export type ColorKey = keyof typeof COLORS;
export const COLOR_KEYS = Object.keys(COLORS) as [ColorKey, ...ColorKey[]];

export const PATTERNS = [
  'plain',
  'striped',
  'checked',
  'floral',
  'dotted',
  'animal',
  'graphic',
  'other',
] as const;
export type Pattern = (typeof PATTERNS)[number];

/** Suggested sub-categories (the field stays free text in the database). */
export const SUBCATEGORIES: Record<WardrobeCategory, readonly string[]> = {
  TOP: [
    'tshirt',
    'tankTop',
    'shirt',
    'blouse',
    'sweater',
    'cardigan',
    'bodysuit',
    'corset',
  ],
  BOTTOM: [
    'trousers',
    'jeans',
    'shorts',
    'shortSkirt',
    'midiSkirt',
    'longSkirt',
  ],
  DRESS: [
    'shortDress',
    'midiDress',
    'longDress',
    'casualDress',
    'eveningDress',
  ],
  LAYER: [
    'blazer',
    'jacket',
    'coat',
    'trench',
    'vest',
    'leatherJacket',
    'puffer',
  ],
  SHOES: [
    'sneakers',
    'ankleBoots',
    'boots',
    'pumps',
    'sandals',
    'loafers',
    'flats',
  ],
  BAG: ['handbag', 'crossbody', 'tote', 'backpack', 'clutch'],
  ACCESSORY: [
    'belt',
    'scarf',
    'hat',
    'beanie',
    'gloves',
    'sunglasses',
    'hairAccessory',
  ],
  JEWELRY: ['earrings', 'necklace', 'bracelet', 'ring', 'brooch', 'watch'],
  UNDERWEAR: ['bra', 'briefs', 'tights', 'socks', 'lingerie'],
};

export const LEVEL_MIN = 1;
export const LEVEL_MAX = 5;
export const TEMPERATURE_MIN = -30;
export const TEMPERATURE_MAX = 50;

/** Formats accepted at upload; the server re-encodes everything to JPEG. */
export const ACCEPTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

/** Default photo limit per item (the API can be configured differently). */
export const PHOTOS_MAX_PER_ITEM = 5;
