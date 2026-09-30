/**
 * Opaque tokens (refresh, password reset) are given to the client once and
 * only their hash is stored, so a database leak does not expose usable tokens.
 */
export interface SecureTokenGenerator {
  generate(): string;
  hash(token: string): string;
}

export const SECURE_TOKEN_GENERATOR = Symbol('SecureTokenGenerator');
