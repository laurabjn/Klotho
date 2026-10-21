import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { Env } from '../../../config/env';
import { CONTACT_EMAIL, LegalController } from './legal.controller';

@Module({
  controllers: [LegalController],
  providers: [
    {
      provide: CONTACT_EMAIL,
      inject: [ConfigService],
      // The contact address of the legal notice, else the e-mail sender.
      useFactory: (config: ConfigService<Env, true>): string =>
        config.get<Env['CONTACT_EMAIL']>('CONTACT_EMAIL') ??
        config.get<Env['MAIL_FROM']>('MAIL_FROM') ??
        '',
    },
  ],
})
export class LegalModule {}
