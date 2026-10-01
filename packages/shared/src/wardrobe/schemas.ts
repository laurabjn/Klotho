import { z } from 'zod';

import {
  COLOR_KEYS,
  LEVEL_MAX,
  LEVEL_MIN,
  PATTERNS,
  SEASONS,
  STYLES,
  TEMPERATURE_MAX,
  TEMPERATURE_MIN,
  WARDROBE_CATEGORIES,
  WARDROBE_STATUSES,
} from './taxonomy';

// Error messages are i18n keys (see packages/i18n, errors.wardrobe.*).

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, { error: 'errors.wardrobe.tooLong' })
    .transform((value) => (value === '' ? null : value))
    .nullable()
    .optional();

/** Removes duplicates while keeping the order chosen by the user. */
const uniqueList = <T extends z.ZodType>(item: T, max: number) =>
  z
    .array(item)
    .max(max, { error: 'errors.wardrobe.tooMany' })
    .transform((values) => [...new Set(values)]);

const level = z
  .number({ error: 'errors.wardrobe.level' })
  .int()
  .min(LEVEL_MIN, { error: 'errors.wardrobe.level' })
  .max(LEVEL_MAX, { error: 'errors.wardrobe.level' })
  .nullable()
  .optional();

const degrees = z
  .number({ error: 'errors.wardrobe.temperature' })
  .int()
  .min(TEMPERATURE_MIN, { error: 'errors.wardrobe.temperature' })
  .max(TEMPERATURE_MAX, { error: 'errors.wardrobe.temperature' });
const temperature = degrees.nullable().optional();

export const categorySchema = z.enum(WARDROBE_CATEGORIES, {
  error: 'errors.wardrobe.category',
});
export const statusSchema = z.enum(WARDROBE_STATUSES, {
  error: 'errors.wardrobe.status',
});
export const colorSchema = z.enum(COLOR_KEYS, {
  error: 'errors.wardrobe.color',
});
export const styleSchema = z.enum(STYLES, { error: 'errors.wardrobe.style' });
export const seasonSchema = z.enum(SEASONS, {
  error: 'errors.wardrobe.season',
});

const itemFields = {
  name: optionalText(60),
  category: categorySchema,
  subcategory: optionalText(40),
  primaryColor: colorSchema,
  secondaryColors: uniqueList(colorSchema, 5).default([]),
  pattern: z
    .enum(PATTERNS, { error: 'errors.wardrobe.pattern' })
    .nullable()
    .optional(),
  material: optionalText(60),
  styles: uniqueList(styleSchema, 6).default([]),
  seasons: uniqueList(seasonSchema, 4).default([]),
  minTemperature: temperature,
  maxTemperature: temperature,
  warmthLevel: level,
  formalityLevel: level,
  brand: optionalText(60),
  size: optionalText(20),
  status: statusSchema.default('AVAILABLE'),
};

const temperaturesOrdered = (value: {
  minTemperature?: number | null;
  maxTemperature?: number | null;
}) =>
  value.minTemperature == null ||
  value.maxTemperature == null ||
  value.minTemperature <= value.maxTemperature;

const temperatureRangeError = {
  path: ['maxTemperature'],
  error: 'errors.wardrobe.temperatureRange',
};

export const createWardrobeItemSchema = z
  .object(itemFields)
  .refine(temperaturesOrdered, temperatureRangeError);

/** Partial update: only the provided fields change; defaults do not apply. */
export const updateWardrobeItemSchema = z
  .object({
    ...itemFields,
    category: categorySchema.optional(),
    primaryColor: colorSchema.optional(),
    secondaryColors: uniqueList(colorSchema, 5).optional(),
    styles: uniqueList(styleSchema, 6).optional(),
    seasons: uniqueList(seasonSchema, 4).optional(),
    status: statusSchema.optional(),
  })
  .refine(temperaturesOrdered, temperatureRangeError);

export const WARDROBE_SORTS = [
  'recent',
  'mostWorn',
  'leastWorn',
  'alphabetical',
] as const;
export type WardrobeSort = (typeof WARDROBE_SORTS)[number];

/** Query string lists are comma separated: ?category=TOP,BOTTOM */
const csv = <T extends z.ZodType>(item: T) =>
  z
    .preprocess(
      (value) =>
        typeof value === 'string'
          ? value
              .split(',')
              .map((part) => part.trim())
              .filter(Boolean)
          : value,
      z.array(item),
    )
    .optional();

export const WARDROBE_PAGE_SIZE_MAX = 100;

export const listWardrobeQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .max(WARDROBE_PAGE_SIZE_MAX)
    .default(24),
  category: csv(categorySchema),
  color: csv(colorSchema),
  season: csv(seasonSchema),
  style: csv(styleSchema),
  status: csv(statusSchema),
  q: z.string().trim().max(60).optional(),
  /** Pieces wearable at this temperature (°C); pieces without a range match. */
  temperature: z.coerce.number().pipe(degrees).optional(),
  sort: z.enum(WARDROBE_SORTS).default('recent'),
  /** ?favorite=true: "Mes pièces favorites" only. */
  favorite: z.stringbool().optional(),
});

export const attachPhotoSchema = z.object({
  key: z.string().min(1).max(200),
});
export type AttachPhotoInput = z.infer<typeof attachPhotoSchema>;

export type CreateWardrobeItemInput = z.input<typeof createWardrobeItemSchema>;
export type CreateWardrobeItem = z.output<typeof createWardrobeItemSchema>;
export type UpdateWardrobeItemInput = z.input<typeof updateWardrobeItemSchema>;
export type UpdateWardrobeItem = z.output<typeof updateWardrobeItemSchema>;
export type ListWardrobeQueryInput = z.input<typeof listWardrobeQuerySchema>;
export type ListWardrobeQuery = z.output<typeof listWardrobeQuerySchema>;
