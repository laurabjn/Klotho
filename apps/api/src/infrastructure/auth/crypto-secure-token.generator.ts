import { createHash, randomBytes } from 'node:crypto';

import type { SecureTokenGenerator } from '../../domain/auth/ports/secure-token.generator';

/**
 * 256 bits of randomness: too strong to brute-force, so a fast unsalted
 * SHA-256 is enough to store it (unlike passwords).
 */
export class CryptoSecureTokenGenerator implements SecureTokenGenerator {
  generate(): string {
    return randomBytes(32).toString('base64url');
  }

  hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
