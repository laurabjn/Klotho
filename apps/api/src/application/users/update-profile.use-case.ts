import type { UpdateProfileInput, UserProfile } from '@klotho/shared';

import type { ProfileChanges } from '../../domain/users/entities/user.entity';
import type { UserRepository } from '../../domain/users/ports/user.repository';
import { toUserProfile } from './user-profile.mapper';

export class UpdateProfileUseCase {
  constructor(private readonly users: UserRepository) {}

  async execute(
    userId: string,
    input: UpdateProfileInput,
  ): Promise<UserProfile> {
    // Explicit allow-list: anything else in the input is ignored.
    const changes: ProfileChanges = {};
    if (input.firstName !== undefined)
      changes.firstName = input.firstName.trim();
    if (input.avatarUrl !== undefined) changes.avatarUrl = input.avatarUrl;

    return toUserProfile(await this.users.updateProfile(userId, changes));
  }
}
