import { Logger } from '@nestjs/common';
import { z } from 'zod';

import { StoreUnavailableError } from '../../domain/billing/errors';
import type {
  StoreCustomer,
  StoreCustomers,
} from '../../domain/billing/ports/store-customers';

export interface RevenueCatConfig {
  /** Secret API key (sk_…), never the public key of the app. */
  secretKey: string | undefined;
  timeoutMs: number;
}

type Fetch = (url: URL, init: RequestInit) => Promise<Response>;

const BASE_URL = 'https://api.revenuecat.com';

const date = z.string().nullable().optional();
const subscriberResponse = z.object({
  subscriber: z.object({
    entitlements: z
      .record(
        z.string(),
        z.object({ expires_date: date, product_identifier: z.string() }),
      )
      .default({}),
    non_subscriptions: z
      .record(
        z.string(),
        z.array(
          z.object({
            id: z.string(),
            store_transaction_id: z.string().nullable().optional(),
          }),
        ),
      )
      .default({}),
  }),
});

/** The customer as RevenueCat sees it (REST API v1, "GET subscriber"). */
export class RevenueCatCustomers implements StoreCustomers {
  private readonly logger = new Logger(RevenueCatCustomers.name);

  constructor(
    private readonly config: RevenueCatConfig,
    private readonly fetchFn: Fetch = fetch,
  ) {}

  async get(userId: string): Promise<StoreCustomer> {
    if (!this.config.secretKey) {
      throw new StoreUnavailableError('REVENUECAT_SECRET_KEY is not set');
    }
    const url = new URL(
      `/v1/subscribers/${encodeURIComponent(userId)}`,
      BASE_URL,
    );
    let response: Response;
    try {
      response = await this.fetchFn(url, {
        headers: { authorization: `Bearer ${this.config.secretKey}` },
        signal: AbortSignal.timeout(this.config.timeoutMs),
      });
    } catch (error) {
      const reason = error instanceof Error ? error.name : 'unknown';
      this.logger.warn(`subscriber lookup failed (${reason})`);
      throw new StoreUnavailableError();
    }
    if (!response.ok) {
      this.logger.warn(`subscriber lookup answered ${response.status}`);
      throw new StoreUnavailableError();
    }
    const parsed = subscriberResponse.safeParse(
      await response.json().catch(() => null),
    );
    if (!parsed.success) {
      this.logger.warn('subscriber lookup returned an unexpected answer');
      throw new StoreUnavailableError();
    }
    const { entitlements, non_subscriptions } = parsed.data.subscriber;
    return {
      entitlements: Object.entries(entitlements).map(([id, e]) => ({
        id,
        productId: e.product_identifier,
        expiresAt: e.expires_date ? new Date(e.expires_date) : null,
      })),
      purchases: Object.entries(non_subscriptions).flatMap(
        ([productId, purchases]) =>
          purchases.map((p) => ({
            productId,
            transactionId: p.store_transaction_id ?? p.id,
          })),
      ),
    };
  }
}
