import { DomainError } from '../shared/domain-error';

/** The free plan holds a limited number of pieces. */
export class PieceLimitReachedError extends DomainError {
  readonly code = 'billing.pieceLimit';
}

/** The free plan generates a limited number of times a week. */
export class GenerationLimitReachedError extends DomainError {
  readonly code = 'billing.generationLimit';
}

/** The store (RevenueCat) could not be reached. */
export class StoreUnavailableError extends DomainError {
  readonly code = 'billing.storeUnavailable';
}
