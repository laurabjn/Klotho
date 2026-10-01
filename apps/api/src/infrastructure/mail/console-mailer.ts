import type {
  EmailChangeConfirmationEmail,
  Mailer,
  PasswordResetEmail,
} from '../../domain/notifications/ports/mailer';

/**
 * Development mailer: writes emails to the console instead of sending them.
 * It prints usable links (reset, e-mail confirmation), so env validation
 * forbids it in production. It writes to stdout directly: the logger would
 * (rightly) mask the token.
 */
export class ConsoleMailer implements Mailer {
  constructor(
    private readonly write: (line: string) => void = (line) =>
      process.stdout.write(`${line}\n`),
  ) {}

  sendPasswordReset(email: PasswordResetEmail): Promise<void> {
    this.write(
      `[ConsoleMailer] Password reset for ${email.to} (${email.firstName}): ${email.resetUrl}`,
    );
    return Promise.resolve();
  }

  sendEmailChangeConfirmation(
    email: EmailChangeConfirmationEmail,
  ): Promise<void> {
    this.write(
      `[ConsoleMailer] E-mail change confirmation for ${email.to} (${email.firstName}): ${email.confirmUrl}`,
    );
    return Promise.resolve();
  }
}
