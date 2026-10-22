import {
  Controller,
  Get,
  Header,
  Inject,
  NotFoundException,
  Param,
  Query,
} from '@nestjs/common';
import { isSupportedLocale, type Locale } from '@klotho/i18n';

import { Public } from '../auth/public.decorator';
import { renderHomePage, renderLegalPage, type LegalPage } from './legal-pages';

export const CONTACT_EMAIL = Symbol('ContactEmail');

const PAGES = new Set<string>(['privacy', 'terms', 'delete-account']);

/**
 * Public web pages required by the store listing: privacy policy, terms and
 * how to delete an account without the app. ?lang=en for English.
 */
@Controller()
export class LegalController {
  constructor(@Inject(CONTACT_EMAIL) private readonly contactEmail: string) {}

  /** The web address given to Google Play: what Klotho is. */
  @Public()
  @Get()
  @Header('Content-Type', 'text/html; charset=utf-8')
  @Header('Cache-Control', 'public, max-age=3600')
  home(@Query('lang') lang?: string): string {
    const locale: Locale = isSupportedLocale(lang) ? lang : 'fr';
    return renderHomePage(locale, this.contactEmail);
  }

  @Public()
  @Get('legal/:page')
  @Header('Content-Type', 'text/html; charset=utf-8')
  @Header('Cache-Control', 'public, max-age=3600')
  page(@Param('page') page: string, @Query('lang') lang?: string): string {
    if (!PAGES.has(page)) throw new NotFoundException();
    const locale: Locale = isSupportedLocale(lang) ? lang : 'fr';
    return renderLegalPage(page as LegalPage, locale, this.contactEmail);
  }
}
