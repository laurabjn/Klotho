import { z } from 'zod';

import { styleSchema } from '../wardrobe/schemas';
import type { WeatherCondition } from '../weather/schemas';
import { calendarDaySchema, type Outfit } from './schemas';
import { OCCASIONS } from './taxonomy';

/** At most two months at once (the calendar shows a month). */
export const PLAN_RANGE_MAX_DAYS = 62;

/** GET /plans?from=&to= : the planned looks of a period, days included. */
export const planRangeQuerySchema = z
  .object({ from: calendarDaySchema, to: calendarDaySchema })
  .refine((query) => query.from <= query.to, {
    error: 'errors.outfits.period',
    path: ['to'],
  })
  .refine(
    (query) =>
      (Date.parse(`${query.to}T00:00:00Z`) -
        Date.parse(`${query.from}T00:00:00Z`)) /
        86_400_000 <
      PLAN_RANGE_MAX_DAYS,
    { error: 'errors.plans.range', path: ['to'] },
  );
export type PlanRangeQuery = z.infer<typeof planRangeQuerySchema>;

/** PUT /plans/:day : "Planifier cette tenue" (replaces the day's plan). */
export const planOutfitSchema = z.object({
  outfitId: z.string().min(1).max(40),
});
export type PlanOutfitInput = z.infer<typeof planOutfitSchema>;

/** POST /plans/:day/move : "Déplacer"; a plan already there is swapped. */
export const movePlanSchema = z.object({ toDay: calendarDaySchema });
export type MovePlanInput = z.infer<typeof movePlanSchema>;

/**
 * POST /plans/week : "Planifier ma semaine". One look per day from `from`
 * (today or later) to the Sunday of its week; days already planned are kept.
 */
export const planWeekSchema = z.object({
  from: calendarDaySchema,
  style: styleSchema.nullable().default(null),
  occasion: z
    .enum(OCCASIONS, { error: 'errors.outfits.occasion' })
    .nullable()
    .default(null),
});
export type PlanWeekInput = z.input<typeof planWeekSchema>;

export const DAY_NOTE_MAX = 500;

/** PUT /days/:day/note : "Notes" of the day; an empty text removes it. */
export const dayNoteSchema = z.object({
  text: z
    .string()
    .trim()
    .max(DAY_NOTE_MAX, { error: 'errors.plans.note' })
    .transform((value) => value || null)
    .nullable(),
});
export type DayNoteInput = z.input<typeof dayNoteSchema>;

/** A look planned for a day. */
export interface OutfitPlan {
  id: string;
  /** YYYY-MM-DD. */
  day: string;
  outfit: Outfit;
  /** The forecast it was planned with, when known. */
  forecast: { temperature: number; condition: WeatherCondition } | null;
}

export interface DayNote {
  day: string;
  text: string | null;
}
