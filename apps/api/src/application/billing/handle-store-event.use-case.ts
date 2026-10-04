import { z } from 'zod';

import type { BillingRepository } from '../../domain/billing/ports/billing.repository';
import type { SyncPurchasesUseCase } from './sync-purchases.use-case';

// Only the ids are read: the purchases themselves are fetched from the store.
const storeEvent = z.object({
  event: z.looseObject({
    app_user_id: z.string().optional(),
    original_app_user_id: z.string().optional(),
    aliases: z.array(z.string()).optional(),
    transferred_from: z.array(z.string()).optional(),
    transferred_to: z.array(z.string()).optional(),
  }),
});

/**
 * A RevenueCat webhook (purchase, renewal, cancellation, expiry, transfer…):
 * every Klotho account it mentions is synced again from the store.
 */
export class HandleStoreEventUseCase {
  constructor(
    private readonly billing: BillingRepository,
    private readonly sync: SyncPurchasesUseCase,
  ) {}

  /** Returns the accounts synced. */
  async execute(body: unknown): Promise<string[]> {
    const parsed = storeEvent.safeParse(body);
    if (!parsed.success) return [];
    const { event } = parsed.data;
    const ids = new Set(
      [
        event.app_user_id,
        event.original_app_user_id,
        ...(event.aliases ?? []),
        ...(event.transferred_from ?? []),
        ...(event.transferred_to ?? []),
      ].filter(
        // Anonymous buyers (before sign-in) are not Klotho accounts.
        (id): id is string => !!id && !id.startsWith('$RCAnonymousID'),
      ),
    );
    const synced: string[] = [];
    for (const id of ids) {
      if (!(await this.billing.userExists(id))) continue;
      await this.sync.execute(id);
      synced.push(id);
    }
    return synced;
  }
}
