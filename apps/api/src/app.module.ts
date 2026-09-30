import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { validateEnv } from './config/env';
import { PrismaModule } from './infrastructure/prisma/prisma.module';
import { HealthController } from './interfaces/http/health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      // Most specific first: .env.development / .env.test override the shared .env.
      envFilePath: [`.env.${process.env.NODE_ENV ?? 'development'}`, '.env'],
      validate: validateEnv,
    }),
    PrismaModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
