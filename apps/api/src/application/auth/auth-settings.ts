export interface AuthSettings {
  refreshTokenTtlDays: number;
  passwordResetTtlMinutes: number;
  /** Deep link opened from the reset email; the token is appended as `?token=`. */
  resetPasswordUrl: string;
  emailChangeTtlMinutes: number;
  /** Deep link opened from the e-mail change confirmation; `?token=` is appended. */
  confirmEmailUrl: string;
}

export const AUTH_SETTINGS = Symbol('AuthSettings');
