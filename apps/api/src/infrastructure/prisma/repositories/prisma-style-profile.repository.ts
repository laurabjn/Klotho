import { Injectable } from '@nestjs/common';
import type { StyleProfileFields } from '@klotho/shared';

import type {
  StoredStyleProfile,
  StyleProfileRepository,
} from '../../../domain/preferences/ports/style-profile.repository';
import { PrismaService } from '../prisma.service';

const select = {
  userId: true,
  preferredStyles: true,
  preferredColors: true,
  avoidedColors: true,
  facePreferredColors: true,
  colorSeason: true,
  preferredMetals: true,
  acceptsHeels: true,
  preferredBottoms: true,
  preferredFormality: true,
  minLength: true,
  avoidsDeepNeckline: true,
  onboardedAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class PrismaStyleProfileRepository implements StyleProfileRepository {
  constructor(private readonly prisma: PrismaService) {}

  // Taxonomy keys are validated by the shared schema before being stored.
  async findByUser(userId: string): Promise<StoredStyleProfile | null> {
    return (await this.prisma.styleProfile.findUnique({
      where: { userId },
      select,
    })) as StoredStyleProfile | null;
  }

  async upsert(
    userId: string,
    fields: StyleProfileFields,
  ): Promise<StoredStyleProfile> {
    return (await this.prisma.styleProfile.upsert({
      where: { userId },
      create: { ...fields, userId },
      update: fields,
      select,
    })) as StoredStyleProfile;
  }
}
