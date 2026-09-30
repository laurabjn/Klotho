import type { ResetPasswordInput } from '@klotho/shared';

import { InvalidResetTokenError } from '../../domain/auth/errors';
import type { PasswordHasher } from '../../domain/auth/ports/password-hasher';
import type { PasswordResetTokenRepository } from '../../domain/auth/ports/password-reset-token.repository';
import type { RefreshTokenRepository } from '../../domain/auth/ports/refresh-token.repository';
import type { SecureTokenGenerator } from '../../domain/auth/ports/secure-token.generator';
import type { Clock } from '../../domain/shared/ports/clock';
import type { UserRepository } from '../../domain/users/ports/user.repository';

export class ResetPasswordUseCase {
  constructor(
    private readonly resetTokens: PasswordResetTokenRepository,
    private readonly users: UserRepository,
    private readonly refreshTokens: RefreshTokenRepository,
    private readonly hasher: PasswordHasher,
    private readonly secureTokens: SecureTokenGenerator,
    private readonly clock: Clock,
  ) {}

  async execute(input: ResetPasswordInput): Promise<void> {
    const now = this.clock.now();
    const record = await this.resetTokens.findByHash(
      this.secureTokens.hash(input.token),
    );
    if (!record || record.usedAt !== null || record.expiresAt <= now) {
      throw new InvalidResetTokenError();
    }
    // Consume first (atomically), so a token can never be used twice.
    if (!(await this.resetTokens.markUsed(record.id, now))) {
      throw new InvalidResetTokenError();
    }

    await this.users.updatePasswordHash(
      record.userId,
      await this.hasher.hash(input.password),
    );
    await this.resetTokens.invalidateAllForUser(record.userId, now);
    // Whoever knew the old password must lose access.
    await this.refreshTokens.revokeAllForUser(record.userId, now);
  }
}
