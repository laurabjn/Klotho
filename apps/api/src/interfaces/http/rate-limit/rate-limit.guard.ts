import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { ApiErrorBody } from '@klotho/shared';
import type { Request, Response } from 'express';

import {
  PER_USER_LIMITS,
  RATE_LIMIT_SETTINGS,
  type RateLimitName,
  type RateLimitSettings,
} from './rate-limit.settings';
import { RateLimitStore } from './rate-limit.store';

export const RATE_LIMITED = 'request.rateLimited';
export const RATE_LIMITS_KEY = 'rateLimits';

/**
 * Applied by @RateLimit(): counts the call against each named limit, per
 * client IP (and per account for PER_USER_LIMITS), and answers 429 with a
 * Retry-After header beyond. Runs after the global JwtAuthGuard, so the
 * account is known on private routes.
 */
@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    @Inject(RATE_LIMIT_SETTINGS) private readonly settings: RateLimitSettings,
    private readonly store: RateLimitStore,
    private readonly reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    if (!this.settings.enabled) return true;
    const names =
      this.reflector.get<RateLimitName[] | undefined>(
        RATE_LIMITS_KEY,
        context.getHandler(),
      ) ?? [];
    const request = context
      .switchToHttp()
      .getRequest<Request & { userId?: string }>();

    let retryAfter = 0;
    for (const name of names) {
      const { limit, ttlSeconds } = this.settings.rules[name];
      const trackers = [`ip:${request.ip ?? 'unknown'}`];
      if (PER_USER_LIMITS.includes(name) && request.userId) {
        trackers.push(`user:${request.userId}`);
      }
      for (const tracker of trackers) {
        const hit = this.store.hit(
          `${name}|${tracker}`,
          limit,
          ttlSeconds * 1000,
        );
        if (!hit.allowed)
          retryAfter = Math.max(retryAfter, hit.retryAfterSeconds);
      }
    }
    if (retryAfter === 0) return true;

    context
      .switchToHttp()
      .getResponse<Response>()
      .setHeader('Retry-After', String(retryAfter));
    const body: ApiErrorBody = {
      statusCode: HttpStatus.TOO_MANY_REQUESTS,
      code: RATE_LIMITED,
    };
    throw new HttpException(body, HttpStatus.TOO_MANY_REQUESTS);
  }
}
