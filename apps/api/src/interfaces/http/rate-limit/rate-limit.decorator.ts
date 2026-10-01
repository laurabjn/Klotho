import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';

import { RATE_LIMITS_KEY, RateLimitGuard } from './rate-limit.guard';
import type { RateLimitName } from './rate-limit.settings';

/** Counts the route's calls against the given limits (RATE_LIMIT_* variables). */
export const RateLimit = (...names: RateLimitName[]) =>
  applyDecorators(
    SetMetadata(RATE_LIMITS_KEY, names),
    UseGuards(RateLimitGuard),
  );
