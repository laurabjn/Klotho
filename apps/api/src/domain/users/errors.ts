import { DomainError } from '../shared/domain-error';

export class UserNotFoundError extends DomainError {
  readonly code = 'users.notFound';
}

export class EmailAlreadyUsedError extends DomainError {
  readonly code = 'auth.emailAlreadyUsed';
}
