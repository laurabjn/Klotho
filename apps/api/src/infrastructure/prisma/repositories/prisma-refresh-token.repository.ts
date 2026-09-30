import { Injectable } from '@nestjs/common';

import type {
  NewRefreshToken,
  RefreshTokenRecord,
  RefreshTokenRepository,
} from '../../../domain/auth/ports/refresh-token.repository';
import { PrismaService } from '../prisma.service';

const select = {
  id: true,
  userId: true,
  tokenHash: true,
  familyId: true,
  expiresAt: true,
  revokedAt: true,
} as const;

@Injectable()
export class PrismaRefreshTokenRepository implements RefreshTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(token: NewRefreshToken): Promise<RefreshTokenRecord> {
    return this.prisma.refreshToken.create({ data: token, select });
  }

  findByHash(tokenHash: string): Promise<RefreshTokenRecord | null> {
    return this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      select,
    });
  }

  async revoke(id: string, at: Date): Promise<boolean> {
    // Conditional update: only one concurrent caller can win.
    const { count } = await this.prisma.refreshToken.updateMany({
      where: { id, revokedAt: null },
      data: { revokedAt: at },
    });
    return count === 1;
  }

  async revokeFamily(familyId: string, at: Date): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { familyId, revokedAt: null },
      data: { revokedAt: at },
    });
  }

  async revokeAllForUser(userId: string, at: Date): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: at },
    });
  }
}
