import type { DayNoteRepository } from '../domain/planning/ports/day-note.repository';
import type {
  NewOutfitPlan,
  OutfitPlanRepository,
  PlanForecast,
  StoredOutfitPlan,
} from '../domain/planning/ports/outfit-plan.repository';
import type { InMemoryOutfitRepository } from './in-memory-outfit.repository';

/**
 * Same semantics as PrismaOutfitPlanRepository, in memory. The plans of a
 * look deleted from the given outfit repository disappear (cascade).
 */
export class InMemoryOutfitPlanRepository implements OutfitPlanRepository {
  private readonly rows: StoredOutfitPlan[] = [];
  private sequence = 0;

  constructor(private readonly outfits?: InMemoryOutfitRepository) {}

  /** Every plan still pointing to an existing look. */
  get plans(): StoredOutfitPlan[] {
    const live = this.rows.filter(
      (plan) =>
        !this.outfits ||
        this.outfits.outfits.some((outfit) => outfit.id === plan.outfitId),
    );
    this.rows.splice(0, this.rows.length, ...live);
    return this.rows;
  }

  private copy = (plan: StoredOutfitPlan): StoredOutfitPlan => ({
    ...plan,
    forecast: plan.forecast && { ...plan.forecast },
  });

  private mine(userId: string, day: string) {
    return this.plans.find(
      (plan) => plan.userId === userId && plan.day === day,
    );
  }

  listBetween(userId: string, from: string, to: string) {
    return Promise.resolve(
      this.plans
        .filter((p) => p.userId === userId && p.day >= from && p.day <= to)
        .sort((a, b) => a.day.localeCompare(b.day))
        .map(this.copy),
    );
  }

  findByDay(userId: string, day: string) {
    const plan = this.mine(userId, day);
    return Promise.resolve(plan ? this.copy(plan) : null);
  }

  save(userId: string, plan: NewOutfitPlan): Promise<StoredOutfitPlan> {
    const existing = this.mine(userId, plan.day);
    if (existing) {
      Object.assign(existing, plan);
      return Promise.resolve(this.copy(existing));
    }
    return Promise.resolve(this.copy(this.insert(userId, plan)));
  }

  private insert(userId: string, plan: NewOutfitPlan, id?: string) {
    this.sequence += 1;
    const stored = { ...plan, id: id ?? `plan-${this.sequence}`, userId };
    this.plans.push(stored);
    return stored;
  }

  createMany(userId: string, plans: NewOutfitPlan[]) {
    return Promise.resolve(
      plans
        .filter((plan) => !this.mine(userId, plan.day))
        .map((plan) => this.copy(this.insert(userId, plan))),
    );
  }

  move(
    userId: string,
    from: string,
    to: string,
    forecasts: { from: PlanForecast | null; to: PlanForecast | null },
  ): Promise<StoredOutfitPlan[]> {
    const moved = this.mine(userId, from);
    if (!moved) return Promise.resolve([]);
    const swapped = this.mine(userId, to);
    Object.assign(moved, { day: to, forecast: forecasts.to });
    if (swapped)
      Object.assign(swapped, { day: from, forecast: forecasts.from });
    return Promise.resolve(
      [moved, ...(swapped ? [swapped] : [])].map(this.copy),
    );
  }

  delete(userId: string, day: string): Promise<void> {
    const plan = this.mine(userId, day);
    if (plan) this.plans.splice(this.plans.indexOf(plan), 1);
    return Promise.resolve();
  }
}

export class InMemoryDayNoteRepository implements DayNoteRepository {
  readonly notes = new Map<string, string>();

  find(userId: string, day: string): Promise<string | null> {
    return Promise.resolve(this.notes.get(`${userId}|${day}`) ?? null);
  }

  save(userId: string, day: string, text: string | null): Promise<void> {
    if (text === null) this.notes.delete(`${userId}|${day}`);
    else this.notes.set(`${userId}|${day}`, text);
    return Promise.resolve();
  }
}
