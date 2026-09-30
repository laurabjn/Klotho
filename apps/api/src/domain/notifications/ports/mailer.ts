export interface PasswordResetEmail {
  to: string;
  firstName: string;
  resetUrl: string;
}

export interface Mailer {
  sendPasswordReset(email: PasswordResetEmail): Promise<void>;
}

export const MAILER = Symbol('Mailer');
