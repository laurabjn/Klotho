import type { UserProfile } from '@klotho/shared';

import type { Clock } from '../../domain/shared/ports/clock';
import type { FileStorage } from '../../domain/storage/ports/file-storage';
import type { User } from '../../domain/users/entities/user.entity';
import type { EmailChangeTokenRepository } from '../../domain/users/ports/email-change-token.repository';
import { toUserProfile } from './user-profile.mapper';

/**
 * Builds the UserProfile sent to the app: the profile photo as a short-lived
 * signed URL (like the photos of the pieces) and the address waiting for its
 * confirmation link, if any.
 */
export class UserProfilePresenter {
  constructor(
    private readonly storage: Pick<FileStorage, 'signedUrl'>,
    private readonly emailChanges: Pick<
      EmailChangeTokenRepository,
      'findPendingForUser'
    >,
    private readonly clock: Clock,
  ) {}

  async present(user: User): Promise<UserProfile> {
    const [avatarUrl, pending] = await Promise.all([
      user.avatarKey ? this.storage.signedUrl(user.avatarKey) : null,
      this.emailChanges.findPendingForUser(user.id, this.clock.now()),
    ]);
    return toUserProfile(user, {
      avatarUrl,
      pendingEmail: pending?.newEmail ?? null,
    });
  }
}
