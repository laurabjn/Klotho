import { Logger } from '@nestjs/common';

import type {
  Mailer,
  PasswordResetEmail,
} from '../../domain/notifications/ports/mailer';

/**
 * Development mailer: writes emails to the server log instead of sending them.
 * It logs a usable reset link, so env validation forbids it in production.
 */
export class ConsoleMailer implements Mailer {
  private readonly logger = new Logger('ConsoleMailer');

  sendPasswordReset(email: PasswordResetEmail): Promise<void> {
    this.logger.log(
      `Password reset for ${email.to} (${email.firstName}): ${email.resetUrl}`,
    );
    return Promise.resolve();
  }
}
