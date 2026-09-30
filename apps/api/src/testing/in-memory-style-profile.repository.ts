import type { StyleProfileFields } from '@klotho/shared';

import type {
  StoredStyleProfile,
  StyleProfileRepository,
} from '../domain/preferences/ports/style-profile.repository';
import type { Clock } from '../domain/shared/ports/clock';

export class InMemoryStyleProfileRepository implements StyleProfileRepository {
  readonly profiles = new Map<string, StoredStyleProfile>();

  constructor(private readonly clock: Clock) {}

  findByUser(userId: string): Promise<StoredStyleProfile | null> {
    return Promise.resolve(this.profiles.get(userId) ?? null);
  }

  upsert(
    userId: string,
    fields: StyleProfileFields,
  ): Promise<StoredStyleProfile> {
    const now = this.clock.now();
    const stored: StoredStyleProfile = {
      ...fields,
      userId,
      onboardedAt: this.profiles.get(userId)?.onboardedAt ?? now,
      updatedAt: now,
    };
    this.profiles.set(userId, stored);
    return Promise.resolve(stored);
  }
}
