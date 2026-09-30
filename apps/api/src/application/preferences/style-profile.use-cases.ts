import {
  styleProfileSchema,
  type StyleProfile,
  type StyleProfileFields,
} from '@klotho/shared';

import type {
  StoredStyleProfile,
  StyleProfileRepository,
} from '../../domain/preferences/ports/style-profile.repository';

/** A user who never went through the onboarding has an empty profile. */
const EMPTY_PROFILE: StyleProfileFields = styleProfileSchema.parse({});

function toDto(stored: StoredStyleProfile | null): StyleProfile {
  if (!stored) return { ...EMPTY_PROFILE, onboardingCompleted: false };
  const {
    userId: _owner,
    onboardedAt: _at,
    updatedAt: _updated,
    ...fields
  } = stored;
  return { ...fields, onboardingCompleted: true };
}

export class GetStyleProfileUseCase {
  constructor(private readonly profiles: StyleProfileRepository) {}

  async execute(userId: string): Promise<StyleProfile> {
    return toDto(await this.profiles.findByUser(userId));
  }
}

/**
 * PUT semantics: the given profile replaces the previous one. The first save
 * (completing or skipping the onboarding) marks the onboarding as done.
 */
export class UpdateStyleProfileUseCase {
  constructor(private readonly profiles: StyleProfileRepository) {}

  async execute(
    userId: string,
    fields: StyleProfileFields,
  ): Promise<StyleProfile> {
    return toDto(await this.profiles.upsert(userId, fields));
  }
}
