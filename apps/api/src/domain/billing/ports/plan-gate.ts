/** The limits of the free plan, checked by the use cases they concern. */
export interface PlanGate {
  /** @throws PieceLimitReachedError */
  assertCanAddPiece(userId: string): Promise<void>;
  /** @throws GenerationLimitReachedError */
  assertCanGenerate(userId: string): Promise<void>;
  generationDone(userId: string): Promise<void>;
  /** First calendar day of the visible history, or null for all of it. */
  historyFrom(userId: string): Promise<string | null>;
}

/** No limit at all (tests, and use cases built without billing). */
export const NO_LIMITS: PlanGate = {
  assertCanAddPiece: () => Promise.resolve(),
  assertCanGenerate: () => Promise.resolve(),
  generationDone: () => Promise.resolve(),
  historyFrom: () => Promise.resolve(null),
};

export const PLAN_GATE = Symbol('PlanGate');
