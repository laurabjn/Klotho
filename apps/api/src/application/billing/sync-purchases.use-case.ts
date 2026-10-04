import { CREDIT_PRODUCTS, ENTITLEMENTS } from '@klotho/shared';

import type {
  BillingRepository,
  Entitlement,
} from '../../domain/billing/ports/billing.repository';
import type { StoreCustomers } from '../../domain/billing/ports/store-customers';
import type { Clock } from '../../domain/shared/ports/clock';

/**
 * Copies what the store knows into our database: the active plan, and the
 * credits of every one-time purchase not counted yet. Run after a purchase
 * (asked by the app) and on every RevenueCat webhook, so it is idempotent.
 */
export class SyncPurchasesUseCase {
  constructor(
    private readonly store: StoreCustomers,
    private readonly billing: BillingRepository,
    private readonly clock: Clock,
  ) {}

  async execute(userId: string): Promise<void> {
    const customer = await this.store.get(userId);
    const now = this.clock.now();
    const active = (id: string) =>
      customer.entitlements.find(
        (e) => e.id === id && (e.expiresAt === null || e.expiresAt > now),
      );

    const founders = active(ENTITLEMENTS.founders);
    const premium = active(ENTITLEMENTS.premium);
    const entitlement: Entitlement | null = founders
      ? { plan: 'founders', productId: founders.productId, expiresAt: null }
      : premium
        ? {
            plan: 'premium',
            productId: premium.productId,
            expiresAt: premium.expiresAt,
          }
        : null;
    await this.billing.saveEntitlement(userId, entitlement);

    for (const purchase of customer.purchases) {
      const amount = CREDIT_PRODUCTS[purchase.productId];
      if (amount)
        await this.billing.grantCredits(userId, { amount, ...purchase });
    }
  }
}
