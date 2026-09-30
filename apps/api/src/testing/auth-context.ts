import type { AuthSettings } from '../application/auth/auth-settings';
import { ForgotPasswordUseCase } from '../application/auth/forgot-password.use-case';
import { LoginUseCase } from '../application/auth/login.use-case';
import { LogoutUseCase } from '../application/auth/logout.use-case';
import { RefreshTokenUseCase } from '../application/auth/refresh-token.use-case';
import { RegisterUseCase } from '../application/auth/register.use-case';
import { ResetPasswordUseCase } from '../application/auth/reset-password.use-case';
import { SessionIssuer } from '../application/auth/session-issuer';
import { GetCurrentUserUseCase } from '../application/users/get-current-user.use-case';
import { UpdateProfileUseCase } from '../application/users/update-profile.use-case';
import {
  FakeAccessTokenService,
  FakePasswordHasher,
  FakeSecureTokenGenerator,
  FixedClock,
  InMemoryPasswordResetTokenRepository,
  InMemoryRefreshTokenRepository,
  InMemoryUserRepository,
  SpyMailer,
} from './fakes';

export const testAuthSettings: AuthSettings = {
  refreshTokenTtlDays: 30,
  passwordResetTtlMinutes: 60,
  resetPasswordUrl: 'klotho://reset-password',
};

/** Wires every auth/users use case on top of in-memory fakes. */
export function createAuthContext(settings: AuthSettings = testAuthSettings) {
  const clock = new FixedClock();
  const users = new InMemoryUserRepository(clock);
  const refreshTokens = new InMemoryRefreshTokenRepository();
  const resetTokens = new InMemoryPasswordResetTokenRepository();
  const hasher = new FakePasswordHasher();
  const accessTokens = new FakeAccessTokenService();
  const secureTokens = new FakeSecureTokenGenerator();
  const mailer = new SpyMailer();
  const sessions = new SessionIssuer(
    accessTokens,
    secureTokens,
    refreshTokens,
    clock,
    settings,
  );

  return {
    clock,
    users,
    refreshTokens,
    resetTokens,
    hasher,
    mailer,
    register: new RegisterUseCase(users, hasher, sessions),
    login: new LoginUseCase(users, hasher, sessions),
    refresh: new RefreshTokenUseCase(
      refreshTokens,
      users,
      secureTokens,
      sessions,
      clock,
    ),
    logout: new LogoutUseCase(refreshTokens, secureTokens, clock),
    forgotPassword: new ForgotPasswordUseCase(
      users,
      resetTokens,
      secureTokens,
      mailer,
      clock,
      settings,
    ),
    resetPassword: new ResetPasswordUseCase(
      resetTokens,
      users,
      refreshTokens,
      hasher,
      secureTokens,
      clock,
    ),
    getCurrentUser: new GetCurrentUserUseCase(users),
    updateProfile: new UpdateProfileUseCase(users),
  };
}

export type AuthContext = ReturnType<typeof createAuthContext>;

export const laura = {
  email: 'laura@example.com',
  password: 'Dressing2026!',
  firstName: 'Laura',
};
