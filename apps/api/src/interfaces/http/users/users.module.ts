import { Logger, Module } from '@nestjs/common';

import {
  AUTH_SETTINGS,
  type AuthSettings,
} from '../../../application/auth/auth-settings';
import { SessionIssuer } from '../../../application/auth/session-issuer';
import {
  RemoveAvatarUseCase,
  SetAvatarUseCase,
  type AvatarCleanupReporter,
} from '../../../application/users/avatar.use-cases';
import { ChangePasswordUseCase } from '../../../application/users/change-password.use-case';
import { DeleteAccountUseCase } from '../../../application/users/delete-account.use-case';
import { GetCurrentUserUseCase } from '../../../application/users/get-current-user.use-case';
import { RequestEmailChangeUseCase } from '../../../application/users/request-email-change.use-case';
import { UpdateProfileUseCase } from '../../../application/users/update-profile.use-case';
import { UserProfilePresenter } from '../../../application/users/user-profile.presenter';
import {
  PASSWORD_HASHER,
  type PasswordHasher,
} from '../../../domain/auth/ports/password-hasher';
import {
  PASSWORD_RESET_TOKEN_REPOSITORY,
  type PasswordResetTokenRepository,
} from '../../../domain/auth/ports/password-reset-token.repository';
import {
  REFRESH_TOKEN_REPOSITORY,
  type RefreshTokenRepository,
} from '../../../domain/auth/ports/refresh-token.repository';
import {
  SECURE_TOKEN_GENERATOR,
  type SecureTokenGenerator,
} from '../../../domain/auth/ports/secure-token.generator';
import {
  MAILER,
  type Mailer,
} from '../../../domain/notifications/ports/mailer';
import { CLOCK, type Clock } from '../../../domain/shared/ports/clock';
import {
  FILE_STORAGE,
  type FileStorage,
} from '../../../domain/storage/ports/file-storage';
import {
  EMAIL_CHANGE_TOKEN_REPOSITORY,
  type EmailChangeTokenRepository,
} from '../../../domain/users/ports/email-change-token.repository';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '../../../domain/users/ports/user.repository';
import {
  WARDROBE_PHOTO_REPOSITORY,
  type WardrobePhotoRepository,
} from '../../../domain/wardrobe/ports/wardrobe-photo.repository';
import {
  WARDROBE_REPOSITORY,
  type WardrobeRepository,
} from '../../../domain/wardrobe/ports/wardrobe.repository';
import { AuthModule } from '../auth/auth.module';
import { UsersController } from './users.controller';

const logger = new Logger('AccountDeletion');
const avatarLogger = new Logger('ProfilePhoto');

/** The error name only: messages may hold keys or URLs. */
const errorName = (error: unknown) =>
  error instanceof Error ? error.name : 'unknown';

const reportAvatarCleanupFailure: AvatarCleanupReporter = (error) =>
  avatarLogger.warn(
    `The previous profile photo could not be removed from the storage (${errorName(error)})`,
  );

@Module({
  imports: [AuthModule],
  controllers: [UsersController],
  providers: [
    {
      provide: GetCurrentUserUseCase,
      inject: [USER_REPOSITORY, UserProfilePresenter],
      useFactory: (users: UserRepository, profiles: UserProfilePresenter) =>
        new GetCurrentUserUseCase(users, profiles),
    },
    {
      provide: UpdateProfileUseCase,
      inject: [USER_REPOSITORY, UserProfilePresenter],
      useFactory: (users: UserRepository, profiles: UserProfilePresenter) =>
        new UpdateProfileUseCase(users, profiles),
    },
    {
      provide: SetAvatarUseCase,
      inject: [
        USER_REPOSITORY,
        WARDROBE_PHOTO_REPOSITORY,
        FILE_STORAGE,
        UserProfilePresenter,
      ],
      useFactory: (
        users: UserRepository,
        photos: WardrobePhotoRepository,
        storage: FileStorage,
        profiles: UserProfilePresenter,
      ) =>
        new SetAvatarUseCase(
          users,
          photos,
          storage,
          profiles,
          reportAvatarCleanupFailure,
        ),
    },
    {
      provide: RemoveAvatarUseCase,
      inject: [USER_REPOSITORY, FILE_STORAGE, UserProfilePresenter],
      useFactory: (
        users: UserRepository,
        storage: FileStorage,
        profiles: UserProfilePresenter,
      ) =>
        new RemoveAvatarUseCase(
          users,
          storage,
          profiles,
          reportAvatarCleanupFailure,
        ),
    },
    {
      provide: ChangePasswordUseCase,
      inject: [
        USER_REPOSITORY,
        PASSWORD_HASHER,
        REFRESH_TOKEN_REPOSITORY,
        PASSWORD_RESET_TOKEN_REPOSITORY,
        SessionIssuer,
        UserProfilePresenter,
        CLOCK,
      ],
      useFactory: (
        users: UserRepository,
        hasher: PasswordHasher,
        refreshTokens: RefreshTokenRepository,
        resetTokens: PasswordResetTokenRepository,
        sessions: SessionIssuer,
        profiles: UserProfilePresenter,
        clock: Clock,
      ) =>
        new ChangePasswordUseCase(
          users,
          hasher,
          refreshTokens,
          resetTokens,
          sessions,
          profiles,
          clock,
        ),
    },
    {
      provide: RequestEmailChangeUseCase,
      inject: [
        USER_REPOSITORY,
        PASSWORD_HASHER,
        EMAIL_CHANGE_TOKEN_REPOSITORY,
        SECURE_TOKEN_GENERATOR,
        MAILER,
        CLOCK,
        AUTH_SETTINGS,
      ],
      useFactory: (
        users: UserRepository,
        hasher: PasswordHasher,
        emailChanges: EmailChangeTokenRepository,
        secureTokens: SecureTokenGenerator,
        mailer: Mailer,
        clock: Clock,
        settings: AuthSettings,
      ) =>
        new RequestEmailChangeUseCase(
          users,
          hasher,
          emailChanges,
          secureTokens,
          mailer,
          clock,
          settings,
        ),
    },
    {
      provide: DeleteAccountUseCase,
      inject: [
        USER_REPOSITORY,
        PASSWORD_HASHER,
        WARDROBE_REPOSITORY,
        FILE_STORAGE,
      ],
      useFactory: (
        users: UserRepository,
        hasher: PasswordHasher,
        wardrobe: WardrobeRepository,
        storage: FileStorage,
      ) =>
        new DeleteAccountUseCase(users, hasher, wardrobe, storage, (failure) =>
          logger.warn(
            `Account deleted, but its ${failure.step} could not be removed from the storage (${errorName(
              failure.error,
            )})`,
          ),
        ),
    },
  ],
})
export class UsersModule {}
