import type { UserProfile } from '@klotho/shared';

import { UserNotFoundError } from '../../domain/users/errors';
import type { UserRepository } from '../../domain/users/ports/user.repository';
import type { UserProfilePresenter } from './user-profile.presenter';

export class GetCurrentUserUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly profiles: UserProfilePresenter,
  ) {}

  async execute(userId: string): Promise<UserProfile> {
    const user = await this.users.findById(userId);
    if (!user) throw new UserNotFoundError();
    return this.profiles.present(user);
  }
}
