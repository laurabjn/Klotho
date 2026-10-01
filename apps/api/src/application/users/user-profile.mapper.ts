import type { UserProfile } from '@klotho/shared';

import type { User } from '../../domain/users/entities/user.entity';

/** What the profile shows beyond the user row (see UserProfilePresenter). */
export interface ProfileExtras {
  /** Signed link to the profile photo. */
  avatarUrl: string | null;
  pendingEmail: string | null;
}

const NO_EXTRAS: ProfileExtras = { avatarUrl: null, pendingEmail: null };

/** The only way a user leaves the API: the password hash is never exposed. */
export function toUserProfile(
  user: User,
  extras: ProfileExtras = NO_EXTRAS,
): UserProfile {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    bio: user.bio,
    avatarUrl: extras.avatarUrl,
    pendingEmail: extras.pendingEmail,
    createdAt: user.createdAt.toISOString(),
  };
}
