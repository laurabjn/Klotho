import type { AuthSession, ChangePasswordInput } from '@klotho/shared';

import type { PasswordHasher } from '../../domain/auth/ports/password-hasher';
import type { PasswordResetTokenRepository } from '../../domain/auth/ports/password-reset-token.repository';
import type { RefreshTokenRepository } from '../../domain/auth/ports/refresh-token.repository';
import type { Clock } from '../../domain/shared/ports/clock';
import {
  InvalidPasswordError,
  UserNotFoundError,
} from '../../domain/users/errors';
import type { UserRepository } from '../../domain/users/ports/user.repository';
import type { SessionIssuer } from '../auth/session-issuer';
import type { UserProfilePresenter } from './user-profile.presenter';

/**
 * Changes the password after checking the current one, signs out every
 * device (all refresh tokens, pending reset links) and opens a fresh session
 * for the device that made the change.
 */
export class ChangePasswordUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly hasher: PasswordHasher,
    private readonly refreshTokens: RefreshTokenRepository,
    private readonly resetTokens: PasswordResetTokenRepository,
    private readonly sessions: SessionIssuer,
    private readonly profiles: UserProfilePresenter,
    private readonly clock: Clock,
  ) {}

  async execute(
    userId: string,
    input: ChangePasswordInput,
  ): Promise<AuthSession> {
    const user = await this.users.findById(userId);
    if (!user) throw new UserNotFoundError();
    if (!(await this.hasher.verify(input.currentPassword, user.passwordHash))) {
      throw new InvalidPasswordError();
    }

    await this.users.updatePasswordHash(
      userId,
      await this.hasher.hash(input.newPassword),
    );
    const now = this.clock.now();
    // Whoever knew the old password must lose access, on every device.
    await this.refreshTokens.revokeAllForUser(userId, now);
    await this.resetTokens.invalidateAllForUser(userId, now);

    return {
      user: await this.profiles.present(user),
      tokens: await this.sessions.issue(userId),
    };
  }
}
