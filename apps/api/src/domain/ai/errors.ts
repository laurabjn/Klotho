import { DomainError } from '../shared/domain-error';

/** No AI service is configured, or it did not answer in time. */
export class AiUnavailableError extends DomainError {
  readonly code = 'ai.unavailable';
}

/** Every photo analysis of the user has been used. */
export class AiQuotaExceededError extends DomainError {
  readonly code = 'ai.quotaExceeded';
}

/** The photo shows no piece of clothing (not counted in the quota). */
export class NoGarmentError extends DomainError {
  readonly code = 'ai.noGarment';
}
