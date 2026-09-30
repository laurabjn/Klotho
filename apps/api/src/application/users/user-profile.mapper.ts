import type { UserProfile } from '@klotho/shared';

import type { User } from '../../domain/users/entities/user.entity';

/** The only way a user leaves the API: the password hash is never exposed. */
export function toUserProfile(user: User): UserProfile {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt.toISOString(),
  };
}
