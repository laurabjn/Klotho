import { timingSafeEqual } from 'node:crypto';

import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Inject,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import type { ApiErrorBody, BillingStatus } from '@klotho/shared';

import { HandleStoreEventUseCase } from '../../../application/billing/handle-store-event.use-case';
import { PlanService } from '../../../application/billing/plan.service';
import { SyncPurchasesUseCase } from '../../../application/billing/sync-purchases.use-case';
import { CurrentUserId } from '../auth/current-user.decorator';
import { Public } from '../auth/public.decorator';

export const WEBHOOK_AUTH = Symbol('RevenueCatWebhookAuth');

function sameSecret(given: string | undefined, expected: string): boolean {
  if (!given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

@Controller('billing')
export class BillingController {
  constructor(
    private readonly plans: PlanService,
    private readonly syncPurchases: SyncPurchasesUseCase,
    private readonly handleEvent: HandleStoreEventUseCase,
    @Inject(WEBHOOK_AUTH) private readonly webhookAuth: string | undefined,
  ) {}

  @Get('status')
  status(@CurrentUserId() userId: string): Promise<BillingStatus> {
    return this.plans.status(userId);
  }

  /** Called by the app right after a purchase or a restore. */
  @Post('sync')
  @HttpCode(200)
  async sync(@CurrentUserId() userId: string): Promise<BillingStatus> {
    await this.syncPurchases.execute(userId);
    return this.plans.status(userId);
  }

  /**
   * RevenueCat webhook. Its "Authorization header" setting must equal
   * REVENUECAT_WEBHOOK_AUTH; a failure (503) makes RevenueCat retry.
   */
  @Public()
  @Post('revenuecat')
  @HttpCode(200)
  async webhook(
    @Headers('authorization') authorization: string | undefined,
    @Body() body: unknown,
  ): Promise<{ synced: number }> {
    if (!this.webhookAuth || !sameSecret(authorization, this.webhookAuth)) {
      const error: ApiErrorBody = {
        statusCode: 401,
        code: 'auth.unauthorized',
      };
      throw new UnauthorizedException(error);
    }
    return { synced: (await this.handleEvent.execute(body)).length };
  }
}
