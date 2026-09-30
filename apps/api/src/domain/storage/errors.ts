import { DomainError } from '../shared/domain-error';

export class InvalidImageError extends DomainError {
  readonly code = 'uploads.invalidImage';
}

/** The key was not produced by an upload of this user, or the file is gone. */
export class UploadNotFoundError extends DomainError {
  readonly code = 'uploads.notFound';
}
