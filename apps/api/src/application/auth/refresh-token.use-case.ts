import type { AuthTokens, RefreshTokenInput } from '@klotho/shared';

import { InvalidRefreshTokenError } from '../../domain/auth/errors';
import type { RefreshTokenRepository } from '../../domain/auth/ports/refresh-token.repository';
import type { SecureTokenGenerator } from '../../domain/auth/ports/secure-token.generator';
import type { Clock } from '../../domain/shared/ports/clock';
import type { UserRepository } from '../../domain/users/ports/user.repository';
import type { SessionIssuer } from './session-issuer';

/**
 * Refresh token rotation: each refresh token is single-use. Presenting one
 * that was already used means it leaked, so the whole session family is revoked.
 */
export class RefreshTokenUseCase {
  constructor(
    private readonly refreshTokens: RefreshTokenRepository,
    private readonly users: UserRepository,
    private readonly secureTokens: SecureTokenGenerator,
    private readonly sessions: SessionIssuer,
    private readonly clock: Clock,
  ) {}

  async execute(input: RefreshTokenInput): Promise<AuthTokens> {
    const now = this.clock.now();
    const record = await this.refreshTokens.findByHash(
      this.secureTokens.hash(input.refreshToken),
    );
    if (!record || record.expiresAt <= now) {
      throw new InvalidRefreshTokenError();
    }

    // `revoke` is atomic: if it returns false, the token was already used (possibly concurrently).
    const wasActive =
      record.revokedAt === null &&
      (await this.refreshTokens.revoke(record.id, now));
    if (!wasActive) {
      await this.refreshTokens.revokeFamily(record.familyId, now);
      throw new InvalidRefreshTokenError();
    }

    if (!(await this.users.findById(record.userId))) {
      throw new InvalidRefreshTokenError();
    }
    return this.sessions.issue(record.userId, record.familyId);
  }
}
