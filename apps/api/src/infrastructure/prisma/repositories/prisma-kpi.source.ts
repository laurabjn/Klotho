import { Injectable } from '@nestjs/common';

import type {
  KpiFacts,
  KpiSource,
} from '../../../domain/analytics/ports/kpi-source';
import { PrismaService } from '../prisma.service';

const DAY = 24 * 60 * 60 * 1000;

/** First day (UTC) of the last `days` days ending on `today`. */
function firstDayOf(today: Date, days: number): Date {
  const start = Date.UTC(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    today.getUTCDate(),
  );
  return new Date(start - (days - 1) * DAY);
}

/** Aggregate queries only: no row identifying a user leaves the database. */
@Injectable()
export class PrismaKpiSource implements KpiSource {
  constructor(private readonly prisma: PrismaService) {}

  async collect(today: Date): Promise<KpiFacts> {
    const p = this.prisma;
    const [
      users,
      delays,
      looksGenerated,
      likes,
      dislikes,
      wearsTotal,
      wears7,
      wears30,
      favoriteLooks,
      favoritePieces,
    ] = await Promise.all([
      p.user.count(),
      // One anonymous number per user: sign-up to first look.
      p.$queryRaw<{ delay: number }[]>`
        SELECT (EXTRACT(EPOCH FROM MIN(o."createdAt") - u."createdAt") * 1000)::float8 AS delay
        FROM "User" u JOIN "Outfit" o ON o."userId" = u.id
        GROUP BY u.id`,
      p.outfit.count(),
      p.outfitFeedback.count({ where: { rating: 'like' } }),
      p.outfitFeedback.count({ where: { rating: 'dislike' } }),
      p.outfitWear.count(),
      p.outfitWear.count({ where: { wornOn: { gte: firstDayOf(today, 7) } } }),
      p.outfitWear.count({
        where: { wornOn: { gte: firstDayOf(today, 30) } },
      }),
      p.outfit.count({ where: { isFavorite: true } }),
      p.wardrobeItem.count({ where: { isFavorite: true } }),
    ]);
    return {
      users,
      firstGenerationDelaysMs: delays.map((row) => Math.max(0, row.delay)),
      looksGenerated,
      likes,
      dislikes,
      wears: { total: wearsTotal, last7Days: wears7, last30Days: wears30 },
      favoriteLooks,
      favoritePieces,
    };
  }
}
