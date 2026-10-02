import {
  Logger,
  Module,
  type MiddlewareConsumer,
  type NestModule,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';

import { logFormat, validateEnv, type Env } from './config/env';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { AuthModule } from './interfaces/http/auth/auth.module';
import { HttpExceptionFilter } from './interfaces/http/errors/http-exception.filter';
import { HealthController } from './interfaces/http/health/health.controller';
import { requestLogger } from './interfaces/http/logging/request-logger.middleware';
import { OutfitsModule } from './interfaces/http/outfits/outfits.module';
import { PlanningModule } from './interfaces/http/planning/planning.module';
import { RateLimitModule } from './interfaces/http/rate-limit/rate-limit.module';
import { PreferencesModule } from './interfaces/http/preferences/preferences.module';
import { UsersModule } from './interfaces/http/users/users.module';
import { WardrobeModule } from './interfaces/http/wardrobe/wardrobe.module';
import { WeatherModule } from './interfaces/http/weather/weather.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      // Most specific first: .env.development / .env.test override the shared .env.
      envFilePath: [`.env.${process.env.NODE_ENV ?? 'development'}`, '.env'],
      validate: validateEnv,
    }),
    RateLimitModule,
    InfrastructureModule,
    AuthModule,
    UsersModule,
    PreferencesModule,
    WardrobeModule,
    WeatherModule,
    OutfitsModule,
    PlanningModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_FILTER, useClass: HttpExceptionFilter }],
})
export class AppModule implements NestModule {
  constructor(private readonly config: ConfigService<Env, true>) {}

  /** Request ids on every route; one log line per request unless disabled. */
  configure(consumer: MiddlewareConsumer): void {
    const enabled = this.config.get('LOG_HTTP_REQUESTS', { infer: true });
    const json =
      logFormat({
        NODE_ENV: this.config.get('NODE_ENV', { infer: true }),
        LOG_FORMAT: this.config.get('LOG_FORMAT', { infer: true }),
      }) === 'json';
    const logger = new Logger('HTTP');
    consumer
      .apply(
        requestLogger({
          // JSON: the fields go into the log object; text: one short line.
          log: (message, entry) => {
            if (!enabled) return;
            if (json) logger.log(message, entry);
            else logger.log(`${message} [${entry.requestId}]`);
          },
          error: (message, entry) => {
            if (!enabled) return;
            if (json) logger.error(message, entry);
            else logger.error(`${message} [${entry.requestId}]`);
          },
        }),
      )
      .forRoutes('*');
  }
}
