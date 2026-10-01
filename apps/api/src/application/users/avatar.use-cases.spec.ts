import { buildUploadKey } from '../../domain/storage/upload-key';
import {
  InvalidAvatarError,
  UserNotFoundError,
} from '../../domain/users/errors';
import {
  createAuthContext,
  laura,
  type AuthContext,
} from '../../testing/auth-context';

const uuid = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

describe('Profile photo (SetAvatarUseCase, RemoveAvatarUseCase)', () => {
  let ctx: AuthContext;
  let userId: string;
  let otherId: string;

  /** An upload of `owner`, present in the storage. */
  async function upload(owner: string, n: number): Promise<string> {
    const key = buildUploadKey(owner, uuid(n), { width: 10, height: 10 });
    await ctx.storage.put(key, new Uint8Array([1]), 'image/jpeg');
    return key;
  }

  const signed = (key: string) => `https://storage.test/${key}?signature=fake`;

  beforeEach(async () => {
    ctx = createAuthContext();
    ({
      user: { id: userId },
    } = await ctx.register.execute(laura));
    ({
      user: { id: otherId },
    } = await ctx.register.execute({ ...laura, email: 'other@example.com' }));
  });

  describe('SetAvatarUseCase', () => {
    it('sets an upload of the user as profile photo, with a signed link', async () => {
      const key = await upload(userId, 1);

      const profile = await ctx.setAvatar.execute(userId, key);

      expect(profile.avatarUrl).toBe(signed(key));
      expect((await ctx.users.findById(userId))?.avatarKey).toBe(key);
      expect(ctx.storage.deleted).toEqual([]);
    });

    it('removes the previous photo file', async () => {
      const first = await upload(userId, 1);
      const second = await upload(userId, 2);
      await ctx.setAvatar.execute(userId, first);

      const profile = await ctx.setAvatar.execute(userId, second);

      expect(profile.avatarUrl).toBe(signed(second));
      expect(ctx.storage.deleted).toEqual([first]);
      expect(ctx.storage.files.has(second)).toBe(true);
    });

    it('keeps the file when the same key is sent again', async () => {
      const key = await upload(userId, 1);
      await ctx.setAvatar.execute(userId, key);

      await ctx.setAvatar.execute(userId, key);

      expect(ctx.storage.deleted).toEqual([]);
    });

    it('still changes the photo when the old file cannot be removed', async () => {
      const first = await upload(userId, 1);
      const second = await upload(userId, 2);
      await ctx.setAvatar.execute(userId, first);
      ctx.storage.failing = true;

      const profile = await ctx.setAvatar.execute(userId, second);

      expect(profile.avatarUrl).toBe(signed(second));
      expect(ctx.avatarCleanupFailures).toHaveLength(1);
    });

    it.each([
      ['another user’s upload', () => upload(otherId, 1)],
      ['a malformed key', () => Promise.resolve('users/user-1/../secret.jpg')],
      [
        'a key whose file is missing',
        () =>
          Promise.resolve(
            buildUploadKey('user-1', uuid(9), { width: 1, height: 1 }),
          ),
      ],
    ])('refuses %s', async (_label, key) => {
      await expect(
        ctx.setAvatar.execute(userId, await key()),
      ).rejects.toBeInstanceOf(InvalidAvatarError);
      expect((await ctx.users.findById(userId))?.avatarKey).toBeNull();
    });

    it('refuses the photo of a piece', async () => {
      const key = await upload(userId, 1);
      const item = await ctx.wardrobe.create(userId, {
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
      await ctx.photos.add(
        { itemId: item.id, storageKey: key, width: 10, height: 10 },
        5,
      );

      await expect(ctx.setAvatar.execute(userId, key)).rejects.toBeInstanceOf(
        InvalidAvatarError,
      );
    });

    it('fails for an account that no longer exists', async () => {
      await expect(
        ctx.setAvatar.execute('missing', 'any'),
      ).rejects.toBeInstanceOf(UserNotFoundError);
    });
  });

  describe('RemoveAvatarUseCase', () => {
    it('removes the photo and its file', async () => {
      const key = await upload(userId, 1);
      await ctx.setAvatar.execute(userId, key);

      const profile = await ctx.removeAvatar.execute(userId);

      expect(profile.avatarUrl).toBeNull();
      expect((await ctx.users.findById(userId))?.avatarKey).toBeNull();
      expect(ctx.storage.deleted).toEqual([key]);
    });

    it('is idempotent', async () => {
      const profile = await ctx.removeAvatar.execute(userId);

      expect(profile.avatarUrl).toBeNull();
      expect(ctx.storage.deleted).toEqual([]);
    });
  });
});
