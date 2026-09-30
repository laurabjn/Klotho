import type { UserProfile } from '@klotho/shared';

import { UserNotFoundError } from '../../domain/users/errors';
import type { UserRepository } from '../../domain/users/ports/user.repository';
import { toUserProfile } from './user-profile.mapper';

export class GetCurrentUserUseCase {
  constructor(private readonly users: UserRepository) {}

  async execute(userId: string): Promise<UserProfile> {
    const user = await this.users.findById(userId);
    if (!user) throw new UserNotFoundError();
    return toUserProfile(user);
  }
}
