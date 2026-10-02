import type {
  DayNote,
  OutfitPlan,
  PlanRangeQuery,
  Style,
  Occasion,
} from '@klotho/shared';

import { MAIN_ROLES } from '../../domain/outfits/entities/outfit-candidate';
import { NoOutfitPossibleError } from '../../domain/outfits/errors';
import type {
  NewOutfit,
  OutfitConditions,
} from '../../domain/outfits/ports/outfit.repository';
import {
  addDays,
  dayOf,
  daysBetween,
  sundayOf,
} from '../../domain/planning/calendar';
import { PastDayError, PlanNotFoundError } from '../../domain/planning/errors';
import type { DayNoteRepository } from '../../domain/planning/ports/day-note.repository';
import type {
  NewOutfitPlan,
  OutfitPlanRepository,
  PlanForecast,
  StoredOutfitPlan,
} from '../../domain/planning/ports/outfit-plan.repository';
import type { Clock } from '../../domain/shared/ports/clock';
import type { OutfitWorkshop } from '../outfits/outfit.use-cases';
import type { DayForecasts } from './day-forecasts';

const weatherOf = (forecast: PlanForecast | null) => ({
  temperature: forecast?.temperature ?? null,
  condition: forecast?.condition ?? null,
});

/** What the planning use cases share: the looks, the plans, the weather. */
export class Planner {
  constructor(
    readonly workshop: OutfitWorkshop,
    readonly plans: OutfitPlanRepository,
    readonly forecasts: DayForecasts,
    readonly clock: Clock,
  ) {}

  async existing(userId: string, day: string): Promise<StoredOutfitPlan> {
    const plan = await this.plans.findByDay(userId, day);
    if (!plan) throw new PlanNotFoundError();
    return plan;
  }

  /** Plans with their looks, ready for the app, in the given order. */
  async present(
    userId: string,
    plans: StoredOutfitPlan[],
  ): Promise<OutfitPlan[]> {
    if (plans.length === 0) return [];
    const ids = [...new Set(plans.map((plan) => plan.outfitId))];
    const [outfits, items] = await Promise.all([
      this.workshop.outfits.findManyOwned(userId, ids),
      this.workshop.wardrobe.findAllOwned(userId),
    ]);
    const presented = await this.workshop.present(outfits, items);
    const byId = new Map(presented.map((dto) => [dto.id, dto]));
    return plans.flatMap((plan) => {
      const outfit = byId.get(plan.outfitId);
      return outfit
        ? [{ id: plan.id, day: plan.day, outfit, forecast: plan.forecast }]
        : [];
    });
  }
}

/** The calendar: the planned looks of a period, by day. */
export class ListPlansUseCase {
  constructor(private readonly planner: Planner) {}

  async execute(userId: string, query: PlanRangeQuery): Promise<OutfitPlan[]> {
    const plans = await this.planner.plans.listBetween(
      userId,
      query.from,
      query.to,
    );
    return this.planner.present(userId, plans);
  }
}

/** "Planifier cette tenue": replaces the look planned that day, if any. */
export class PlanOutfitUseCase {
  constructor(private readonly planner: Planner) {}

  async execute(
    userId: string,
    day: string,
    outfitId: string,
  ): Promise<OutfitPlan> {
    await this.planner.workshop.ownedOutfit(userId, outfitId);
    const forecasts = await this.planner.forecasts.byDay(userId);
    const plan = await this.planner.plans.save(userId, {
      day,
      outfitId,
      forecast: forecasts.get(day) ?? null,
    });
    const [dto] = await this.planner.present(userId, [plan]);
    return dto!;
  }
}

/** Idempotent; the look itself stays in "Mes tenues". */
export class DeletePlanUseCase {
  constructor(private readonly planner: Planner) {}

  execute(userId: string, day: string): Promise<void> {
    return this.planner.plans.delete(userId, day);
  }
}

/**
 * "Déplacer": the look goes to another day; a look already planned there
 * takes its place. Each day keeps its own forecast.
 */
export class MovePlanUseCase {
  constructor(private readonly planner: Planner) {}

  async execute(
    userId: string,
    day: string,
    toDay: string,
  ): Promise<OutfitPlan[]> {
    const moved = await this.planner.existing(userId, day);
    if (toDay === day) return this.planner.present(userId, [moved]);

    const [forecasts, swapped] = await Promise.all([
      this.planner.forecasts.byDay(userId),
      this.planner.plans.findByDay(userId, toDay),
    ]);
    const plans = await this.planner.plans.move(userId, day, toDay, {
      from: forecasts.get(day) ?? moved.forecast,
      to: forecasts.get(toDay) ?? swapped?.forecast ?? null,
    });
    if (plans.length === 0) throw new PlanNotFoundError();
    return this.planner.present(userId, plans);
  }
}

/**
 * "Changer la tenue": one new look for that day, with the style and the
 * occasion of the planned one and the day's weather; never the planned
 * look again nor a disliked one.
 */
export class RegeneratePlanUseCase {
  constructor(private readonly planner: Planner) {}

  async execute(userId: string, day: string): Promise<OutfitPlan> {
    const { workshop } = this.planner;
    const plan = await this.planner.existing(userId, day);
    const current = await workshop.ownedOutfit(userId, plan.outfitId);
    const forecast =
      (await this.planner.forecasts.byDay(userId)).get(day) ?? plan.forecast;
    const conditions: OutfitConditions = {
      style: current.style,
      occasion: current.occasion,
      ...(forecast
        ? weatherOf(forecast)
        : { temperature: current.temperature, condition: current.condition }),
    };

    const items = await workshop.wardrobe.findAllOwned(userId);
    const context = await workshop.context(userId, conditions, items);
    const excludedOutfitKeys = await workshop.excludedKeys(
      userId,
      [current.id],
      items,
      context,
    );
    const [look] = workshop.generator.generate(items, {
      context,
      excludedOutfitKeys,
      count: 1,
    });
    if (!look) throw new NoOutfitPossibleError();
    const [saved] = await workshop.save(userId, conditions, [look]);
    const replaced = await this.planner.plans.save(userId, {
      day,
      outfitId: saved!.id,
      forecast,
    });
    const [dto] = await this.planner.present(userId, [replaced]);
    return dto!;
  }
}

export interface PlanWeekCommand {
  from: string;
  style: Style | null;
  occasion: Occasion | null;
}

/**
 * "Planifier ma semaine": one look a day from `from` to Sunday, for the days
 * not planned yet, with each day's forecast. The week stays varied: a look
 * is never planned twice, and the pieces of the other days count as just
 * worn (the engine's anti-repetition then prefers other ones).
 */
export class PlanWeekUseCase {
  constructor(private readonly planner: Planner) {}

  async execute(
    userId: string,
    command: PlanWeekCommand,
  ): Promise<OutfitPlan[]> {
    const { workshop, clock } = this.planner;
    // The app sends the user's own day: one day of margin for time zones.
    const today = dayOf(clock.now());
    if (command.from < addDays(today, -1)) throw new PastDayError();

    const sunday = sundayOf(command.from);
    const existing = await this.planner.plans.listBetween(
      userId,
      command.from,
      sunday,
    );
    const planned = new Set(existing.map((plan) => plan.day));
    const days = daysBetween(command.from, sunday).filter(
      (day) => !planned.has(day),
    );
    if (days.length === 0) return [];

    const items = await workshop.wardrobe.findAllOwned(userId);
    const base = await workshop.context(
      userId,
      {
        style: command.style,
        occasion: command.occasion,
        temperature: null,
        condition: null,
      },
      items,
    );
    const style = command.style ?? base.profile.preferredStyles[0] ?? null;
    const forecasts = await this.planner.forecasts.byDay(userId);
    const fallback = days.every((day) => forecasts.has(day))
      ? null
      : await this.planner.forecasts.current(userId);

    const excluded = await workshop.excludedKeys(
      userId,
      existing.map((plan) => plan.outfitId),
      items,
      base,
    );
    const weekLooks = await workshop.outfits.findManyOwned(
      userId,
      existing.map((plan) => plan.outfitId),
    );
    const usedIds = new Set(
      weekLooks.flatMap((look) =>
        look.pieces
          .filter((piece) => MAIN_ROLES.includes(piece.role))
          .map((piece) => piece.itemId),
      ),
    );
    const now = clock.now();

    const looks: {
      day: string;
      forecast: PlanForecast | null;
      look: NewOutfit;
    }[] = [];
    for (const day of days) {
      const forecast = forecasts.get(day) ?? null;
      const conditions: OutfitConditions = {
        style,
        occasion: command.occasion,
        ...weatherOf(forecast ?? fallback),
      };
      const wardrobe = items.map((item) =>
        usedIds.has(item.id) ? { ...item, lastWornAt: now } : item,
      );
      const [look] = workshop.generator.generate(wardrobe, {
        context: workshop.withConditions(base, conditions),
        excludedOutfitKeys: excluded,
        count: 1,
      });
      // No suitable look that day (e.g. a cold snap): the day stays free.
      if (!look) continue;
      excluded.push(look.key);
      look.pieces
        .filter((piece) => MAIN_ROLES.includes(piece.role))
        .forEach((piece) => usedIds.add(piece.itemId));
      looks.push({
        day,
        forecast,
        look: {
          ...conditions,
          pieces: look.pieces,
          score: look.score,
          breakdown: look.breakdown,
          variantOf: null,
        },
      });
    }
    if (looks.length === 0) throw new NoOutfitPossibleError();

    const saved = await workshop.outfits.createMany(
      userId,
      looks.map(({ look }) => look),
    );
    const plans: NewOutfitPlan[] = looks.map(({ day, forecast }, index) => ({
      day,
      outfitId: saved[index]!.id,
      forecast,
    }));
    const created = await this.planner.plans.createMany(userId, plans);
    return this.planner.present(userId, created);
  }
}

/** "Notes" of a day; none is a null text. */
export class GetDayNoteUseCase {
  constructor(private readonly notes: DayNoteRepository) {}

  async execute(userId: string, day: string): Promise<DayNote> {
    return { day, text: await this.notes.find(userId, day) };
  }
}

/** Replaces the note of the day; an empty text removes it. */
export class SaveDayNoteUseCase {
  constructor(private readonly notes: DayNoteRepository) {}

  async execute(
    userId: string,
    day: string,
    text: string | null,
  ): Promise<DayNote> {
    await this.notes.save(userId, day, text);
    return { day, text };
  }
}
