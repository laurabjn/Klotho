// "Le look complet" (Premium): a hairstyle and a makeup look for an outfit.

/** Optional profile fields that narrow the suggestions. */
export const HAIR_LENGTHS = ['short', 'medium', 'long'] as const;
export type HairLength = (typeof HAIR_LENGTHS)[number];

export const HAIR_TEXTURES = ['straight', 'wavy', 'curly', 'coily'] as const;
export type HairTexture = (typeof HAIR_TEXTURES)[number];

/** "none": hairstyle only; "light": the lightest makeup looks only. */
export const MAKEUP_PREFERENCES = ['none', 'light', 'any'] as const;
export type MakeupPreference = (typeof MAKEUP_PREFERENCES)[number];

export const HAIRSTYLES = [
  'lowBun',
  'messyBun',
  'frenchTwist',
  'victorianUpdo',
  'halfBun',
  'spaceBuns',
  'highPonytail',
  'ribbonPonytail',
  'sleekPonytail',
  'dutchBraid',
  'fishtailBraid',
  'braidedCrown',
  'halfUp',
  'glamWaves',
  'retroCurls',
  'sixtiesVolume',
  'beachWaves',
  'sleekStraight',
  'tuckedBob',
  'wetLook',
  'definedCurls',
  'texturedPixie',
  'headband',
  'headscarf',
  'hairClips',
] as const;
export type Hairstyle = (typeof HAIRSTYLES)[number];

export const MAKEUP_LOOKS = [
  'naturalNude',
  'freshGlow',
  'rosyMonochrome',
  'sportProof',
  'powderPink',
  'peachGlow',
  'sunBronze',
  'officeFresh',
  'classicRed',
  'graphicLiner',
  'softSmoky',
  'berryLips',
  'y2kGloss',
  'glitter',
  'victorianPale',
] as const;
export type MakeupLook = (typeof MAKEUP_LOOKS)[number];

/** Why a suggestion was made, most important first. */
export const LOOK_REASONS = [
  'wet',
  'hot',
  'cold',
  'occasion',
  'style',
  'colors',
  'hair',
] as const;
export type LookReason = (typeof LOOK_REASONS)[number];

export interface LookSuggestion<K extends string> {
  key: K;
  reasons: LookReason[];
}

/** Suggestions offered for one look. */
export const LOOK_SUGGESTIONS_MAX = 2;

/** As returned by GET /outfits/:id/look: best first, no makeup for "none". */
export interface CompleteLook {
  hairstyles: LookSuggestion<Hairstyle>[];
  makeups: LookSuggestion<MakeupLook>[];
}
