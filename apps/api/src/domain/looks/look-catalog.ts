import type {
  ColorFamily,
  HairLength,
  HairTexture,
  Hairstyle,
  MakeupLook,
  Style,
} from '@klotho/shared';

/** Formality (1 "très décontracté" … 5 "très habillé") a look suits, inclusive. */
type FormalityRange = readonly [number, number];

export interface HairstyleTraits {
  lengths: readonly HairLength[];
  /** Absent: every texture. */
  textures?: readonly HairTexture[];
  formality: FormalityRange;
  styles: readonly Style[];
  /** Stays in place under rain, wind and heat (tied up, braided, covered…). */
  holds: boolean;
}

/** Warm (peach, bronze), cool (pink, berry) or neutral shades. */
export type Tone = 'warm' | 'cool' | 'neutral';

export interface MakeupTraits {
  /** 1 light, 2 noticeable, 3 bold. */
  intensity: 1 | 2 | 3;
  tone: Tone;
  formality: FormalityRange;
  styles: readonly Style[];
  /** Long-wearing: fine under rain and on the move. */
  holds: boolean;
  /** A colourful look, best when it echoes a colour of the outfit. */
  echoes?: readonly ColorFamily[];
}

const ALL: readonly HairLength[] = ['short', 'medium', 'long'];
const MEDIUM_LONG: readonly HairLength[] = ['medium', 'long'];
const SMOOTH: readonly HairTexture[] = ['straight', 'wavy'];

export const HAIRSTYLE_TRAITS: Record<Hairstyle, HairstyleTraits> = {
  lowBun: {
    lengths: MEDIUM_LONG,
    formality: [3, 5],
    styles: [
      'chic',
      'classic',
      'oldMoney',
      'business',
      'evening',
      'minimalist',
    ],
    holds: true,
  },
  messyBun: {
    lengths: MEDIUM_LONG,
    formality: [1, 3],
    styles: ['casual', 'boho', 'sporty', 'streetwear', 'cottagecore'],
    holds: true,
  },
  frenchTwist: {
    lengths: MEDIUM_LONG,
    formality: [3, 5],
    styles: ['glamour', 'evening', 'vintage', 'chic', 'parisian'],
    holds: true,
  },
  victorianUpdo: {
    lengths: ['long'],
    formality: [3, 5],
    styles: ['victorian', 'romantic', 'cottagecore'],
    holds: true,
  },
  halfBun: {
    lengths: MEDIUM_LONG,
    formality: [1, 3],
    styles: ['y2k', 'casual', 'streetwear', 'artsy'],
    holds: false,
  },
  spaceBuns: {
    lengths: MEDIUM_LONG,
    formality: [1, 2],
    styles: ['y2k', 'streetwear', 'artsy'],
    holds: true,
  },
  highPonytail: {
    lengths: MEDIUM_LONG,
    formality: [1, 3],
    styles: ['sporty', 'casual', 'y2k', 'preppy'],
    holds: true,
  },
  ribbonPonytail: {
    lengths: MEDIUM_LONG,
    formality: [2, 4],
    styles: ['coquette', 'romantic', 'preppy', 'vintage'],
    holds: true,
  },
  sleekPonytail: {
    lengths: MEDIUM_LONG,
    formality: [3, 5],
    styles: ['business', 'minimalist', 'evening', 'glamour', 'chic'],
    holds: true,
  },
  dutchBraid: {
    lengths: MEDIUM_LONG,
    formality: [1, 3],
    styles: ['sporty', 'casual', 'boho'],
    holds: true,
  },
  fishtailBraid: {
    lengths: ['long'],
    formality: [1, 3],
    styles: ['boho', 'cottagecore', 'romantic'],
    holds: true,
  },
  braidedCrown: {
    lengths: MEDIUM_LONG,
    formality: [2, 5],
    styles: ['cottagecore', 'romantic', 'victorian', 'boho'],
    holds: true,
  },
  halfUp: {
    lengths: MEDIUM_LONG,
    formality: [1, 4],
    styles: ['romantic', 'coquette', 'classic', 'preppy'],
    holds: false,
  },
  glamWaves: {
    lengths: MEDIUM_LONG,
    textures: SMOOTH,
    formality: [4, 5],
    styles: ['glamour', 'evening', 'vintage50s', 'oldMoney'],
    holds: false,
  },
  retroCurls: {
    lengths: ['short', 'medium'],
    formality: [2, 5],
    styles: ['vintage50s', 'vintage', 'glamour'],
    holds: false,
  },
  sixtiesVolume: {
    lengths: MEDIUM_LONG,
    formality: [2, 4],
    styles: ['vintage60s', 'vintage', 'rock'],
    holds: false,
  },
  beachWaves: {
    lengths: MEDIUM_LONG,
    textures: SMOOTH,
    formality: [1, 3],
    styles: ['boho', 'casual', 'parisian', 'cottagecore'],
    holds: false,
  },
  sleekStraight: {
    lengths: ALL,
    textures: SMOOTH,
    formality: [2, 5],
    styles: ['minimalist', 'business', 'chic', 'y2k'],
    holds: false,
  },
  tuckedBob: {
    lengths: ['short', 'medium'],
    formality: [1, 4],
    styles: ['parisian', 'chic', 'minimalist', 'classic'],
    holds: false,
  },
  wetLook: {
    lengths: ['short', 'medium'],
    formality: [3, 5],
    styles: ['rock', 'evening', 'artsy', 'glamour'],
    holds: true,
  },
  definedCurls: {
    lengths: ALL,
    textures: ['curly', 'coily'],
    formality: [1, 4],
    styles: ['casual', 'boho', 'artsy', 'romantic', 'streetwear'],
    holds: false,
  },
  texturedPixie: {
    lengths: ['short'],
    formality: [1, 4],
    styles: ['rock', 'artsy', 'minimalist', 'streetwear', 'casual'],
    holds: true,
  },
  headband: {
    lengths: ALL,
    formality: [1, 4],
    styles: ['preppy', 'oldMoney', 'classic', 'vintage60s'],
    holds: false,
  },
  headscarf: {
    lengths: ALL,
    formality: [1, 3],
    styles: ['parisian', 'vintage', 'boho', 'vintage50s'],
    holds: true,
  },
  hairClips: {
    lengths: ALL,
    formality: [1, 3],
    styles: ['y2k', 'coquette', 'casual', 'artsy'],
    holds: false,
  },
};

export const MAKEUP_TRAITS: Record<MakeupLook, MakeupTraits> = {
  naturalNude: {
    intensity: 1,
    tone: 'neutral',
    formality: [1, 4],
    styles: ['minimalist', 'casual', 'classic', 'business', 'parisian'],
    holds: false,
  },
  freshGlow: {
    intensity: 1,
    tone: 'warm',
    formality: [1, 3],
    styles: ['boho', 'cottagecore', 'casual', 'sporty'],
    holds: false,
  },
  rosyMonochrome: {
    intensity: 1,
    tone: 'cool',
    formality: [1, 4],
    styles: ['parisian', 'romantic', 'minimalist', 'coquette'],
    holds: false,
  },
  sportProof: {
    intensity: 1,
    tone: 'neutral',
    formality: [1, 2],
    styles: ['sporty', 'streetwear', 'casual'],
    holds: true,
  },
  powderPink: {
    intensity: 2,
    tone: 'cool',
    formality: [2, 4],
    styles: ['romantic', 'coquette', 'cottagecore', 'victorian'],
    holds: false,
  },
  peachGlow: {
    intensity: 2,
    tone: 'warm',
    formality: [1, 4],
    styles: ['boho', 'casual', 'preppy', 'cottagecore'],
    holds: false,
  },
  sunBronze: {
    intensity: 2,
    tone: 'warm',
    formality: [1, 3],
    styles: ['boho', 'casual', 'sporty'],
    holds: false,
  },
  officeFresh: {
    intensity: 1,
    tone: 'neutral',
    formality: [3, 4],
    styles: ['business', 'classic', 'oldMoney', 'minimalist'],
    holds: true,
  },
  classicRed: {
    intensity: 3,
    tone: 'neutral',
    formality: [3, 5],
    styles: ['parisian', 'vintage50s', 'chic', 'evening', 'classic', 'glamour'],
    holds: false,
  },
  graphicLiner: {
    intensity: 2,
    tone: 'neutral',
    formality: [2, 5],
    styles: ['vintage60s', 'rock', 'chic', 'y2k', 'artsy'],
    holds: false,
  },
  softSmoky: {
    intensity: 3,
    tone: 'cool',
    formality: [3, 5],
    styles: ['evening', 'rock', 'glamour'],
    holds: false,
  },
  berryLips: {
    intensity: 2,
    tone: 'cool',
    formality: [2, 5],
    styles: ['rock', 'artsy', 'vintage', 'oldMoney'],
    holds: false,
  },
  y2kGloss: {
    intensity: 2,
    tone: 'cool',
    formality: [1, 3],
    styles: ['y2k', 'streetwear', 'coquette'],
    holds: false,
  },
  glitter: {
    intensity: 3,
    tone: 'neutral',
    formality: [4, 5],
    styles: ['evening', 'glamour', 'y2k'],
    holds: false,
  },
  victorianPale: {
    intensity: 2,
    tone: 'cool',
    formality: [3, 5],
    styles: ['victorian', 'romantic'],
    holds: false,
  },
  coloredLiner: {
    intensity: 2,
    tone: 'cool',
    formality: [1, 4],
    styles: ['y2k', 'artsy', 'streetwear', 'rock', 'casual'],
    holds: false,
    echoes: ['blues', 'greens', 'purples'],
  },
  pastelEyes: {
    intensity: 2,
    tone: 'cool',
    formality: [1, 4],
    styles: ['romantic', 'coquette', 'cottagecore', 'y2k', 'artsy'],
    holds: false,
    echoes: ['purples', 'greens', 'blues'],
  },
  sunsetEyes: {
    intensity: 3,
    tone: 'warm',
    formality: [2, 5],
    styles: ['boho', 'evening', 'glamour', 'artsy'],
    holds: false,
    echoes: ['warm', 'pinksAndReds'],
  },
  brightLips: {
    intensity: 3,
    tone: 'neutral',
    formality: [2, 5],
    styles: ['artsy', 'y2k', 'chic', 'streetwear', 'evening'],
    holds: false,
    echoes: ['pinksAndReds', 'warm'],
  },
  jewelEyes: {
    intensity: 3,
    tone: 'cool',
    formality: [3, 5],
    styles: ['evening', 'glamour', 'artsy', 'rock'],
    holds: false,
    echoes: ['greens', 'blues', 'purples'],
  },
};
