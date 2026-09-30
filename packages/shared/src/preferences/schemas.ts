import { z } from 'zod';

import { LEVEL_MAX, LEVEL_MIN } from '../wardrobe/taxonomy';
import { colorSchema, seasonSchema, styleSchema } from '../wardrobe/schemas';

/** Jewellery metals the user likes; none selected = no preference. */
export const METALS = ['gold', 'silver', 'roseGold'] as const;
export type Metal = (typeof METALS)[number];

/** Silhouettes the user likes to wear (US4.3, optional). */
export const BOTTOM_PREFERENCES = ['skirts', 'dresses', 'trousers'] as const;
export type BottomPreference = (typeof BOTTOM_PREFERENCES)[number];

/** Shortest length the user is comfortable with (optional). */
export const LENGTHS = ['mini', 'knee', 'midi', 'maxi'] as const;
export type Length = (typeof LENGTHS)[number];

const uniqueList = <T extends z.ZodType>(item: T, max: number) =>
  z
    .array(item)
    .max(max, { error: 'errors.wardrobe.tooMany' })
    .transform((values) => [...new Set(values)]);

/**
 * Full style profile (PUT replaces it). Every field is optional: an empty
 * profile is valid, which is what "Passer pour l'instant" saves.
 */
export const styleProfileSchema = z
  .object({
    preferredStyles: uniqueList(styleSchema, 10).default([]),
    preferredColors: uniqueList(colorSchema, 15).default([]),
    avoidedColors: uniqueList(colorSchema, 15).default([]),
    /** Colours that flatter the face (tops, scarves, earrings…). */
    facePreferredColors: uniqueList(colorSchema, 15).default([]),
    /** Colour analysis season ("colorimétrie"). */
    colorSeason: seasonSchema.nullable().default(null),
    /** Several = the user happily mixes them. */
    preferredMetals: uniqueList(
      z.enum(METALS, { error: 'errors.preferences.metal' }),
      METALS.length,
    ).default([]),
    /** null = no preference. */
    acceptsHeels: z.boolean().nullable().default(null),
    preferredBottoms: uniqueList(
      z.enum(BOTTOM_PREFERENCES, { error: 'errors.preferences.bottoms' }),
      3,
    ).default([]),
    preferredFormality: z
      .number()
      .int()
      .min(LEVEL_MIN, { error: 'errors.wardrobe.level' })
      .max(LEVEL_MAX, { error: 'errors.wardrobe.level' })
      .nullable()
      .default(null),
    minLength: z
      .enum(LENGTHS, { error: 'errors.preferences.length' })
      .nullable()
      .default(null),
    avoidsDeepNeckline: z.boolean().nullable().default(null),
  })
  .refine(
    (profile) =>
      !profile.preferredColors.some((color) =>
        profile.avoidedColors.includes(color),
      ),
    { path: ['avoidedColors'], error: 'errors.preferences.colorConflict' },
  );

export type StyleProfileInput = z.input<typeof styleProfileSchema>;
export type StyleProfileFields = z.output<typeof styleProfileSchema>;

/** As returned by GET/PUT /preferences/me. */
export interface StyleProfile extends StyleProfileFields {
  /** False until the onboarding is completed or skipped. */
  onboardingCompleted: boolean;
}
