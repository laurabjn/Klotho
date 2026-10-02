import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  AUTH_SETTINGS,
  type AuthSettings,
} from '../application/auth/auth-settings';
import {
  PHOTO_SETTINGS,
  type PhotoSettings,
} from '../application/wardrobe/photos/photo-settings';
import { KPI_SOURCE } from '../domain/analytics/ports/kpi-source';
import { ACCESS_TOKEN_SERVICE } from '../domain/auth/ports/access-token.service';
import { PASSWORD_HASHER } from '../domain/auth/ports/password-hasher';
import { PASSWORD_RESET_TOKEN_REPOSITORY } from '../domain/auth/ports/password-reset-token.repository';
import { REFRESH_TOKEN_REPOSITORY } from '../domain/auth/ports/refresh-token.repository';
import { SECURE_TOKEN_GENERATOR } from '../domain/auth/ports/secure-token.generator';
import { STYLE_PROFILE_REPOSITORY } from '../domain/preferences/ports/style-profile.repository';
import { MAILER } from '../domain/notifications/ports/mailer';
import { NOTIFICATION_SETTINGS_REPOSITORY } from '../domain/notifications/ports/notification-settings.repository';
import { NOTIFICATION_REPOSITORY } from '../domain/notifications/ports/notification.repository';
import { CLOCK } from '../domain/shared/ports/clock';
import { FILE_STORAGE } from '../domain/storage/ports/file-storage';
import { IMAGE_PROCESSOR } from '../domain/storage/ports/image-processor';
import { EMAIL_CHANGE_TOKEN_REPOSITORY } from '../domain/users/ports/email-change-token.repository';
import { USER_REPOSITORY } from '../domain/users/ports/user.repository';
import { WARDROBE_PHOTO_REPOSITORY } from '../domain/wardrobe/ports/wardrobe-photo.repository';
import { WARDROBE_REPOSITORY } from '../domain/wardrobe/ports/wardrobe.repository';
import { OUTFIT_REPOSITORY } from '../domain/outfits/ports/outfit.repository';
import { DAY_NOTE_REPOSITORY } from '../domain/planning/ports/day-note.repository';
import { OUTFIT_PLAN_REPOSITORY } from '../domain/planning/ports/outfit-plan.repository';
import { CITY_GEOCODER } from '../domain/weather/ports/city-geocoder';
import { WEATHER_PROVIDER } from '../domain/weather/ports/weather-provider';
import { WEATHER_SETTINGS_REPOSITORY } from '../domain/weather/ports/weather-settings.repository';
import type { Clock } from '../domain/shared/ports/clock';
import type { Env } from '../config/env';
import { BcryptPasswordHasher } from './auth/bcrypt-password-hasher';
import { CryptoSecureTokenGenerator } from './auth/crypto-secure-token.generator';
import { JwtAccessTokenService } from './auth/jwt-access-token.service';
import { BrevoMailer } from './mail/brevo-mailer';
import { ConsoleMailer } from './mail/console-mailer';
import { PrismaService } from './prisma/prisma.service';
import { PrismaDayNoteRepository } from './prisma/repositories/prisma-day-note.repository';
import { PrismaEmailChangeTokenRepository } from './prisma/repositories/prisma-email-change-token.repository';
import { PrismaKpiSource } from './prisma/repositories/prisma-kpi.source';
import { PrismaNotificationSettingsRepository } from './prisma/repositories/prisma-notification-settings.repository';
import { PrismaNotificationRepository } from './prisma/repositories/prisma-notification.repository';
import { PrismaPasswordResetTokenRepository } from './prisma/repositories/prisma-password-reset-token.repository';
import { PrismaOutfitPlanRepository } from './prisma/repositories/prisma-outfit-plan.repository';
import { PrismaOutfitRepository } from './prisma/repositories/prisma-outfit.repository';
import { PrismaRefreshTokenRepository } from './prisma/repositories/prisma-refresh-token.repository';
import { PrismaStyleProfileRepository } from './prisma/repositories/prisma-style-profile.repository';
import { PrismaUserRepository } from './prisma/repositories/prisma-user.repository';
import { PrismaWardrobePhotoRepository } from './prisma/repositories/prisma-wardrobe-photo.repository';
import { PrismaWardrobeRepository } from './prisma/repositories/prisma-wardrobe.repository';
import { PrismaWeatherSettingsRepository } from './prisma/repositories/prisma-weather-settings.repository';
import { S3FileStorage } from './storage/s3-file-storage';
import { SharpImageProcessor } from './storage/sharp-image-processor';
import { SystemClock } from './time/system-clock';
import { CachedWeatherProvider } from './weather/cached-weather-provider';
import { OpenWeatherMapClient } from './weather/openweathermap.client';

type Config = ConfigService<Env, true>;

/** One client serves both the weather and the city search. */
const OPENWEATHERMAP_CLIENT = Symbol('OpenWeatherMapClient');

/** Binds every domain port to its infrastructure adapter. */
@Global()
@Module({
  providers: [
    PrismaService,
    { provide: USER_REPOSITORY, useClass: PrismaUserRepository },
    { provide: WARDROBE_REPOSITORY, useClass: PrismaWardrobeRepository },
    {
      provide: STYLE_PROFILE_REPOSITORY,
      useClass: PrismaStyleProfileRepository,
    },
    {
      provide: WARDROBE_PHOTO_REPOSITORY,
      useClass: PrismaWardrobePhotoRepository,
    },
    {
      provide: WEATHER_SETTINGS_REPOSITORY,
      useClass: PrismaWeatherSettingsRepository,
    },
    {
      provide: OPENWEATHERMAP_CLIENT,
      inject: [ConfigService],
      useFactory: (config: Config) =>
        new OpenWeatherMapClient({
          apiKey: config.get('OPENWEATHER_API_KEY', { infer: true }),
          timeoutMs: config.get('WEATHER_TIMEOUT_MS', { infer: true }),
        }),
    },
    {
      provide: WEATHER_PROVIDER,
      inject: [OPENWEATHERMAP_CLIENT, CLOCK, ConfigService],
      useFactory: (
        client: OpenWeatherMapClient,
        clock: Clock,
        config: Config,
      ) =>
        new CachedWeatherProvider(client, clock, {
          ttlMs:
            config.get('WEATHER_CACHE_TTL_SECONDS', { infer: true }) * 1000,
          maxEntries: 1000,
        }),
    },
    { provide: CITY_GEOCODER, useExisting: OPENWEATHERMAP_CLIENT },
    { provide: OUTFIT_REPOSITORY, useClass: PrismaOutfitRepository },
    { provide: OUTFIT_PLAN_REPOSITORY, useClass: PrismaOutfitPlanRepository },
    { provide: DAY_NOTE_REPOSITORY, useClass: PrismaDayNoteRepository },
    {
      provide: NOTIFICATION_REPOSITORY,
      useClass: PrismaNotificationRepository,
    },
    {
      provide: NOTIFICATION_SETTINGS_REPOSITORY,
      useClass: PrismaNotificationSettingsRepository,
    },
    { provide: KPI_SOURCE, useClass: PrismaKpiSource },
    { provide: IMAGE_PROCESSOR, useClass: SharpImageProcessor },
    {
      provide: FILE_STORAGE,
      inject: [ConfigService],
      useFactory: async (config: Config) => {
        const storage = new S3FileStorage({
          endpoint: config.get('STORAGE_ENDPOINT', { infer: true }),
          publicEndpoint: config.get('STORAGE_PUBLIC_ENDPOINT', {
            infer: true,
          }),
          region: config.get('STORAGE_REGION', { infer: true }),
          bucket: config.get('STORAGE_BUCKET', { infer: true }),
          accessKeyId: config.get('STORAGE_ACCESS_KEY_ID', { infer: true }),
          secretAccessKey: config.get('STORAGE_SECRET_ACCESS_KEY', {
            infer: true,
          }),
          urlTtlSeconds: config.get('PHOTO_URL_TTL_SECONDS', { infer: true }),
        });
        if (config.get('STORAGE_CREATE_BUCKET', { infer: true })) {
          await storage.ensureBucket();
        }
        return storage;
      },
    },
    {
      provide: PHOTO_SETTINGS,
      inject: [ConfigService],
      useFactory: (config: Config): PhotoSettings => ({
        maxPerItem: config.get('PHOTOS_MAX_PER_ITEM', { infer: true }),
      }),
    },
    {
      provide: REFRESH_TOKEN_REPOSITORY,
      useClass: PrismaRefreshTokenRepository,
    },
    {
      provide: PASSWORD_RESET_TOKEN_REPOSITORY,
      useClass: PrismaPasswordResetTokenRepository,
    },
    {
      provide: EMAIL_CHANGE_TOKEN_REPOSITORY,
      useClass: PrismaEmailChangeTokenRepository,
    },
    { provide: SECURE_TOKEN_GENERATOR, useClass: CryptoSecureTokenGenerator },
    { provide: CLOCK, useClass: SystemClock },
    {
      provide: MAILER,
      inject: [ConfigService],
      useFactory: (config: Config) =>
        config.get('MAIL_DRIVER', { infer: true }) === 'brevo'
          ? new BrevoMailer({
              apiKey: config.get('BREVO_API_KEY', { infer: true }),
              from: config.get('MAIL_FROM', { infer: true }),
              fromName: config.get('MAIL_FROM_NAME', { infer: true }),
            })
          : new ConsoleMailer(),
    },
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
        emailChangeTtlMinutes: config.get('EMAIL_CHANGE_TTL_MINUTES', {
          infer: true,
        }),
        confirmEmailUrl: config.get('CONFIRM_EMAIL_URL', { infer: true }),
      }),
    },
  ],
  exports: [
    PrismaService,
    USER_REPOSITORY,
    WARDROBE_REPOSITORY,
    STYLE_PROFILE_REPOSITORY,
    WARDROBE_PHOTO_REPOSITORY,
    OUTFIT_REPOSITORY,
    OUTFIT_PLAN_REPOSITORY,
    DAY_NOTE_REPOSITORY,
    NOTIFICATION_REPOSITORY,
    NOTIFICATION_SETTINGS_REPOSITORY,
    KPI_SOURCE,
    WEATHER_SETTINGS_REPOSITORY,
    WEATHER_PROVIDER,
    CITY_GEOCODER,
    IMAGE_PROCESSOR,
    FILE_STORAGE,
    PHOTO_SETTINGS,
    REFRESH_TOKEN_REPOSITORY,
    PASSWORD_RESET_TOKEN_REPOSITORY,
    EMAIL_CHANGE_TOKEN_REPOSITORY,
    SECURE_TOKEN_GENERATOR,
    CLOCK,
    MAILER,
    PASSWORD_HASHER,
    ACCESS_TOKEN_SERVICE,
    AUTH_SETTINGS,
  ],
})
export class InfrastructureModule {}
