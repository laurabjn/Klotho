import type { ChangeEmailInput } from '@klotho/shared';

import type { PasswordHasher } from '../../domain/auth/ports/password-hasher';
import type { SecureTokenGenerator } from '../../domain/auth/ports/secure-token.generator';
import type { Mailer } from '../../domain/notifications/ports/mailer';
import type { Clock } from '../../domain/shared/ports/clock';
import { normalizeEmail } from '../../domain/users/entities/user.entity';
import {
  EmailAlreadyUsedError,
  InvalidPasswordError,
  SameEmailError,
  UserNotFoundError,
} from '../../domain/users/errors';
import type { EmailChangeTokenRepository } from '../../domain/users/ports/email-change-token.repository';
import type { UserRepository } from '../../domain/users/ports/user.repository';
import type { AuthSettings } from '../auth/auth-settings';

/**
 * First step of an e-mail change: after checking the password, sends a
 * single-use link to the NEW address. The address only changes once the link
 * is opened (ConfirmEmailChangeUseCase), which proves it belongs to the user.
 */
export class RequestEmailChangeUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly hasher: PasswordHasher,
    private readonly emailChanges: EmailChangeTokenRepository,
    private readonly secureTokens: SecureTokenGenerator,
    private readonly mailer: Mailer,
    private readonly clock: Clock,
    private readonly settings: AuthSettings,
  ) {}

  async execute(
    userId: string,
    input: ChangeEmailInput,
  ): Promise<{ pendingEmail: string }> {
    const user = await this.users.findById(userId);
    if (!user) throw new UserNotFoundError();
    if (!(await this.hasher.verify(input.password, user.passwordHash))) {
      throw new InvalidPasswordError();
    }
    const newEmail = normalizeEmail(input.newEmail);
    if (newEmail === user.email) throw new SameEmailError();
    if (await this.users.findByEmail(newEmail)) {
      throw new EmailAlreadyUsedError();
    }

    // Replaces any previous request: only the last link works.
    const token = this.secureTokens.generate();
    await this.emailChanges.replaceForUser({
      userId,
      newEmail,
      tokenHash: this.secureTokens.hash(token),
      expiresAt: new Date(
        this.clock.now().getTime() +
          this.settings.emailChangeTtlMinutes * 60_000,
      ),
    });

    const confirmUrl = new URL(this.settings.confirmEmailUrl);
    confirmUrl.searchParams.set('token', token);
    await this.mailer.sendEmailChangeConfirmation({
      to: newEmail,
      firstName: user.firstName,
      confirmUrl: confirmUrl.toString(),
    });
    return { pendingEmail: newEmail };
  }
}
