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
 * Union of the styles of the specification and of the mockups, most common
 * first (the app shows the first ones and hides the rest behind "Voir tout").
 */
export const STYLES = [
  'romantic',
  'casual',
  'chic',
  'minimalist',
  'classic',
  'boho',
  'vintage',
  'business',
  'y2k',
  'parisian',
  'preppy',
  'oldMoney',
  'evening',
  'streetwear',
  'sporty',
  'rock',
  'glamour',
  'coquette',
  'cottagecore',
  'artsy',
  'vintage50s',
  'vintage60s',
  'victorian',
] as const;
export type Style = (typeof STYLES)[number];

/** Palette of the mockups ("Palette complète"), plus common basics. */
export const COLORS = {
  white: '#FFFFFF',
  offWhite: '#F7F2EA',
  ecru: '#FAEFE1',
  sand: '#EAD8C6',
  linen: '#DFCBB9',
  taupe: '#9E8370',
  caramel: '#C1885A',
  chocolate: '#6E4533',
  powderPink: '#EFCDC4',
  nudePink: '#D19B8D',
  oldRose: '#CFA397',
  raspberry: '#914046',
  red: '#C33F36',
  terracotta: '#B26849',
  orange: '#EA7D4A',
  softYellow: '#F8DDA6',
  lemon: '#FBE9A8',
  sage: '#A7AB96',
  olive: '#7D7555',
  skyBlue: '#BBCAD9',
  denim: '#69809A',
  navy: '#2D3847',
  lilac: '#CAB9C6',
  plum: '#805556',
  grey: '#9F9893',
  black: '#343434',
  gold: '#C9A27A',
  silver: '#C0C0C4',
} as const;
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
