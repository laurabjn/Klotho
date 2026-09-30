import type { LogoutInput } from '@klotho/shared';

import type { RefreshTokenRepository } from '../../domain/auth/ports/refresh-token.repository';
import type { SecureTokenGenerator } from '../../domain/auth/ports/secure-token.generator';
import type { Clock } from '../../domain/shared/ports/clock';

/** Ends the session of this device. Idempotent: unknown tokens are ignored. */
export class LogoutUseCase {
  constructor(
    private readonly refreshTokens: RefreshTokenRepository,
    private readonly secureTokens: SecureTokenGenerator,
    private readonly clock: Clock,
  ) {}

  async execute(input: LogoutInput): Promise<void> {
    const record = await this.refreshTokens.findByHash(
      this.secureTokens.hash(input.refreshToken),
    );
    if (record) {
      await this.refreshTokens.revokeFamily(record.familyId, this.clock.now());
    }
  }
}
