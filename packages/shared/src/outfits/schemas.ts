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

/** Which looks GET /outfits lists ("Mes tenues"). */
export const OUTFIT_LIST_FILTERS = ['generated', 'favorites', 'worn'] as const;
export type OutfitListFilter = (typeof OUTFIT_LIST_FILTERS)[number];

const page = z.coerce.number().int().min(1).default(1);
const pageSize = (max: number, byDefault: number) =>
  z.coerce.number().int().min(1).max(max).default(byDefault);

/**
 * GET /outfits?filter=&page=&pageSize= : most recent first (generated),
 * last favourited first (favorites) or last worn first (worn).
 */
export const listOutfitsQuerySchema = z.object({
  filter: z
    .enum(OUTFIT_LIST_FILTERS, { error: 'errors.outfits.filter' })
    .default('generated'),
  page,
  pageSize: pageSize(50, 20),
});
export type ListOutfitsQueryInput = z.input<typeof listOutfitsQuerySchema>;
export type ListOutfitsQuery = z.output<typeof listOutfitsQuerySchema>;

export const OUTFIT_RATINGS = ['like', 'dislike'] as const;
export type OutfitRating = (typeof OUTFIT_RATINGS)[number];

/** "Quelle(s) en est (sont) la raison ?" when a look is not liked. */
export const DISLIKE_REASONS = [
  'tooDressy',
  'tooCasual',
  'tooWarm',
  'tooCold',
  'colors',
  'shoes',
  'association',
  'other',
] as const;
export type DislikeReason = (typeof DISLIKE_REASONS)[number];

export const FEEDBACK_NOTE_MAX = 250;

/** POST /outfits/:id/feedback: one rating per look, the last one wins. */
export const outfitFeedbackSchema = z.object({
  rating: z.enum(OUTFIT_RATINGS, { error: 'errors.outfits.rating' }),
  /** Kept for a dislike only. */
  reasons: z
    .array(z.enum(DISLIKE_REASONS, { error: 'errors.outfits.reason' }))
    .max(DISLIKE_REASONS.length)
    .default([])
    .transform((values) => [...new Set(values)]),
  note: z
    .string()
    .trim()
    .max(FEEDBACK_NOTE_MAX, { error: 'errors.outfits.note' })
    .nullable()
    .default(null)
    .transform((value) => value || null),
});
export type OutfitFeedbackInput = z.input<typeof outfitFeedbackSchema>;
export type OutfitFeedbackRequest = z.output<typeof outfitFeedbackSchema>;

/** A calendar day, YYYY-MM-DD, in the user's own time zone. */
export const calendarDaySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, { error: 'errors.outfits.day' })
  .refine(
    (value) => {
      const date = new Date(`${value}T00:00:00Z`);
      // Rejects impossible days such as 2026-02-31.
      return (
        !Number.isNaN(date.getTime()) &&
        date.toISOString().slice(0, 10) === value
      );
    },
    { error: 'errors.outfits.day' },
  );

/** POST /outfits/:id/wear: "Marquer comme portée", once per look and day. */
export const markOutfitWornSchema = z.object({
  /** The user's day (her time zone), not the server's. */
  wornOn: calendarDaySchema,
});
export type MarkOutfitWornInput = z.input<typeof markOutfitWornSchema>;

/** GET /outfits/history?from=&to=&page=&pageSize= : last worn first. */
export const outfitHistoryQuerySchema = z
  .object({
    from: calendarDaySchema.optional(),
    to: calendarDaySchema.optional(),
    page,
    pageSize: pageSize(100, 20),
  })
  .refine((query) => !query.from || !query.to || query.from <= query.to, {
    error: 'errors.outfits.period',
    path: ['to'],
  });
export type OutfitHistoryQueryInput = z.input<typeof outfitHistoryQuerySchema>;
export type OutfitHistoryQuery = z.output<typeof outfitHistoryQuerySchema>;

/** GET /outfits/:id/alternatives?role= */
export const outfitAlternativesQuerySchema = z.object({
  role: z.enum(OUTFIT_ROLES, { error: 'errors.outfits.role' }),
});

export interface OutfitPiece {
  role: OutfitRole;
  item: WardrobeItem;
}

export interface OutfitFeedback {
  rating: OutfitRating;
  reasons: DislikeReason[];
  note: string | null;
  updatedAt: string;
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
  isFavorite: boolean;
  /** The user's opinion, if she gave one. */
  feedback: OutfitFeedback | null;
  /** Last day it was worn (YYYY-MM-DD), if ever. */
  lastWornOn: string | null;
}

/** A day a look was worn ("Historique de mes tenues", calendar). */
export interface OutfitWear {
  id: string;
  /** YYYY-MM-DD. */
  wornOn: string;
  outfit: Outfit;
}

/** GET /outfits/:id/alternatives returns at most this many pieces, best first. */
export const OUTFIT_ALTERNATIVES_MAX = 30;

/** A piece that could replace another one in a look. */
export interface OutfitAlternative {
  item: WardrobeItem;
  /** The look stays about as good with it. */
  compatible: boolean;
}
