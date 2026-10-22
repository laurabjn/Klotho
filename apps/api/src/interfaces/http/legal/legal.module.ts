import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { Env } from '../../../config/env';
import { LegalController, SITE_SETTINGS } from './legal.controller';
import type { SiteSettings } from './site-tracking';

@Module({
  controllers: [LegalController],
  providers: [
    {
      provide: SITE_SETTINGS,
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>): SiteSettings => {
        const get = <K extends keyof Env>(key: K) => config.get<Env[K]>(key);
        return {
          // The contact address of the legal notice, else the e-mail sender.
          contactEmail: get('CONTACT_EMAIL') ?? get('MAIL_FROM') ?? '',
          siteVerification: get('GOOGLE_SITE_VERIFICATION'),
          playStoreLive: get('PLAY_STORE_LIVE'),
          pixels: {
            meta: get('META_PIXEL_ID'),
            tiktok: get('TIKTOK_PIXEL_ID'),
            googleAds: get('GOOGLE_ADS_ID'),
            googleAdsLabel: get('GOOGLE_ADS_CONVERSION_LABEL'),
            pinterest: get('PINTEREST_TAG_ID'),
          },
        };
      },
    },
  ],
})
export class LegalModule {}
