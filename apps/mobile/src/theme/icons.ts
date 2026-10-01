import type { MaterialCommunityIcons } from '@expo/vector-icons';
import type {
  Occasion,
  Season,
  Style,
  WardrobeCategory,
  WardrobeStatus,
} from '@klotho/shared';

export type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

// Icons of the mockups' chips and cards (MaterialCommunityIcons).

export const categoryIcons: Record<WardrobeCategory, IconName> = {
  TOP: 'tshirt-crew-outline',
  BOTTOM: 'human-male-height-variant', // no trousers glyph in the set
  DRESS: 'human-female',
  LAYER: 'hanger',
  SHOES: 'shoe-heel',
  BAG: 'purse-outline',
  ACCESSORY: 'sunglasses',
  JEWELRY: 'necklace',
  UNDERWEAR: 'tshirt-v-outline',
};

export const styleIcons: Record<Style, IconName> = {
  romantic: 'flower-outline',
  vintage: 'camera-outline',
  casual: 'hanger',
  chic: 'glass-cocktail',
  business: 'briefcase-outline',
  minimalist: 'circle-outline',
  boho: 'leaf',
  y2k: 'butterfly-outline',
  classic: 'pillar',
  parisian: 'eiffel-tower',
  cottagecore: 'flower-tulip-outline',
  preppy: 'shield-outline',
  oldMoney: 'pillar',
  evening: 'glass-wine',
  sporty: 'dumbbell',
  artsy: 'palette-outline',
  streetwear: 'skateboard',
  rock: 'guitar-electric',
  glamour: 'diamond-stone',
  coquette: 'ribbon',
  vintage50s: 'record-player',
  vintage60s: 'flower-poppy',
  victorian: 'crown-outline',
};

export const occasionIcons: Record<Occasion, IconName> = {
  walk: 'walk',
  everyday: 'coffee-outline',
  date: 'heart-outline',
  restaurant: 'silverware-fork-knife',
  work: 'briefcase-outline',
  evening: 'glass-cocktail',
  ceremony: 'ring',
};

export const seasonIcons: Record<Season, IconName> = {
  spring: 'flower-outline',
  summer: 'weather-sunny',
  autumn: 'leaf-maple',
  winter: 'snowflake',
};

export const statusIcons: Record<WardrobeStatus, IconName> = {
  AVAILABLE: 'check-circle-outline',
  WASHING: 'washing-machine',
  LENT: 'handshake-outline',
  ARCHIVED: 'archive-outline',
  SOLD: 'cash',
  DONATED: 'gift-outline',
};
