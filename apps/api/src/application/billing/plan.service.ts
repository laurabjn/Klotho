import type {
  AiCredits,
  BillingStatus,
  Plan,
  PlanLimits,
} from '@klotho/shared';

import type {
  AiPool,
  AiUsageRepository,
} from '../../domain/ai/ports/ai-usage.repository';
import {
  GenerationLimitReachedError,
  PieceLimitReachedError,
} from '../../domain/billing/errors';
import type { BillingRepository } from '../../domain/billing/ports/billing.repository';
import type { PlanGate } from '../../domain/billing/ports/plan-gate';
import type { Clock } from '../../domain/shared/ports/clock';
import type { AiSettings } from '../ai/ai-settings';

export interface BillingSettings {
  /** False during the beta: no limit, nothing to buy. */
  enabled: boolean;
  free: PlanLimits;
  /** Photo analyses included each calendar month in Premium. */
  premiumMonthlyAnalyses: number;
  /** Last day of the founders offer, null when it has no end. */
  foundersUntil: string | null;
  /** Lower-case e-mails of the accounts with no limit at all (the owner's). */
  unlimitedEmails: string[];
}

export const BILLING_SETTINGS = Symbol('BillingSettings');

const DAY_MS = 24 * 60 * 60 * 1000;
/** Shown to unlimited accounts; never decreases. */
const UNLIMITED_ANALYSES = 9999;
const UNLIMITED: PlanLimits = {
  pieces: null,
  generationsPerWeek: null,
  historyDays: null,
};

export interface CurrentPlan {
  plan: Plan;
  expiresAt: Date | null;
}

/** AI credits, and the pool the next analysis would be taken from. */
export interface AiBalance extends AiCredits {
  pool: AiPool | null;
}

/**
 * Free, Premium or founders: the limits of each plan and the AI credits left.
 * Premium analyses come from the monthly allowance first, then the balance
 * (free analyses, founders and bought credits), which never expires.
 */
export class PlanService implements PlanGate {
  constructor(
    private readonly billing: BillingRepository,
    private readonly aiUsage: AiUsageRepository,
    private readonly settings: BillingSettings,
    private readonly ai: AiSettings,
    private readonly clock: Clock,
  ) {}

  /** The owner's accounts: every limit lifted, AI analyses included. */
  async isUnlimited(userId: string): Promise<boolean> {
    if (this.settings.unlimitedEmails.length === 0) return false;
    const email = await this.billing.emailOf(userId);
    return (
      !!email && this.settings.unlimitedEmails.includes(email.toLowerCase())
    );
  }

  async current(userId: string): Promise<CurrentPlan> {
    if (await this.isUnlimited(userId))
      return { plan: 'founders', expiresAt: null };
    const entitlement = await this.billing.findEntitlement(userId);
    const active =
      entitlement &&
      (entitlement.expiresAt === null ||
        entitlement.expiresAt > this.clock.now());
    return active
      ? { plan: entitlement.plan, expiresAt: entitlement.expiresAt }
      : { plan: 'free', expiresAt: null };
  }

  limitsOf(plan: Plan): PlanLimits {
    return this.settings.enabled && plan === 'free'
      ? this.settings.free
      : UNLIMITED;
  }

  async assertCanAddPiece(userId: string): Promise<void> {
    const { pieces } = this.limitsOf((await this.current(userId)).plan);
    if (pieces === null) return;
    if ((await this.billing.countPieces(userId)) >= pieces)
      throw new PieceLimitReachedError();
  }

  async assertCanGenerate(userId: string): Promise<void> {
    const { generationsPerWeek } = this.limitsOf(
      (await this.current(userId)).plan,
    );
    if (generationsPerWeek === null) return;
    if ((await this.generationsThisWeek(userId)) >= generationsPerWeek)
      throw new GenerationLimitReachedError();
  }

  /** Always recorded: the usage is followed even without limits. */
  generationDone(userId: string): Promise<void> {
    return this.billing.recordUsage(userId, 'outfitGeneration');
  }

  async historyFrom(userId: string): Promise<string | null> {
    const { historyDays } = this.limitsOf((await this.current(userId)).plan);
    if (historyDays === null) return null;
    const first = new Date(
      this.clock.now().getTime() - (historyDays - 1) * DAY_MS,
    );
    return first.toISOString().slice(0, 10);
  }

  async credits(userId: string): Promise<AiBalance> {
    const free = this.ai.freePhotoAnalyses;
    if (!this.ai.enabled)
      return { enabled: false, remaining: 0, quota: free, pool: null };
    if (await this.isUnlimited(userId))
      return {
        enabled: true,
        remaining: UNLIMITED_ANALYSES,
        quota: UNLIMITED_ANALYSES,
        pool: 'balance',
      };
    const { plan } = await this.current(userId);
    const monthly =
      plan === 'premium' ? this.settings.premiumMonthlyAnalyses : 0;
    const [usedMonthly, usedBalance, granted] = await Promise.all([
      monthly
        ? this.aiUsage.countCharged(
            userId,
            'photoAnalysis',
            'monthly',
            this.monthStart(),
          )
        : 0,
      this.aiUsage.countCharged(userId, 'photoAnalysis', 'balance'),
      this.billing.grantedCredits(userId),
    ]);
    const monthlyLeft = Math.max(monthly - usedMonthly, 0);
    const balanceLeft = Math.max(free + granted - usedBalance, 0);
    return {
      enabled: true,
      remaining: monthlyLeft + balanceLeft,
      quota: monthly + free + granted,
      pool: monthlyLeft > 0 ? 'monthly' : balanceLeft > 0 ? 'balance' : null,
    };
  }

  async status(userId: string): Promise<BillingStatus> {
    const { plan, expiresAt } = await this.current(userId);
    const [pieces, generationsThisWeek, { pool: _pool, ...credits }] =
      await Promise.all([
        this.billing.countPieces(userId),
        this.generationsThisWeek(userId),
        this.credits(userId),
      ]);
    return {
      enabled: this.settings.enabled,
      plan,
      expiresAt: expiresAt?.toISOString() ?? null,
      limits: this.limitsOf(plan),
      usage: { pieces, generationsThisWeek },
      credits,
      offer: {
        free: this.settings.free,
        freeAnalyses: this.ai.freePhotoAnalyses,
        premiumMonthlyAnalyses: this.settings.premiumMonthlyAnalyses,
        foundersOnSale: this.foundersOnSale(),
        foundersUntil: this.settings.foundersUntil,
      },
    };
  }

  /** Limited in time: on sale until the end of its last day (UTC). */
  private foundersOnSale(): boolean {
    const until = this.settings.foundersUntil;
    if (!until) return true;
    return this.clock.now() < new Date(`${until}T23:59:59.999Z`);
  }

  private generationsThisWeek(userId: string): Promise<number> {
    const since = new Date(this.clock.now().getTime() - 7 * DAY_MS);
    return this.billing.countUsage(userId, 'outfitGeneration', since);
  }

  private monthStart(): Date {
    const now = this.clock.now();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  }
}
