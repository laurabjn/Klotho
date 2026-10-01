import { Injectable } from '@nestjs/common';

import type {
  EmailChangeTokenRecord,
  EmailChangeTokenRepository,
  NewEmailChangeToken,
} from '../../../domain/users/ports/email-change-token.repository';
import { PrismaService } from '../prisma.service';

const select = {
  id: true,
  userId: true,
  newEmail: true,
  tokenHash: true,
  expiresAt: true,
} as const;

@Injectable()
export class PrismaEmailChangeTokenRepository implements EmailChangeTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  replaceForUser(token: NewEmailChangeToken): Promise<EmailChangeTokenRecord> {
    // One row per user (unique userId): the upsert replaces the previous link.
    const { userId, ...request } = token;
    return this.prisma.emailChangeToken.upsert({
      where: { userId },
      create: token,
      update: { ...request, createdAt: new Date() },
      select,
    });
  }

  findByHash(tokenHash: string): Promise<EmailChangeTokenRecord | null> {
    return this.prisma.emailChangeToken.findUnique({
      where: { tokenHash },
      select,
    });
  }

  findPendingForUser(
    userId: string,
    now: Date,
  ): Promise<EmailChangeTokenRecord | null> {
    return this.prisma.emailChangeToken.findFirst({
      where: { userId, expiresAt: { gt: now } },
      select,
    });
  }

  async consume(id: string): Promise<boolean> {
    // Conditional delete: only one concurrent caller can consume the token.
    const { count } = await this.prisma.emailChangeToken.deleteMany({
      where: { id },
    });
    return count === 1;
  }

  async deleteAllForUser(userId: string): Promise<void> {
    await this.prisma.emailChangeToken.deleteMany({ where: { userId } });
  }
}
