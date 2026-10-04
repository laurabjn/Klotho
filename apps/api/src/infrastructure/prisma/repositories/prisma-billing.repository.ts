import { Injectable } from '@nestjs/common';

import type {
  BillingRepository,
  CreditGrant,
  Entitlement,
  MeteredFeature,
} from '../../../domain/billing/ports/billing.repository';
import { isUniqueViolation } from '../prisma-errors';
import { PrismaService } from '../prisma.service';

@Injectable()
export class PrismaBillingRepository implements BillingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findEntitlement(userId: string): Promise<Entitlement | null> {
    const row = await this.prisma.entitlement.findUnique({ where: { userId } });
    if (!row) return null;
    return {
      plan: row.plan === 'founders' ? 'founders' : 'premium',
      productId: row.productId,
      expiresAt: row.expiresAt,
    };
  }

  async saveEntitlement(
    userId: string,
    entitlement: Entitlement | null,
  ): Promise<void> {
    if (!entitlement) {
      await this.prisma.entitlement.deleteMany({ where: { userId } });
      return;
    }
    await this.prisma.entitlement.upsert({
      where: { userId },
      create: { userId, ...entitlement },
      update: entitlement,
    });
  }

  async grantCredits(userId: string, grant: CreditGrant): Promise<boolean> {
    try {
      await this.prisma.creditGrant.create({ data: { userId, ...grant } });
      return true;
    } catch (error) {
      // Already credited (webhook and app sync can arrive together).
      if (isUniqueViolation(error)) return false;
      throw error;
    }
  }

  async grantedCredits(userId: string): Promise<number> {
    const { _sum } = await this.prisma.creditGrant.aggregate({
      where: { userId },
      _sum: { amount: true },
    });
    return _sum.amount ?? 0;
  }

  async recordUsage(userId: string, feature: MeteredFeature): Promise<void> {
    await this.prisma.usageEvent.create({ data: { userId, feature } });
  }

  countUsage(
    userId: string,
    feature: MeteredFeature,
    since: Date,
  ): Promise<number> {
    return this.prisma.usageEvent.count({
      where: { userId, feature, createdAt: { gte: since } },
    });
  }

  countPieces(userId: string): Promise<number> {
    return this.prisma.wardrobeItem.count({ where: { userId } });
  }

  async userExists(userId: string): Promise<boolean> {
    return (await this.prisma.user.count({ where: { id: userId } })) > 0;
  }
}
