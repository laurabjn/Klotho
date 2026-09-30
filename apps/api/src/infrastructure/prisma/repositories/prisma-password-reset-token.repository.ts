import { Injectable } from '@nestjs/common';

import type {
  NewPasswordResetToken,
  PasswordResetTokenRecord,
  PasswordResetTokenRepository,
} from '../../../domain/auth/ports/password-reset-token.repository';
import { PrismaService } from '../prisma.service';

const select = {
  id: true,
  userId: true,
  tokenHash: true,
  expiresAt: true,
  usedAt: true,
} as const;

@Injectable()
export class PrismaPasswordResetTokenRepository implements PasswordResetTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(token: NewPasswordResetToken): Promise<PasswordResetTokenRecord> {
    return this.prisma.passwordResetToken.create({ data: token, select });
  }

  findByHash(tokenHash: string): Promise<PasswordResetTokenRecord | null> {
    return this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      select,
    });
  }

  async markUsed(id: string, at: Date): Promise<boolean> {
    // Conditional update: only one concurrent caller can consume the token.
    const { count } = await this.prisma.passwordResetToken.updateMany({
      where: { id, usedAt: null },
      data: { usedAt: at },
    });
    return count === 1;
  }

  async invalidateAllForUser(userId: string, at: Date): Promise<void> {
    await this.prisma.passwordResetToken.updateMany({
      where: { userId, usedAt: null },
      data: { usedAt: at },
    });
  }
}
