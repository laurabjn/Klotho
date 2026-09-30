import type { ForgotPasswordInput } from '@klotho/shared';

import type { PasswordResetTokenRepository } from '../../domain/auth/ports/password-reset-token.repository';
import type { SecureTokenGenerator } from '../../domain/auth/ports/secure-token.generator';
import type { Mailer } from '../../domain/notifications/ports/mailer';
import type { Clock } from '../../domain/shared/ports/clock';
import { normalizeEmail } from '../../domain/users/entities/user.entity';
import type { UserRepository } from '../../domain/users/ports/user.repository';
import type { AuthSettings } from './auth-settings';

/**
 * Sends a single-use reset link. Resolves the same way whether or not the
 * email exists, so the endpoint cannot be used to discover accounts.
 */
export class ForgotPasswordUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly resetTokens: PasswordResetTokenRepository,
    private readonly secureTokens: SecureTokenGenerator,
    private readonly mailer: Mailer,
    private readonly clock: Clock,
    private readonly settings: AuthSettings,
  ) {}

  async execute(input: ForgotPasswordInput): Promise<void> {
    const user = await this.users.findByEmail(normalizeEmail(input.email));
    if (!user) return;

    const now = this.clock.now();
    await this.resetTokens.invalidateAllForUser(user.id, now);

    const token = this.secureTokens.generate();
    await this.resetTokens.create({
      userId: user.id,
      tokenHash: this.secureTokens.hash(token),
      expiresAt: new Date(
        now.getTime() + this.settings.passwordResetTtlMinutes * 60_000,
      ),
    });

    const resetUrl = new URL(this.settings.resetPasswordUrl);
    resetUrl.searchParams.set('token', token);
    await this.mailer.sendPasswordReset({
      to: user.email,
      firstName: user.firstName,
      resetUrl: resetUrl.toString(),
    });
  }
}
