/**
 * Base class for business rule violations. `code` is stable and is sent to
 * clients (the mobile app uses it as an i18n key); the HTTP layer maps it to a status.
 */
export abstract class DomainError extends Error {
  abstract readonly code: string;

  constructor(message?: string) {
    super(message);
    this.name = new.target.name;
  }
}
