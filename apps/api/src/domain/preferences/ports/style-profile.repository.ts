import type { StyleProfileFields } from '@klotho/shared';

export interface StoredStyleProfile extends StyleProfileFields {
  userId: string;
  onboardedAt: Date;
  updatedAt: Date;
}

export interface StyleProfileRepository {
  findByUser(userId: string): Promise<StoredStyleProfile | null>;
  /** Creates the profile (onboarding) or replaces it entirely. */
  upsert(
    userId: string,
    fields: StyleProfileFields,
  ): Promise<StoredStyleProfile>;
}

export const STYLE_PROFILE_REPOSITORY = Symbol('StyleProfileRepository');
