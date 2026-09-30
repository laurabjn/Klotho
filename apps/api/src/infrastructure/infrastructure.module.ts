import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  AUTH_SETTINGS,
  type AuthSettings,
} from '../application/auth/auth-settings';
import { ACCESS_TOKEN_SERVICE } from '../domain/auth/ports/access-token.service';
import { PASSWORD_HASHER } from '../domain/auth/ports/password-hasher';
import { PASSWORD_RESET_TOKEN_REPOSITORY } from '../domain/auth/ports/password-reset-token.repository';
import { REFRESH_TOKEN_REPOSITORY } from '../domain/auth/ports/refresh-token.repository';
import { SECURE_TOKEN_GENERATOR } from '../domain/auth/ports/secure-token.generator';
import { MAILER } from '../domain/notifications/ports/mailer';
import { CLOCK } from '../domain/shared/ports/clock';
import { USER_REPOSITORY } from '../domain/users/ports/user.repository';
import type { Env } from '../config/env';
import { BcryptPasswordHasher } from './auth/bcrypt-password-hasher';
import { CryptoSecureTokenGenerator } from './auth/crypto-secure-token.generator';
import { JwtAccessTokenService } from './auth/jwt-access-token.service';
import { ConsoleMailer } from './mail/console-mailer';
import { PrismaService } from './prisma/prisma.service';
import { PrismaPasswordResetTokenRepository } from './prisma/repositories/prisma-password-reset-token.repository';
import { PrismaRefreshTokenRepository } from './prisma/repositories/prisma-refresh-token.repository';
import { PrismaUserRepository } from './prisma/repositories/prisma-user.repository';
import { SystemClock } from './time/system-clock';

type Config = ConfigService<Env, true>;

/** Binds every domain port to its infrastructure adapter. */
@Global()
@Module({
  providers: [
    PrismaService,
    { provide: USER_REPOSITORY, useClass: PrismaUserRepository },
    {
      provide: REFRESH_TOKEN_REPOSITORY,
      useClass: PrismaRefreshTokenRepository,
    },
    {
      provide: PASSWORD_RESET_TOKEN_REPOSITORY,
      useClass: PrismaPasswordResetTokenRepository,
    },
    { provide: SECURE_TOKEN_GENERATOR, useClass: CryptoSecureTokenGenerator },
    { provide: CLOCK, useClass: SystemClock },
    { provide: MAILER, useClass: ConsoleMailer },
    {
      provide: PASSWORD_HASHER,
      inject: [ConfigService],
      useFactory: (config: Config) =>
        new BcryptPasswordHasher(config.get('BCRYPT_COST', { infer: true })),
    },
    {
      provide: ACCESS_TOKEN_SERVICE,
      inject: [ConfigService],
      useFactory: (config: Config) =>
        new JwtAccessTokenService(
          config.get('JWT_ACCESS_SECRET', { infer: true }),
          config.get('JWT_ACCESS_TTL_SECONDS', { infer: true }),
        ),
    },
    {
      provide: AUTH_SETTINGS,
      inject: [ConfigService],
      useFactory: (config: Config): AuthSettings => ({
        refreshTokenTtlDays: config.get('REFRESH_TOKEN_TTL_DAYS', {
          infer: true,
        }),
        passwordResetTtlMinutes: config.get('PASSWORD_RESET_TTL_MINUTES', {
          infer: true,
        }),
        resetPasswordUrl: config.get('RESET_PASSWORD_URL', { infer: true }),
      }),
    },
  ],
  exports: [
    PrismaService,
    USER_REPOSITORY,
    REFRESH_TOKEN_REPOSITORY,
    PASSWORD_RESET_TOKEN_REPOSITORY,
    SECURE_TOKEN_GENERATOR,
    CLOCK,
    MAILER,
    PASSWORD_HASHER,
    ACCESS_TOKEN_SERVICE,
    AUTH_SETTINGS,
  ],
})
export class InfrastructureModule {}
