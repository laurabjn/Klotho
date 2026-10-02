import { DomainError } from '../shared/domain-error';

/** No such notification (or it is someone else's). */
export class NotificationNotFoundError extends DomainError {
  readonly code = 'notifications.notFound';
}
