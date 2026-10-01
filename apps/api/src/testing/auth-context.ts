import type { AuthSettings } from '../application/auth/auth-settings';
import { ConfirmEmailChangeUseCase } from '../application/auth/confirm-email-change.use-case';
import { ForgotPasswordUseCase } from '../application/auth/forgot-password.use-case';
import { LoginUseCase } from '../application/auth/login.use-case';
import { LogoutUseCase } from '../application/auth/logout.use-case';
import { RefreshTokenUseCase } from '../application/auth/refresh-token.use-case';
import { RegisterUseCase } from '../application/auth/register.use-case';
import { ResetPasswordUseCase } from '../application/auth/reset-password.use-case';
import { SessionIssuer } from '../application/auth/session-issuer';
import {
  RemoveAvatarUseCase,
  SetAvatarUseCase,
} from '../application/users/avatar.use-cases';
import { ChangePasswordUseCase } from '../application/users/change-password.use-case';
import { GetCurrentUserUseCase } from '../application/users/get-current-user.use-case';
import { RequestEmailChangeUseCase } from '../application/users/request-email-change.use-case';
import { UpdateProfileUseCase } from '../application/users/update-profile.use-case';
import { UserProfilePresenter } from '../application/users/user-profile.presenter';
import {
  FakeAccessTokenService,
  FakePasswordHasher,
  FakeSecureTokenGenerator,
  FixedClock,
  InMemoryEmailChangeTokenRepository,
  InMemoryPasswordResetTokenRepository,
  InMemoryRefreshTokenRepository,
  InMemoryUserRepository,
  SpyMailer,
} from './fakes';
import { InMemoryWardrobeRepository } from './in-memory-wardrobe.repository';
import {
  InMemoryFileStorage,
  InMemoryWardrobePhotoRepository,
} from './storage-fakes';

export const testAuthSettings: AuthSettings = {
  refreshTokenTtlDays: 30,
  passwordResetTtlMinutes: 60,
  resetPasswordUrl: 'klotho://reset-password',
  emailChangeTtlMinutes: 60,
  confirmEmailUrl: 'klotho://confirm-email',
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
  const emailChanges = new InMemoryEmailChangeTokenRepository();
  const storage = new InMemoryFileStorage();
  const wardrobe = new InMemoryWardrobeRepository(clock);
  const photos = new InMemoryWardrobePhotoRepository(wardrobe, clock);
  const profiles = new UserProfilePresenter(storage, emailChanges, clock);
  /** Previous profile photos that could not be removed. */
  const avatarCleanupFailures: unknown[] = [];
  const reportAvatarCleanupFailure = (error: unknown) =>
    avatarCleanupFailures.push(error);
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
    emailChanges,
    storage,
    wardrobe,
    photos,
    avatarCleanupFailures,
    register: new RegisterUseCase(users, hasher, sessions),
    login: new LoginUseCase(users, hasher, sessions, profiles),
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
    getCurrentUser: new GetCurrentUserUseCase(users, profiles),
    updateProfile: new UpdateProfileUseCase(users, profiles),
    setAvatar: new SetAvatarUseCase(
      users,
      photos,
      storage,
      profiles,
      reportAvatarCleanupFailure,
    ),
    removeAvatar: new RemoveAvatarUseCase(
      users,
      storage,
      profiles,
      reportAvatarCleanupFailure,
    ),
    changePassword: new ChangePasswordUseCase(
      users,
      hasher,
      refreshTokens,
      resetTokens,
      sessions,
      profiles,
      clock,
    ),
    requestEmailChange: new RequestEmailChangeUseCase(
      users,
      hasher,
      emailChanges,
      secureTokens,
      mailer,
      clock,
      settings,
    ),
    confirmEmailChange: new ConfirmEmailChangeUseCase(
      emailChanges,
      users,
      secureTokens,
      clock,
    ),
  };
}

export type AuthContext = ReturnType<typeof createAuthContext>;

export const laura = {
  email: 'laura@example.com',
  password: 'Dressing2026!',
  firstName: 'Laura',
};
