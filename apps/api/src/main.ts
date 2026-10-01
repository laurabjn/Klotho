import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';

import { AppModule } from './app.module';
import { logFormat, type Env } from './config/env';
import { AppLogger } from './infrastructure/logging/app-logger';

async function bootstrap() {
  // Start-up logs wait for the configured logger.
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });
  const config = app.get<ConfigService<Env, true>>(ConfigService);
  app.useLogger(
    new AppLogger(
      logFormat({
        NODE_ENV: config.get('NODE_ENV', { infer: true }),
        LOG_FORMAT: config.get('LOG_FORMAT', { infer: true }),
      }),
    ),
  );
  // Behind a proxy, the client IP (rate limits) comes from X-Forwarded-For.
  const trustProxy = config.get('TRUST_PROXY', { infer: true });
  if (trustProxy > 0) app.set('trust proxy', trustProxy);
  app.enableShutdownHooks();

  await app.listen(config.get('PORT', { infer: true }));
}
void bootstrap();
