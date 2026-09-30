import { DomainError } from '../shared/domain-error';

/** Same error for unknown email and wrong password, so accounts cannot be enumerated. */
export class InvalidCredentialsError extends DomainError {
  readonly code = 'auth.invalidCredentials';
}

export class InvalidRefreshTokenError extends DomainError {
  readonly code = 'auth.invalidRefreshToken';
}

export class InvalidResetTokenError extends DomainError {
  readonly code = 'auth.invalidResetToken';
}
