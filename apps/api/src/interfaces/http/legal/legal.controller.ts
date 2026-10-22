import {
  Controller,
  Get,
  Header,
  Inject,
  NotFoundException,
  Param,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { isSupportedLocale, type Locale } from '@klotho/i18n';

import { Public } from '../auth/public.decorator';
import { renderHomePage, renderLegalPage, type LegalPage } from './legal-pages';
import { siteAsset } from './site-assets';
import type { SiteSettings } from './site-tracking';

export const SITE_SETTINGS = Symbol('SiteSettings');

const PAGES = new Set<string>(['privacy', 'terms', 'delete-account']);

/**
 * Public web pages required by the store listing: privacy policy, terms and
 * how to delete an account without the app. ?lang=en for English.
 */
@Controller()
export class LegalController {
  constructor(@Inject(SITE_SETTINGS) private readonly site: SiteSettings) {}

  /** The web address given to Google Play: what Klotho is. */
  @Public()
  @Get()
  @Header('Content-Type', 'text/html; charset=utf-8')
  @Header('Cache-Control', 'public, max-age=3600')
  home(@Query() query: Record<string, unknown>): string {
    const lang = query.lang;
    const locale: Locale =
      typeof lang === 'string' && isSupportedLocale(lang) ? lang : 'fr';
    return renderHomePage(locale, this.site, query);
  }

  @Public()
  @Get('legal/:page')
  @Header('Content-Type', 'text/html; charset=utf-8')
  @Header('Cache-Control', 'public, max-age=3600')
  page(@Param('page') page: string, @Query('lang') lang?: string): string {
    if (!PAGES.has(page)) throw new NotFoundException();
    const locale: Locale = isSupportedLocale(lang) ? lang : 'fr';
    return renderLegalPage(page as LegalPage, locale, this.site);
  }

  /** Logo and illustrations of the website (fixed list). */
  @Public()
  @Get('site/:file')
  asset(@Param('file') file: string, @Res() res: Response): void {
    sendAsset(file, res);
  }

  /** Fonts of the website (fixed list). */
  @Public()
  @Get('site/fonts/:file')
  font(@Param('file') file: string, @Res() res: Response): void {
    sendAsset(`fonts/${file}`, res);
  }
}

function sendAsset(name: string, res: Response): void {
  const found = siteAsset(name);
  if (!found) throw new NotFoundException();
  res
    .type(found.contentType)
    .set('Cache-Control', 'public, max-age=604800')
    .send(found.body);
}
