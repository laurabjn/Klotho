import { DomainError } from '../shared/domain-error';

export class UserNotFoundError extends DomainError {
  readonly code = 'users.notFound';
}

/**
 * The password typed to confirm a sensitive action (account deletion) is
 * wrong. Not a 401: the session itself is still valid.
 */
export class InvalidPasswordError extends DomainError {
  readonly code = 'users.invalidPassword';
}

export class EmailAlreadyUsedError extends DomainError {
  readonly code = 'auth.emailAlreadyUsed';
}
