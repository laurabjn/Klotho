import type { PasswordHasher } from '../../domain/auth/ports/password-hasher';
import type { FileStorage } from '../../domain/storage/ports/file-storage';
import { userStoragePrefix } from '../../domain/storage/upload-key';
import {
  InvalidPasswordError,
  UserNotFoundError,
} from '../../domain/users/errors';
import type { UserRepository } from '../../domain/users/ports/user.repository';
import type { WardrobeRepository } from '../../domain/wardrobe/ports/wardrobe.repository';

/** Told when photo files could not be removed; never receives keys or URLs. */
export type StorageCleanupReporter = (failure: {
  step: 'photos' | 'uploads';
  error: unknown;
}) => void;

/**
 * RGPD "droit à l'effacement": after checking the password, deletes the
 * account with everything it owns (database cascade), then its files.
 * Files are removed on a best-effort basis: a storage outage must not keep
 * the personal data in the database.
 */
export class DeleteAccountUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly hasher: PasswordHasher,
    private readonly wardrobe: WardrobeRepository,
    private readonly storage: FileStorage,
    private readonly reportCleanupFailure: StorageCleanupReporter = () => {},
  ) {}

  async execute(userId: string, password: string): Promise<void> {
    const user = await this.users.findById(userId);
    if (!user) throw new UserNotFoundError();
    if (!(await this.hasher.verify(password, user.passwordHash))) {
      throw new InvalidPasswordError();
    }

    // Read before the cascade removes the photo rows.
    const items = await this.wardrobe.findAllOwned(userId);
    const photoKeys = items.flatMap((item) =>
      item.photos.map((photo) => photo.storageKey),
    );

    if (!(await this.users.delete(userId))) throw new UserNotFoundError();

    await this.cleanUp('photos', () => this.storage.delete(photoKeys));
    // Uploads never attached to a piece only exist in the storage.
    await this.cleanUp('uploads', async () => {
      const leftovers = await this.storage.list(userStoragePrefix(userId));
      await this.storage.delete(leftovers);
    });
  }

  private async cleanUp(
    step: 'photos' | 'uploads',
    run: () => Promise<void>,
  ): Promise<void> {
    try {
      await run();
    } catch (error) {
      this.reportCleanupFailure({ step, error });
    }
  }
}
