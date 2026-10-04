import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { HandleStoreEventUseCase } from '../../../application/billing/handle-store-event.use-case';
import { SyncPurchasesUseCase } from '../../../application/billing/sync-purchases.use-case';
import type { Env } from '../../../config/env';
import {
  BILLING_REPOSITORY,
  type BillingRepository,
} from '../../../domain/billing/ports/billing.repository';
import {
  STORE_CUSTOMERS,
  type StoreCustomers,
} from '../../../domain/billing/ports/store-customers';
import { CLOCK, type Clock } from '../../../domain/shared/ports/clock';
import { BillingController, WEBHOOK_AUTH } from './billing.controller';

@Module({
  controllers: [BillingController],
  providers: [
    {
      provide: SyncPurchasesUseCase,
      inject: [STORE_CUSTOMERS, BILLING_REPOSITORY, CLOCK],
      useFactory: (
        store: StoreCustomers,
        billing: BillingRepository,
        clock: Clock,
      ) => new SyncPurchasesUseCase(store, billing, clock),
    },
    {
      provide: HandleStoreEventUseCase,
      inject: [BILLING_REPOSITORY, SyncPurchasesUseCase],
      useFactory: (billing: BillingRepository, sync: SyncPurchasesUseCase) =>
        new HandleStoreEventUseCase(billing, sync),
    },
    {
      provide: WEBHOOK_AUTH,
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>): string | undefined =>
        config.get<Env['REVENUECAT_WEBHOOK_AUTH']>('REVENUECAT_WEBHOOK_AUTH'),
    },
  ],
})
export class BillingModule {}
