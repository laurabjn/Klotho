export interface AuthSettings {
  refreshTokenTtlDays: number;
  passwordResetTtlMinutes: number;
  /** Deep link opened from the reset email; the token is appended as `?token=`. */
  resetPasswordUrl: string;
}

export const AUTH_SETTINGS = Symbol('AuthSettings');
