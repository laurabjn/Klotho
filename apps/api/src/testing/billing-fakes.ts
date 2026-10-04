import type {
  BillingRepository,
  CreditGrant,
  Entitlement,
  MeteredFeature,
} from '../domain/billing/ports/billing.repository';
import type {
  StoreCustomer,
  StoreCustomers,
} from '../domain/billing/ports/store-customers';
import { StoreUnavailableError } from '../domain/billing/errors';
import type { Clock } from '../domain/shared/ports/clock';

export class InMemoryBillingRepository implements BillingRepository {
  readonly entitlements = new Map<string, Entitlement>();
  readonly grants: (CreditGrant & { userId: string })[] = [];
  readonly usage: { userId: string; feature: MeteredFeature; at: Date }[] = [];
  /** Pieces of each user (the wardrobe is not needed here). */
  readonly pieces = new Map<string, number>();
  readonly users = new Set<string>();

  constructor(private readonly clock: Clock) {}

  findEntitlement(userId: string): Promise<Entitlement | null> {
    return Promise.resolve(this.entitlements.get(userId) ?? null);
  }

  saveEntitlement(
    userId: string,
    entitlement: Entitlement | null,
  ): Promise<void> {
    if (entitlement) this.entitlements.set(userId, entitlement);
    else this.entitlements.delete(userId);
    return Promise.resolve();
  }

  grantCredits(userId: string, grant: CreditGrant): Promise<boolean> {
    if (this.grants.some((g) => g.transactionId === grant.transactionId))
      return Promise.resolve(false);
    this.grants.push({ userId, ...grant });
    return Promise.resolve(true);
  }

  grantedCredits(userId: string): Promise<number> {
    return Promise.resolve(
      this.grants
        .filter((g) => g.userId === userId)
        .reduce((sum, g) => sum + g.amount, 0),
    );
  }

  recordUsage(userId: string, feature: MeteredFeature): Promise<void> {
    this.usage.push({ userId, feature, at: this.clock.now() });
    return Promise.resolve();
  }

  countUsage(
    userId: string,
    feature: MeteredFeature,
    since: Date,
  ): Promise<number> {
    return Promise.resolve(
      this.usage.filter(
        (u) => u.userId === userId && u.feature === feature && u.at >= since,
      ).length,
    );
  }

  countPieces(userId: string): Promise<number> {
    return Promise.resolve(this.pieces.get(userId) ?? 0);
  }

  userExists(userId: string): Promise<boolean> {
    return Promise.resolve(this.users.has(userId));
  }
}

/** The store's view of each user; unknown users have bought nothing. */
export class FakeStoreCustomers implements StoreCustomers {
  readonly customers = new Map<string, StoreCustomer>();
  readonly calls: string[] = [];
  failing = false;

  get(userId: string): Promise<StoreCustomer> {
    this.calls.push(userId);
    if (this.failing) return Promise.reject(new StoreUnavailableError());
    return Promise.resolve(
      this.customers.get(userId) ?? { entitlements: [], purchases: [] },
    );
  }

  reset(): void {
    this.customers.clear();
    this.calls.length = 0;
    this.failing = false;
  }
}
