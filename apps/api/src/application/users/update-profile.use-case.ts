import type { UpdateProfileInput, UserProfile } from '@klotho/shared';

import type { ProfileChanges } from '../../domain/users/entities/user.entity';
import type { UserRepository } from '../../domain/users/ports/user.repository';
import type { UserProfilePresenter } from './user-profile.presenter';

export class UpdateProfileUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly profiles: UserProfilePresenter,
  ) {}

  async execute(
    userId: string,
    input: UpdateProfileInput,
  ): Promise<UserProfile> {
    // Explicit allow-list: anything else in the input is ignored, including
    // the former external `avatarUrl` (the photo goes through /users/me/avatar).
    const changes: ProfileChanges = {};
    if (input.firstName !== undefined)
      changes.firstName = input.firstName.trim();
    if (input.bio !== undefined) changes.bio = input.bio?.trim() || null;

    return this.profiles.present(
      await this.users.updateProfile(userId, changes),
    );
  }
}
