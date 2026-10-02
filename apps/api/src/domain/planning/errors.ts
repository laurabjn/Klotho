import { DomainError } from '../shared/domain-error';

/** No look is planned that day (or it is someone else's plan). */
export class PlanNotFoundError extends DomainError {
  readonly code = 'plans.notFound';
}

/** "Planifier ma semaine" cannot start in the past. */
export class PastDayError extends DomainError {
  readonly code = 'plans.pastDay';
}
