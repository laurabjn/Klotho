import { buildUploadKey } from '../../domain/storage/upload-key';
import {
  InvalidPasswordError,
  UserNotFoundError,
} from '../../domain/users/errors';
import {
  createAuthContext,
  laura,
  type AuthContext,
} from '../../testing/auth-context';
import { InMemoryWardrobeRepository } from '../../testing/in-memory-wardrobe.repository';
import {
  InMemoryFileStorage,
  InMemoryWardrobePhotoRepository,
} from '../../testing/storage-fakes';
import {
  DeleteAccountUseCase,
  type StorageCleanupReporter,
} from './delete-account.use-case';

const uuid = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

describe('DeleteAccountUseCase', () => {
  let ctx: AuthContext;
  let wardrobe: InMemoryWardrobeRepository;
  let photos: InMemoryWardrobePhotoRepository;
  let storage: InMemoryFileStorage;
  let failures: Parameters<StorageCleanupReporter>[0][];
  let deleteAccount: DeleteAccountUseCase;
  let userId: string;
  let otherId: string;

  /** A piece with one photo per key, files present in the storage. */
  async function pieceWithPhotos(owner: string, keys: string[]) {
    const item = await wardrobe.create(owner, {
      name: null,
      category: 'TOP',
      subcategory: null,
      primaryColor: 'ecru',
      secondaryColors: [],
      pattern: null,
      material: null,
      styles: [],
      seasons: [],
      minTemperature: null,
      maxTemperature: null,
      warmthLevel: null,
      formalityLevel: null,
      brand: null,
      size: null,
      status: 'AVAILABLE',
    });
    for (const key of keys) {
      await storage.put(key, new Uint8Array([1]), 'image/jpeg');
      await photos.add(
        { itemId: item.id, storageKey: key, width: 10, height: 10 },
        5,
      );
    }
    return item;
  }

  const key = (owner: string, n: number) =>
    buildUploadKey(owner, uuid(n), { width: 10, height: 10 });

  beforeEach(async () => {
    ctx = createAuthContext();
    wardrobe = new InMemoryWardrobeRepository(ctx.clock);
    photos = new InMemoryWardrobePhotoRepository(wardrobe, ctx.clock);
    storage = new InMemoryFileStorage();
    failures = [];
    deleteAccount = new DeleteAccountUseCase(
      ctx.users,
      ctx.hasher,
      wardrobe,
      storage,
      (failure) => failures.push(failure),
    );
    ({
      user: { id: userId },
    } = await ctx.register.execute(laura));
    ({
      user: { id: otherId },
    } = await ctx.register.execute({ ...laura, email: 'other@example.com' }));
  });

  it('refuses a wrong password and keeps everything', async () => {
    await pieceWithPhotos(userId, [key(userId, 1)]);

    await expect(
      deleteAccount.execute(userId, 'Wrong2026!'),
    ).rejects.toBeInstanceOf(InvalidPasswordError);

    expect(await ctx.users.findById(userId)).not.toBeNull();
    expect(storage.files.size).toBe(1);
    expect(storage.deleted).toEqual([]);
  });

  it('fails for an account that no longer exists', async () => {
    await expect(
      deleteAccount.execute('missing', laura.password),
    ).rejects.toBeInstanceOf(UserNotFoundError);
  });

  it('deletes the account and every file of the user, only hers', async () => {
    await pieceWithPhotos(userId, [key(userId, 1), key(userId, 2)]);
    await pieceWithPhotos(userId, [key(userId, 3)]);
    await pieceWithPhotos(otherId, [key(otherId, 4)]);
    // An upload never attached to a piece.
    await storage.put(key(userId, 5), new Uint8Array([1]), 'image/jpeg');

    await deleteAccount.execute(userId, laura.password);

    expect(await ctx.users.findById(userId)).toBeNull();
    expect(await ctx.users.findById(otherId)).not.toBeNull();
    expect(storage.deleted).toEqual(
      expect.arrayContaining([1, 2, 3, 5].map((n) => key(userId, n))),
    );
    expect([...storage.files.keys()]).toEqual([key(otherId, 4)]);
    expect(failures).toEqual([]);
  });

  it('still deletes the account when the storage is down', async () => {
    await pieceWithPhotos(userId, [key(userId, 1)]);
    storage.failing = true;

    await deleteAccount.execute(userId, laura.password);

    expect(await ctx.users.findById(userId)).toBeNull();
    expect(failures.map((failure) => failure.step)).toEqual([
      'photos',
      'uploads',
    ]);
  });
});
