import { createWardrobeItemSchema } from '@klotho/shared';

import {
  InvalidImageError,
  UploadNotFoundError,
} from '../../../domain/storage/errors';
import {
  PhotoLimitReachedError,
  WardrobeItemNotFoundError,
  WardrobePhotoNotFoundError,
} from '../../../domain/wardrobe/errors';
import { FixedClock } from '../../../testing/fakes';
import { InMemoryWardrobeRepository } from '../../../testing/in-memory-wardrobe.repository';
import {
  fakeImage,
  FakeImageProcessor,
  InMemoryFileStorage,
  InMemoryWardrobePhotoRepository,
} from '../../../testing/storage-fakes';
import { CreateWardrobeItemUseCase } from '../create-wardrobe-item.use-case';
import { DeleteWardrobeItemUseCase } from '../delete-wardrobe-item.use-case';
import { AddWardrobePhotoUseCase } from './add-wardrobe-photo.use-case';
import { DeleteWardrobePhotoUseCase } from './delete-wardrobe-photo.use-case';
import { SetMainWardrobePhotoUseCase } from './set-main-wardrobe-photo.use-case';
import { UploadWardrobePhotoUseCase } from './upload-wardrobe-photo.use-case';

const LAURA = 'user-laura';
const OTHER = 'user-other';

describe('Wardrobe photos', () => {
  let storage: InMemoryFileStorage;
  let wardrobe: InMemoryWardrobeRepository;
  let upload: UploadWardrobePhotoUseCase;
  let add: AddWardrobePhotoUseCase;
  let removePhoto: DeleteWardrobePhotoUseCase;
  let setMain: SetMainWardrobePhotoUseCase;
  let removeItem: DeleteWardrobeItemUseCase;
  let itemId: string;

  /** Upload + attach, as the app does. */
  async function addPhoto(userId = LAURA, target = itemId) {
    const { key } = await upload.execute(userId, fakeImage());
    return add.execute(userId, target, key);
  }

  beforeEach(async () => {
    const clock = new FixedClock();
    storage = new InMemoryFileStorage();
    wardrobe = new InMemoryWardrobeRepository(clock);
    const photos = new InMemoryWardrobePhotoRepository(wardrobe, clock);
    upload = new UploadWardrobePhotoUseCase(new FakeImageProcessor(), storage);
    add = new AddWardrobePhotoUseCase(wardrobe, photos, storage, {
      maxPerItem: 3,
    });
    removePhoto = new DeleteWardrobePhotoUseCase(wardrobe, photos, storage);
    setMain = new SetMainWardrobePhotoUseCase(wardrobe, photos, storage);
    removeItem = new DeleteWardrobeItemUseCase(wardrobe, storage);

    const create = new CreateWardrobeItemUseCase(wardrobe, storage);
    ({ id: itemId } = await create.execute(
      LAURA,
      createWardrobeItemSchema.parse({ category: 'TOP', primaryColor: 'ecru' }),
    ));
  });

  describe('UploadWardrobePhotoUseCase', () => {
    it('stores the normalised image under a key owned by the user', async () => {
      const uploaded = await upload.execute(LAURA, fakeImage());

      expect(uploaded).toEqual({
        key: expect.stringMatching(
          /^users\/user-laura\/photos\/[0-9a-f-]{36}_1200x1600\.jpg$/,
        ),
        width: 1200,
        height: 1600,
      });
      expect(storage.files.get(uploaded.key)?.contentType).toBe('image/jpeg');
    });

    it('refuses a file that is not an image', async () => {
      await expect(
        upload.execute(LAURA, new TextEncoder().encode('%PDF-1.7')),
      ).rejects.toBeInstanceOf(InvalidImageError);
      expect(storage.files.size).toBe(0);
    });
  });

  describe('AddWardrobePhotoUseCase', () => {
    it('makes the first photo the main one', async () => {
      const item = await addPhoto();

      expect(item.photos).toEqual([
        {
          id: expect.any(String),
          url: expect.stringContaining('signature'),
          width: 1200,
          height: 1600,
          isMain: true,
        },
      ]);
      expect(JSON.stringify(item)).not.toContain('storageKey');
    });

    it('keeps the order in which photos were added', async () => {
      await addPhoto();
      await addPhoto();
      const item = await addPhoto();

      expect(item.photos.map((p) => p.isMain)).toEqual([true, false, false]);
      expect(new Set(item.photos.map((p) => p.id)).size).toBe(3);
    });

    it('refuses more photos than the limit', async () => {
      await addPhoto();
      await addPhoto();
      await addPhoto();

      await expect(addPhoto()).rejects.toBeInstanceOf(PhotoLimitReachedError);
    });

    it("refuses to attach another user's upload", async () => {
      const { key } = await upload.execute(OTHER, fakeImage());

      await expect(add.execute(LAURA, itemId, key)).rejects.toBeInstanceOf(
        UploadNotFoundError,
      );
    });

    it('refuses a key that was never uploaded', async () => {
      const key = `users/${LAURA}/photos/0b7e5c1e-8a8e-4a57-9b77-2d3f0c1a9e11_10x10.jpg`;

      await expect(add.execute(LAURA, itemId, key)).rejects.toBeInstanceOf(
        UploadNotFoundError,
      );
    });

    it("refuses to add a photo to another user's item", async () => {
      await expect(addPhoto(OTHER, itemId)).rejects.toBeInstanceOf(
        WardrobeItemNotFoundError,
      );
    });
  });

  describe('SetMain / Delete', () => {
    it('changes the main photo, which is listed first', async () => {
      await addPhoto();
      const withTwo = await addPhoto();
      const second = withTwo.photos[1]!.id;

      const item = await setMain.execute(LAURA, itemId, second);

      expect(item.photos[0]).toMatchObject({ id: second, isMain: true });
      expect(item.photos.filter((p) => p.isMain)).toHaveLength(1);
    });

    it('deletes a photo and its file, keeping the item', async () => {
      const { photos } = await addPhoto();

      const item = await removePhoto.execute(LAURA, itemId, photos[0]!.id);

      expect(item.photos).toEqual([]);
      expect(storage.files.size).toBe(0);
    });

    it('promotes the next photo when the main one is deleted', async () => {
      await addPhoto();
      const { photos } = await addPhoto();

      const item = await removePhoto.execute(LAURA, itemId, photos[0]!.id);

      expect(item.photos).toEqual([
        expect.objectContaining({ id: photos[1]!.id, isMain: true }),
      ]);
    });

    it('404 for an unknown photo', async () => {
      await expect(
        removePhoto.execute(LAURA, itemId, 'nope'),
      ).rejects.toBeInstanceOf(WardrobePhotoNotFoundError);
    });

    it("cannot touch the photos of another user's item", async () => {
      const { photos } = await addPhoto();

      await expect(
        removePhoto.execute(OTHER, itemId, photos[0]!.id),
      ).rejects.toBeInstanceOf(WardrobeItemNotFoundError);
      await expect(
        setMain.execute(OTHER, itemId, photos[0]!.id),
      ).rejects.toBeInstanceOf(WardrobeItemNotFoundError);
      expect(storage.files.size).toBe(1);
    });
  });

  it('deleting an item deletes its photo files', async () => {
    await addPhoto();
    await addPhoto();

    await removeItem.execute(LAURA, itemId);

    expect(storage.files.size).toBe(0);
  });
});
