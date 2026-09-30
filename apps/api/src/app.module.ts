import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';

import { validateEnv } from './config/env';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { AuthModule } from './interfaces/http/auth/auth.module';
import { HttpExceptionFilter } from './interfaces/http/errors/http-exception.filter';
import { HealthController } from './interfaces/http/health/health.controller';
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
    InfrastructureModule,
    AuthModule,
    UsersModule,
    PreferencesModule,
    WardrobeModule,
    WeatherModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_FILTER, useClass: HttpExceptionFilter }],
})
export class AppModule {}
