import { z } from 'zod';

import {
  COLOR_KEYS,
  LEVEL_MAX,
  LEVEL_MIN,
  PATTERNS,
  SEASONS,
  STYLES,
  SUBCATEGORIES,
  TEMPERATURE_MAX,
  TEMPERATURE_MIN,
  WARDROBE_CATEGORIES,
} from '../wardrobe/taxonomy';
import type { UploadedPhoto } from '../wardrobe/types';

/**
 * What the photo analysis proposes for a new piece. Every field is a guess
 * the user checks: null (or an empty list) when the AI could not tell.
 */
export interface GarmentSuggestion {
  name: string | null;
  category: (typeof WARDROBE_CATEGORIES)[number] | null;
  subcategory: string | null;
  primaryColor: (typeof COLOR_KEYS)[number] | null;
  secondaryColors: (typeof COLOR_KEYS)[number][];
  pattern: (typeof PATTERNS)[number] | null;
  material: string | null;
  styles: (typeof STYLES)[number][];
  seasons: (typeof SEASONS)[number][];
  minTemperature: number | null;
  maxTemperature: number | null;
  warmthLevel: number | null;
  formalityLevel: number | null;
}

/** Photo analyses left to the user. */
export interface AiCredits {
  /** False when the server has no AI configured: the app hides the feature. */
  enabled: boolean;
  remaining: number;
  quota: number;
}

/** POST /ai/wardrobe-photo: the stored photo, ready to attach, and its analysis. */
export interface WardrobePhotoAnalysis {
  photo: UploadedPhoto;
  suggestion: GarmentSuggestion;
  credits: AiCredits;
}

export const analyzePhotoQuerySchema = z.object({
  /** Language of the proposed name. */
  language: z.enum(['fr', 'en']).default('fr'),
});
export type AnalyzePhotoQuery = z.output<typeof analyzePhotoQuerySchema>;

const keep = <T extends z.ZodType>(schema: T) => schema.nullable().catch(null);
const keepAll = <T extends z.ZodType>(item: T, max: number) =>
  z
    .array(z.unknown())
    .catch([])
    .transform((values) => [
      ...new Set(
        values.flatMap((value) => {
          const parsed = item.safeParse(value);
          return parsed.success ? [parsed.data] : [];
        }),
      ),
    ])
    .transform((values) => values.slice(0, max));
const shortText = (max: number) =>
  z
    .string()
    .trim()
    .transform((text) => (text === '' ? null : text.slice(0, max)))
    .nullable()
    .catch(null);
const degrees = z
  .number()
  .int()
  .min(TEMPERATURE_MIN)
  .max(TEMPERATURE_MAX)
  .nullable()
  .catch(null);
const level = z
  .number()
  .int()
  .min(LEVEL_MIN)
  .max(LEVEL_MAX)
  .nullable()
  .catch(null);

/**
 * Turns the raw answer of the AI into a safe suggestion: unknown values are
 * dropped one by one instead of failing the whole analysis.
 */
export const garmentSuggestionSchema = z
  .object({
    name: shortText(60),
    category: keep(z.enum(WARDROBE_CATEGORIES)),
    subcategory: shortText(40),
    primaryColor: keep(z.enum(COLOR_KEYS)),
    secondaryColors: keepAll(z.enum(COLOR_KEYS), 5),
    pattern: keep(z.enum(PATTERNS)),
    material: shortText(60),
    styles: keepAll(z.enum(STYLES), 6),
    seasons: keepAll(z.enum(SEASONS), 4),
    minTemperature: degrees,
    maxTemperature: degrees,
    warmthLevel: level,
    formalityLevel: level,
  })
  .transform((raw): GarmentSuggestion => {
    // A known sub-category tells the category the AI may have left out.
    const category =
      raw.category ??
      WARDROBE_CATEGORIES.find((c) =>
        (SUBCATEGORIES[c] as readonly (string | null)[]).includes(
          raw.subcategory,
        ),
      ) ??
      null;
    const subcategories: readonly string[] = category
      ? SUBCATEGORIES[category]
      : [];
    const ordered =
      raw.minTemperature === null ||
      raw.maxTemperature === null ||
      raw.minTemperature <= raw.maxTemperature;
    return {
      ...raw,
      category,
      subcategory:
        raw.subcategory && subcategories.includes(raw.subcategory)
          ? raw.subcategory
          : null,
      secondaryColors: raw.secondaryColors.filter(
        (color) => color !== raw.primaryColor,
      ),
      minTemperature: ordered ? raw.minTemperature : null,
      maxTemperature: ordered ? raw.maxTemperature : null,
    };
  });
