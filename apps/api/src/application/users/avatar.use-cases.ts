import type { UserProfile } from '@klotho/shared';

import type { FileStorage } from '../../domain/storage/ports/file-storage';
import { parseUploadKey } from '../../domain/storage/upload-key';
import type { User } from '../../domain/users/entities/user.entity';
import {
  InvalidAvatarError,
  UserNotFoundError,
} from '../../domain/users/errors';
import type { UserRepository } from '../../domain/users/ports/user.repository';
import type { WardrobePhotoRepository } from '../../domain/wardrobe/ports/wardrobe-photo.repository';
import type { UserProfilePresenter } from './user-profile.presenter';

/** Told when the previous photo could not be removed; never receives its key. */
export type AvatarCleanupReporter = (error: unknown) => void;

abstract class AvatarUseCase {
  constructor(
    protected readonly users: UserRepository,
    protected readonly storage: FileStorage,
    protected readonly profiles: UserProfilePresenter,
    private readonly reportCleanupFailure: AvatarCleanupReporter,
  ) {}

  protected async findUser(userId: string): Promise<User> {
    const user = await this.users.findById(userId);
    if (!user) throw new UserNotFoundError();
    return user;
  }

  /** Best effort: a storage outage must not undo the profile change. */
  protected async removeFile(key: string | null): Promise<void> {
    if (!key) return;
    try {
      await this.storage.delete([key]);
    } catch (error) {
      this.reportCleanupFailure(error);
    }
  }
}

/**
 * The profile photo is a picture uploaded with POST /uploads/wardrobe (same
 * checks: real image, no metadata). The previous photo file is removed.
 */
export class SetAvatarUseCase extends AvatarUseCase {
  constructor(
    users: UserRepository,
    private readonly photos: WardrobePhotoRepository,
    storage: FileStorage,
    profiles: UserProfilePresenter,
    reportCleanupFailure: AvatarCleanupReporter = () => {},
  ) {
    super(users, storage, profiles, reportCleanupFailure);
  }

  async execute(userId: string, key: string): Promise<UserProfile> {
    const user = await this.findUser(userId);
    if (key === user.avatarKey) return this.profiles.present(user);

    // Only an upload of this very user, still stored, and not the photo of a
    // piece (removing the avatar would delete the piece's file).
    if (
      !parseUploadKey(key, userId) ||
      !(await this.storage.exists(key)) ||
      (await this.photos.isStorageKeyUsed(key))
    ) {
      throw new InvalidAvatarError();
    }

    const updated = await this.users.updateProfile(userId, { avatarKey: key });
    await this.removeFile(user.avatarKey);
    return this.profiles.present(updated);
  }
}

/** Idempotent: without a photo, simply returns the profile. */
export class RemoveAvatarUseCase extends AvatarUseCase {
  constructor(
    users: UserRepository,
    storage: FileStorage,
    profiles: UserProfilePresenter,
    reportCleanupFailure: AvatarCleanupReporter = () => {},
  ) {
    super(users, storage, profiles, reportCleanupFailure);
  }

  async execute(userId: string): Promise<UserProfile> {
    const user = await this.findUser(userId);
    if (!user.avatarKey) return this.profiles.present(user);

    const updated = await this.users.updateProfile(userId, { avatarKey: null });
    await this.removeFile(user.avatarKey);
    return this.profiles.present(updated);
  }
}
