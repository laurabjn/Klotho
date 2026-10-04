/** What the store (RevenueCat) knows of a user's purchases. */
export interface StoreCustomer {
  /** Active or expired entitlements; null expiry means lifetime. */
  entitlements: { id: string; productId: string; expiresAt: Date | null }[];
  /** One-time purchases (credit packs, founders). */
  purchases: { productId: string; transactionId: string }[];
}

/** Implementations throw StoreUnavailableError on failure. */
export interface StoreCustomers {
  get(userId: string): Promise<StoreCustomer>;
}

export const STORE_CUSTOMERS = Symbol('StoreCustomers');
