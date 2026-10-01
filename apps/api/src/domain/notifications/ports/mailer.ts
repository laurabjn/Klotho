export interface PasswordResetEmail {
  to: string;
  firstName: string;
  resetUrl: string;
}

/** Sent to the NEW address of an e-mail change. */
export interface EmailChangeConfirmationEmail {
  to: string;
  firstName: string;
  confirmUrl: string;
}

export interface Mailer {
  sendPasswordReset(email: PasswordResetEmail): Promise<void>;
  sendEmailChangeConfirmation(
    email: EmailChangeConfirmationEmail,
  ): Promise<void>;
}

export const MAILER = Symbol('Mailer');
