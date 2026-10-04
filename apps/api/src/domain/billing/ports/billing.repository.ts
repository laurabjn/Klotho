/** A paid plan, as last confirmed by the store. */
export interface Entitlement {
  plan: 'premium' | 'founders';
  productId: string;
  /** Null for the lifetime founders offer. */
  expiresAt: Date | null;
}

export interface CreditGrant {
  amount: number;
  productId: string;
  /** Store transaction: a purchase is credited once, however often synced. */
  transactionId: string;
}

export type MeteredFeature = 'outfitGeneration';

export interface BillingRepository {
  findEntitlement(userId: string): Promise<Entitlement | null>;
  saveEntitlement(
    userId: string,
    entitlement: Entitlement | null,
  ): Promise<void>;
  /** False when this transaction was already credited. */
  grantCredits(userId: string, grant: CreditGrant): Promise<boolean>;
  grantedCredits(userId: string): Promise<number>;
  recordUsage(userId: string, feature: MeteredFeature): Promise<void>;
  countUsage(
    userId: string,
    feature: MeteredFeature,
    since: Date,
  ): Promise<number>;
  countPieces(userId: string): Promise<number>;
  userExists(userId: string): Promise<boolean>;
}

export const BILLING_REPOSITORY = Symbol('BillingRepository');
