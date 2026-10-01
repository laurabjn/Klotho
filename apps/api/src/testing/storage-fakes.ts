import type { WardrobePhoto } from '../domain/wardrobe/entities/wardrobe-item.entity';
import type {
  NewWardrobePhoto,
  WardrobePhotoRepository,
} from '../domain/wardrobe/ports/wardrobe-photo.repository';
import { InvalidImageError } from '../domain/storage/errors';
import type { FileStorage } from '../domain/storage/ports/file-storage';
import type {
  ImageProcessor,
  ProcessedImage,
} from '../domain/storage/ports/image-processor';
import type { Clock } from '../domain/shared/ports/clock';
import type { InMemoryWardrobeRepository } from './in-memory-wardrobe.repository';

export class InMemoryFileStorage implements FileStorage {
  readonly files = new Map<string, { body: Uint8Array; contentType: string }>();
  /** Every key passed to delete(), in order. */
  readonly deleted: string[] = [];
  /** When set, delete() and list() fail (storage outage). */
  failing = false;

  put(key: string, body: Uint8Array, contentType: string): Promise<void> {
    this.files.set(key, { body, contentType });
    return Promise.resolve();
  }

  exists(key: string): Promise<boolean> {
    return Promise.resolve(this.files.has(key));
  }

  delete(keys: string[]): Promise<void> {
    if (this.failing) return Promise.reject(new Error('storage is down'));
    this.deleted.push(...keys);
    for (const key of keys) this.files.delete(key);
    return Promise.resolve();
  }

  list(prefix: string): Promise<string[]> {
    if (this.failing) return Promise.reject(new Error('storage is down'));
    return Promise.resolve(
      [...this.files.keys()].filter((key) => key.startsWith(prefix)),
    );
  }

  signedUrl(key: string): Promise<string> {
    return Promise.resolve(`https://storage.test/${key}?signature=fake`);
  }
}

/** Accepts any bytes starting with "IMG"; reports a 1200x1600 JPEG. */
export class FakeImageProcessor implements ImageProcessor {
  normalize(input: Uint8Array): Promise<ProcessedImage> {
    if (new TextDecoder().decode(input.slice(0, 3)) !== 'IMG') {
      return Promise.reject(new InvalidImageError());
    }
    return Promise.resolve({
      bytes: input,
      contentType: 'image/jpeg',
      width: 1200,
      height: 1600,
    });
  }
}

export const fakeImage = () => new TextEncoder().encode('IMG fake picture');

/** Works on the items of an InMemoryWardrobeRepository. */
export class InMemoryWardrobePhotoRepository implements WardrobePhotoRepository {
  private sequence = 0;

  constructor(
    private readonly wardrobe: InMemoryWardrobeRepository,
    private readonly clock: Clock,
  ) {}

  private photosOf(itemId: string): WardrobePhoto[] {
    const item = this.wardrobe.items.find((i) => i.id === itemId);
    if (!item) throw new Error(`Unknown item ${itemId}`);
    return item.photos;
  }

  add(photo: NewWardrobePhoto, max: number): Promise<WardrobePhoto | null> {
    const photos = this.photosOf(photo.itemId);
    if (photos.length >= max) return Promise.resolve(null);
    const created: WardrobePhoto = {
      ...photo,
      id: `photo-${++this.sequence}`,
      position: Math.max(-1, ...photos.map((p) => p.position)) + 1,
      isMain: photos.length === 0,
      createdAt: this.clock.now(),
    };
    photos.push(created);
    return Promise.resolve(created);
  }

  find(itemId: string, photoId: string): Promise<WardrobePhoto | null> {
    return Promise.resolve(
      this.photosOf(itemId).find((p) => p.id === photoId) ?? null,
    );
  }

  remove(itemId: string, photoId: string): Promise<void> {
    const photos = this.photosOf(itemId);
    const index = photos.findIndex((p) => p.id === photoId);
    if (index === -1) return Promise.resolve();
    const [removed] = photos.splice(index, 1);
    if (removed?.isMain && photos.length > 0) {
      const next = [...photos].sort((a, b) => a.position - b.position)[0]!;
      next.isMain = true;
    }
    return Promise.resolve();
  }

  setMain(itemId: string, photoId: string): Promise<void> {
    for (const photo of this.photosOf(itemId))
      photo.isMain = photo.id === photoId;
    return Promise.resolve();
  }
}
