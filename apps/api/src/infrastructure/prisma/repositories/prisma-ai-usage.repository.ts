import { Injectable } from '@nestjs/common';

import type {
  AiFeature,
  AiUsageRecord,
  AiUsageRepository,
} from '../../../domain/ai/ports/ai-usage.repository';
import { PrismaService } from '../prisma.service';

@Injectable()
export class PrismaAiUsageRepository implements AiUsageRepository {
  constructor(private readonly prisma: PrismaService) {}

  async record(usage: AiUsageRecord): Promise<void> {
    await this.prisma.aiUsage.create({ data: usage });
  }

  countCharged(userId: string, feature: AiFeature): Promise<number> {
    return this.prisma.aiUsage.count({
      where: { userId, feature, charged: true },
    });
  }
}
