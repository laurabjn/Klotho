import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { Env } from '../../../config/env';
import { CLOCK, type Clock } from '../../../domain/shared/ports/clock';
import { RateLimitGuard } from './rate-limit.guard';
import {
  RATE_LIMIT_SETTINGS,
  rateLimitSettingsFrom,
} from './rate-limit.settings';
import { RateLimitStore } from './rate-limit.store';

/** Global: @RateLimit() can be used on any controller. */
@Global()
@Module({
  providers: [
    {
      provide: RATE_LIMIT_SETTINGS,
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) =>
        rateLimitSettingsFrom((key) => config.get(key, { infer: true })),
    },
    {
      provide: RateLimitStore,
      inject: [CLOCK],
      useFactory: (clock: Clock) =>
        new RateLimitStore(() => clock.now().getTime()),
    },
    RateLimitGuard,
  ],
  exports: [RATE_LIMIT_SETTINGS, RateLimitStore, RateLimitGuard],
})
export class RateLimitModule {}
