import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';

import {
  AUTH_SETTINGS,
  type AuthSettings,
} from '../../../application/auth/auth-settings';
import { ForgotPasswordUseCase } from '../../../application/auth/forgot-password.use-case';
import { LoginUseCase } from '../../../application/auth/login.use-case';
import { LogoutUseCase } from '../../../application/auth/logout.use-case';
import { RefreshTokenUseCase } from '../../../application/auth/refresh-token.use-case';
import { RegisterUseCase } from '../../../application/auth/register.use-case';
import { ResetPasswordUseCase } from '../../../application/auth/reset-password.use-case';
import { SessionIssuer } from '../../../application/auth/session-issuer';
import {
  ACCESS_TOKEN_SERVICE,
  type AccessTokenService,
} from '../../../domain/auth/ports/access-token.service';
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
  USER_REPOSITORY,
  type UserRepository,
} from '../../../domain/users/ports/user.repository';
import { AuthController } from './auth.controller';
import { JwtAuthGuard } from './jwt-auth.guard';

@Module({
  controllers: [AuthController],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    {
      provide: SessionIssuer,
      inject: [
        ACCESS_TOKEN_SERVICE,
        SECURE_TOKEN_GENERATOR,
        REFRESH_TOKEN_REPOSITORY,
        CLOCK,
        AUTH_SETTINGS,
      ],
      useFactory: (
        accessTokens: AccessTokenService,
        secureTokens: SecureTokenGenerator,
        refreshTokens: RefreshTokenRepository,
        clock: Clock,
        settings: AuthSettings,
      ) =>
        new SessionIssuer(
          accessTokens,
          secureTokens,
          refreshTokens,
          clock,
          settings,
        ),
    },
    {
      provide: RegisterUseCase,
      inject: [USER_REPOSITORY, PASSWORD_HASHER, SessionIssuer],
      useFactory: (
        users: UserRepository,
        hasher: PasswordHasher,
        sessions: SessionIssuer,
      ) => new RegisterUseCase(users, hasher, sessions),
    },
    {
      provide: LoginUseCase,
      inject: [USER_REPOSITORY, PASSWORD_HASHER, SessionIssuer],
      useFactory: (
        users: UserRepository,
        hasher: PasswordHasher,
        sessions: SessionIssuer,
      ) => new LoginUseCase(users, hasher, sessions),
    },
    {
      provide: RefreshTokenUseCase,
      inject: [
        REFRESH_TOKEN_REPOSITORY,
        USER_REPOSITORY,
        SECURE_TOKEN_GENERATOR,
        SessionIssuer,
        CLOCK,
      ],
      useFactory: (
        refreshTokens: RefreshTokenRepository,
        users: UserRepository,
        secureTokens: SecureTokenGenerator,
        sessions: SessionIssuer,
        clock: Clock,
      ) =>
        new RefreshTokenUseCase(
          refreshTokens,
          users,
          secureTokens,
          sessions,
          clock,
        ),
    },
    {
      provide: LogoutUseCase,
      inject: [REFRESH_TOKEN_REPOSITORY, SECURE_TOKEN_GENERATOR, CLOCK],
      useFactory: (
        refreshTokens: RefreshTokenRepository,
        secureTokens: SecureTokenGenerator,
        clock: Clock,
      ) => new LogoutUseCase(refreshTokens, secureTokens, clock),
    },
    {
      provide: ForgotPasswordUseCase,
      inject: [
        USER_REPOSITORY,
        PASSWORD_RESET_TOKEN_REPOSITORY,
        SECURE_TOKEN_GENERATOR,
        MAILER,
        CLOCK,
        AUTH_SETTINGS,
      ],
      useFactory: (
        users: UserRepository,
        resetTokens: PasswordResetTokenRepository,
        secureTokens: SecureTokenGenerator,
        mailer: Mailer,
        clock: Clock,
        settings: AuthSettings,
      ) =>
        new ForgotPasswordUseCase(
          users,
          resetTokens,
          secureTokens,
          mailer,
          clock,
          settings,
        ),
    },
    {
      provide: ResetPasswordUseCase,
      inject: [
        PASSWORD_RESET_TOKEN_REPOSITORY,
        USER_REPOSITORY,
        REFRESH_TOKEN_REPOSITORY,
        PASSWORD_HASHER,
        SECURE_TOKEN_GENERATOR,
        CLOCK,
      ],
      useFactory: (
        resetTokens: PasswordResetTokenRepository,
        users: UserRepository,
        refreshTokens: RefreshTokenRepository,
        hasher: PasswordHasher,
        secureTokens: SecureTokenGenerator,
        clock: Clock,
      ) =>
        new ResetPasswordUseCase(
          resetTokens,
          users,
          refreshTokens,
          hasher,
          secureTokens,
          clock,
        ),
    },
  ],
})
export class AuthModule {}
