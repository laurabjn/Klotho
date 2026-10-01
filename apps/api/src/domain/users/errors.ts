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

/** The new address of an e-mail change is the current one. */
export class SameEmailError extends DomainError {
  readonly code = 'users.sameEmail';
}

/**
 * The profile photo key was not produced by an upload of this user, the file
 * is gone, or it is already the photo of a piece.
 */
export class InvalidAvatarError extends DomainError {
  readonly code = 'users.invalidAvatar';
}
