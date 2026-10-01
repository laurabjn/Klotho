import { z } from 'zod';

import { TEMPERATURE_MAX, TEMPERATURE_MIN } from '../wardrobe/taxonomy';
import type { WardrobeItem } from '../wardrobe/types';
import { categorySchema, colorSchema, styleSchema } from '../wardrobe/schemas';
import { WEATHER_CONDITIONS, type WeatherCondition } from '../weather/schemas';
import { OCCASIONS, type Occasion } from './taxonomy';

/** Place of a piece in a look. */
export const OUTFIT_ROLES = [
  'top',
  'bottom',
  'dress',
  'layer',
  'shoes',
  'bag',
  'jewelry',
  'accessory',
] as const;
export type OutfitRole = (typeof OUTFIT_ROLES)[number];

/**
 * What a look does well, shown under "Pourquoi cette tenue ?" instead of
 * the raw score.
 */
export const OUTFIT_HIGHLIGHTS = [
  'weather',
  'style',
  'occasion',
  'color',
  'compatibility',
  'preferences',
  'rediscover',
] as const;
export type OutfitHighlight = (typeof OUTFIT_HIGHLIGHTS)[number];

const id = z.string().min(1).max(40);
const ids = (max: number) => z.array(id).max(max).default([]);

export const outfitExclusionsSchema = z.object({
  categories: z.array(categorySchema).max(9).default([]),
  /** E.g. "pumps" for "pas de talons". */
  subcategories: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
  colors: z.array(colorSchema).max(20).default([]),
});

/** POST /outfits/generate */
export const generateOutfitsSchema = z.object({
  style: styleSchema.nullable().default(null),
  occasion: z
    .enum(OCCASIONS, { error: 'errors.outfits.occasion' })
    .nullable()
    .default(null),
  /** °C; null when unknown (no weather, nothing entered). */
  temperature: z
    .number({ error: 'errors.wardrobe.temperature' })
    .min(TEMPERATURE_MIN, { error: 'errors.wardrobe.temperature' })
    .max(TEMPERATURE_MAX, { error: 'errors.wardrobe.temperature' })
    .nullable()
    .default(null),
  condition: z
    .enum(WEATHER_CONDITIONS, { error: 'errors.outfits.condition' })
    .nullable()
    .default(null),
  mandatoryItemId: id.nullable().default(null),
  exclusions: outfitExclusionsSchema.default({
    categories: [],
    subcategories: [],
    colors: [],
  }),
  /** Looks already seen, not proposed again. */
  excludeOutfitIds: ids(50),
});
export type GenerateOutfitsInput = z.input<typeof generateOutfitsSchema>;
export type GenerateOutfitsRequest = z.output<typeof generateOutfitsSchema>;

/** POST /outfits/:id/replace-item */
export const replaceOutfitItemSchema = z.object({
  role: z.enum(OUTFIT_ROLES, { error: 'errors.outfits.role' }),
  replacementItemId: id,
});
export type ReplaceOutfitItemInput = z.input<typeof replaceOutfitItemSchema>;

/** POST /outfits/:id/variant */
export const outfitVariantSchema = z.object({
  /** Pieces of the look kept as they are. */
  lockedItemIds: ids(8),
  excludeOutfitIds: ids(50),
});
export type OutfitVariantInput = z.input<typeof outfitVariantSchema>;

/** GET /outfits?limit= : the latest looks, most recent first. */
export const recentOutfitsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(20).default(10),
});

/** GET /outfits/:id/alternatives?role= */
export const outfitAlternativesQuerySchema = z.object({
  role: z.enum(OUTFIT_ROLES, { error: 'errors.outfits.role' }),
});

export interface OutfitPiece {
  role: OutfitRole;
  item: WardrobeItem;
}

/** A proposed look. The raw score stays on the server. */
export interface Outfit {
  id: string;
  style: z.output<typeof styleSchema> | null;
  occasion: Occasion | null;
  temperature: number | null;
  condition: WeatherCondition | null;
  pieces: OutfitPiece[];
  /** Best qualities first. */
  highlights: OutfitHighlight[];
  /** The look this one is a variant of. */
  variantOf: string | null;
  createdAt: string;
}

/** A piece that could replace another one in a look. */
export interface OutfitAlternative {
  item: WardrobeItem;
  /** The look stays about as good with it. */
  compatible: boolean;
}
