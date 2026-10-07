import {
  GenerationLimitReachedError,
  PieceLimitReachedError,
  StoreUnavailableError,
} from '../../domain/billing/errors';
import { InMemoryAiUsageRepository } from '../../testing/ai-fakes';
import {
  FakeStoreCustomers,
  InMemoryBillingRepository,
} from '../../testing/billing-fakes';
import { FixedClock } from '../../testing/fakes';
import { HandleStoreEventUseCase } from './handle-store-event.use-case';
import { PlanService, type BillingSettings } from './plan.service';
import { SyncPurchasesUseCase } from './sync-purchases.use-case';

const LAURA = 'user-laura';
const DAY = 24 * 60 * 60 * 1000;
const SETTINGS: BillingSettings = {
  enabled: true,
  free: { pieces: 3, generationsPerWeek: 2, historyDays: 7 },
  premiumMonthlyAnalyses: 25,
  foundersUntil: null,
};

describe('Billing', () => {
  let clock: FixedClock;
  let billing: InMemoryBillingRepository;
  let store: FakeStoreCustomers;
  let plans: PlanService;
  let sync: SyncPurchasesUseCase;

  const build = (settings = SETTINGS) => {
    plans = new PlanService(
      billing,
      new InMemoryAiUsageRepository(),
      settings,
      { enabled: true, freePhotoAnalyses: 3 },
      clock,
    );
  };

  beforeEach(() => {
    // 2026-10-01T08:00Z
    clock = new FixedClock();
    billing = new InMemoryBillingRepository(clock);
    store = new FakeStoreCustomers();
    sync = new SyncPurchasesUseCase(store, billing, clock);
    build();
  });

  describe('free plan', () => {
    it('stops adding pieces at the limit', async () => {
      billing.pieces.set(LAURA, 2);
      await expect(plans.assertCanAddPiece(LAURA)).resolves.toBeUndefined();

      billing.pieces.set(LAURA, 3);
      await expect(plans.assertCanAddPiece(LAURA)).rejects.toBeInstanceOf(
        PieceLimitReachedError,
      );
    });

    it('counts the generations of the last 7 days', async () => {
      await plans.generationDone(LAURA);
      await plans.generationDone(LAURA);
      await expect(plans.assertCanGenerate(LAURA)).rejects.toBeInstanceOf(
        GenerationLimitReachedError,
      );

      clock.advance(7 * DAY + 1);
      await expect(plans.assertCanGenerate(LAURA)).resolves.toBeUndefined();
    });

    it('shows the history of the last 7 days', async () => {
      await expect(plans.historyFrom(LAURA)).resolves.toBe('2026-09-25');
    });

    it('lifts every limit while payments are off (beta)', async () => {
      build({ ...SETTINGS, enabled: false });
      billing.pieces.set(LAURA, 500);
      await plans.generationDone(LAURA);
      await plans.generationDone(LAURA);

      await expect(plans.assertCanAddPiece(LAURA)).resolves.toBeUndefined();
      await expect(plans.assertCanGenerate(LAURA)).resolves.toBeUndefined();
      await expect(plans.historyFrom(LAURA)).resolves.toBeNull();
    });
  });

  describe('paid plans', () => {
    it('has no limit while Premium is active, then falls back to free', async () => {
      billing.pieces.set(LAURA, 10);
      billing.entitlements.set(LAURA, {
        plan: 'premium',
        productId: 'klotho_premium_monthly',
        expiresAt: new Date('2026-10-15T00:00:00Z'),
      });

      await expect(plans.assertCanAddPiece(LAURA)).resolves.toBeUndefined();
      await expect(plans.historyFrom(LAURA)).resolves.toBeNull();

      clock.advance(15 * DAY);
      await expect(plans.current(LAURA)).resolves.toEqual({
        plan: 'free',
        expiresAt: null,
      });
      await expect(plans.assertCanAddPiece(LAURA)).rejects.toBeInstanceOf(
        PieceLimitReachedError,
      );
    });

    it('sells founders until the end of its last day', async () => {
      build({ ...SETTINGS, foundersUntil: '2026-10-31' });
      expect((await plans.status(LAURA)).offer).toMatchObject({
        foundersOnSale: true,
        foundersUntil: '2026-10-31',
      });

      clock.advance(31 * DAY);
      expect((await plans.status(LAURA)).offer.foundersOnSale).toBe(false);
    });

    it('keeps founders for life', async () => {
      billing.entitlements.set(LAURA, {
        plan: 'founders',
        productId: 'klotho_founders',
        expiresAt: null,
      });
      clock.advance(3000 * DAY);

      await expect(plans.current(LAURA)).resolves.toEqual({
        plan: 'founders',
        expiresAt: null,
      });
    });

    it('sums everything up for the app', async () => {
      billing.pieces.set(LAURA, 2);
      await plans.generationDone(LAURA);

      await expect(plans.status(LAURA)).resolves.toEqual({
        enabled: true,
        plan: 'free',
        expiresAt: null,
        limits: SETTINGS.free,
        usage: { pieces: 2, generationsThisWeek: 1 },
        credits: { enabled: true, remaining: 3, quota: 3 },
        offer: {
          free: SETTINGS.free,
          freeAnalyses: 3,
          premiumMonthlyAnalyses: 25,
          foundersOnSale: true,
          foundersUntil: null,
        },
      });
    });
  });

  describe('SyncPurchasesUseCase', () => {
    it('saves the active Premium subscription', async () => {
      store.customers.set(LAURA, {
        entitlements: [
          {
            id: 'premium',
            productId: 'klotho_premium_annual',
            expiresAt: new Date('2027-10-01T00:00:00Z'),
          },
        ],
        purchases: [],
      });

      await sync.execute(LAURA);

      await expect(plans.current(LAURA)).resolves.toEqual({
        plan: 'premium',
        expiresAt: new Date('2027-10-01T00:00:00Z'),
      });
    });

    it('prefers founders, and credits its 30 analyses once', async () => {
      store.customers.set(LAURA, {
        entitlements: [
          { id: 'founders', productId: 'klotho_founders', expiresAt: null },
          {
            id: 'premium',
            productId: 'klotho_premium_monthly',
            expiresAt: new Date('2026-10-20T00:00:00Z'),
          },
        ],
        purchases: [{ productId: 'klotho_founders', transactionId: 'GPA.F' }],
      });

      await sync.execute(LAURA);
      await sync.execute(LAURA);

      expect((await plans.current(LAURA)).plan).toBe('founders');
      await expect(billing.grantedCredits(LAURA)).resolves.toBe(30);
    });

    it('credits each pack once, whatever the number of syncs', async () => {
      store.customers.set(LAURA, {
        entitlements: [],
        purchases: [
          { productId: 'klotho_credits_25', transactionId: 'GPA.1' },
          { productId: 'klotho_credits_75', transactionId: 'GPA.2' },
          { productId: 'some_other_product', transactionId: 'GPA.3' },
        ],
      });

      await sync.execute(LAURA);
      await sync.execute(LAURA);

      await expect(billing.grantedCredits(LAURA)).resolves.toBe(100);
    });

    it('removes an expired subscription', async () => {
      billing.entitlements.set(LAURA, {
        plan: 'premium',
        productId: 'klotho_premium_monthly',
        expiresAt: new Date('2026-10-30T00:00:00Z'),
      });
      store.customers.set(LAURA, {
        entitlements: [
          {
            id: 'premium',
            productId: 'klotho_premium_monthly',
            expiresAt: new Date('2026-09-30T00:00:00Z'),
          },
        ],
        purchases: [],
      });

      await sync.execute(LAURA);

      expect(billing.entitlements.has(LAURA)).toBe(false);
    });

    it('changes nothing when the store cannot be reached', async () => {
      billing.entitlements.set(LAURA, {
        plan: 'founders',
        productId: 'klotho_founders',
        expiresAt: null,
      });
      store.failing = true;

      await expect(sync.execute(LAURA)).rejects.toBeInstanceOf(
        StoreUnavailableError,
      );
      expect(billing.entitlements.get(LAURA)?.plan).toBe('founders');
    });
  });

  describe('HandleStoreEventUseCase', () => {
    it('syncs every Klotho account of the event, never anonymous ones', async () => {
      billing.users.add(LAURA).add('user-other');
      const handle = new HandleStoreEventUseCase(billing, sync);

      const synced = await handle.execute({
        api_version: '1.0',
        event: {
          type: 'TRANSFER',
          app_user_id: LAURA,
          transferred_from: ['$RCAnonymousID:abc', 'user-other'],
          transferred_to: ['user-unknown'],
        },
      });

      expect(synced).toEqual([LAURA, 'user-other']);
      expect(store.calls).toEqual([LAURA, 'user-other']);
    });

    it('ignores what is not an event', async () => {
      const handle = new HandleStoreEventUseCase(billing, sync);

      await expect(handle.execute({ hello: 'world' })).resolves.toEqual([]);
    });
  });
});
